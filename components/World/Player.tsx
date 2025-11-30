

/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import React, { useRef, useEffect, useMemo, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useStore } from '../../store';
import { LANE_WIDTH, GameStatus } from '../../types';
import { audio } from '../System/Audio';

// Physics Constants
const GRAVITY = 50;
const JUMP_FORCE = 16; 

// Geometries
const TORSO_GEO = new THREE.CylinderGeometry(0.25, 0.15, 0.6, 4);
const JETPACK_GEO = new THREE.BoxGeometry(0.3, 0.4, 0.15);
const GLOW_STRIP_GEO = new THREE.PlaneGeometry(0.05, 0.2);
const HEAD_GEO = new THREE.BoxGeometry(0.25, 0.3, 0.3);
const ARM_GEO = new THREE.BoxGeometry(0.12, 0.6, 0.12);
const JOINT_SPHERE_GEO = new THREE.SphereGeometry(0.07);
const HIPS_GEO = new THREE.CylinderGeometry(0.16, 0.16, 0.2);
const LEG_GEO = new THREE.BoxGeometry(0.15, 0.7, 0.15);
const SHADOW_GEO = new THREE.CircleGeometry(0.5, 32);
const SHIELD_GEO = new THREE.SphereGeometry(1.2, 32, 32);
const MAGNET_FIELD_GEO = new THREE.IcosahedronGeometry(2.0, 1);

// Rocket Model Geometries
const ROCKET_BODY_GEO = new THREE.CylinderGeometry(0.2, 0.3, 2.0, 8);
const ROCKET_FIN_GEO = new THREE.BufferGeometry();
// Create a simple triangle fin
const finVertices = new Float32Array([
  0, 0, 0,
  0.5, -0.5, 0,
  0, -1.0, 0
]);
ROCKET_FIN_GEO.setAttribute('position', new THREE.BufferAttribute(finVertices, 3));

export const Player: React.FC = () => {
  const groupRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const shadowRef = useRef<THREE.Mesh>(null);
  const shieldRef = useRef<THREE.Mesh>(null);
  const magnetRef = useRef<THREE.Group>(null);
  const rocketRef = useRef<THREE.Group>(null);
  
  // Limb Refs
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);

  const { status, laneCount, takeDamage, hasDoubleJump, activeEffects } = useStore();
  
  const [lane, setLane] = React.useState(0);
  const targetX = useRef(0);
  
  // Physics State
  const isJumping = useRef(false);
  const velocityY = useRef(0);
  const jumpsPerformed = useRef(0); 
  const spinRotation = useRef(0); 
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isInvincible = useRef(false);
  const lastDamageTime = useRef(0);

  // Materials
  const materials = useMemo(() => {
      return {
          armor: new THREE.MeshStandardMaterial({ color: '#00aaff', roughness: 0.3, metalness: 0.8 }),
          joint: new THREE.MeshStandardMaterial({ color: '#111111', roughness: 0.7, metalness: 0.5 }),
          glow: new THREE.MeshBasicMaterial({ color: '#00ffff' }),
          shadow: new THREE.MeshBasicMaterial({ color: '#000000', opacity: 0.3, transparent: true }),
          shield: new THREE.MeshStandardMaterial({ 
              color: '#ffd700', 
              transparent: true, 
              opacity: 0.3, 
              emissive: '#ffd700', 
              emissiveIntensity: 0.5,
              side: THREE.DoubleSide
          }),
          magnetField: new THREE.MeshBasicMaterial({
              color: '#9900ff',
              wireframe: true,
              transparent: true,
              opacity: 0.2
          }),
          magnetCore: new THREE.MeshBasicMaterial({
              color: '#000000',
              transparent: true,
              opacity: 0.5
          }),
          rocketBody: new THREE.MeshStandardMaterial({ color: '#ff0000', metalness: 0.8, roughness: 0.2 }),
          rocketFin: new THREE.MeshStandardMaterial({ color: '#eeeeee', metalness: 0.5 })
      };
  }, []);

  // Update Appearance based on Potion
  useEffect(() => {
     if (materials.armor) {
         if (activeEffects.potion) {
             materials.armor.color.set('#00ff00');
             materials.armor.emissive.set('#00ff00');
             materials.armor.emissiveIntensity = 0.5;
         } else {
             materials.armor.color.set('#00aaff');
             materials.armor.emissive.set('#000000');
             materials.armor.emissiveIntensity = 0;
         }
     }
  }, [activeEffects.potion, materials]);

  // Reset State on Game Start
  useEffect(() => {
      if (status === GameStatus.PLAYING) {
          isJumping.current = false;
          jumpsPerformed.current = 0;
          velocityY.current = 0;
          spinRotation.current = 0;
          if (groupRef.current) groupRef.current.position.y = 0;
          if (bodyRef.current) bodyRef.current.rotation.x = 0;
      }
  }, [status]);
  
  useEffect(() => {
      const maxLane = Math.floor(laneCount / 2);
      if (Math.abs(lane) > maxLane) {
          setLane(l => Math.max(Math.min(l, maxLane), -maxLane));
      }
  }, [laneCount, lane]);

  const handleJump = useCallback(() => {
    // If rocket is active, jump key might just boost higher or do nothing.
    // Let's disable manual jumping while on rocket to avoid glitching out of bounds
    if (activeEffects.rocket) return;

    const maxJumps = hasDoubleJump ? 2 : 1;
    if (!isJumping.current) {
        audio.playJump(false);
        isJumping.current = true;
        jumpsPerformed.current = 1;
        velocityY.current = JUMP_FORCE;
    } else if (jumpsPerformed.current < maxJumps) {
        audio.playJump(true);
        jumpsPerformed.current += 1;
        velocityY.current = JUMP_FORCE; 
        spinRotation.current = 0; 
    }
  }, [hasDoubleJump, activeEffects.rocket]);

  const moveLeft = useCallback(() => {
      const maxLane = Math.floor(laneCount / 2);
      setLane(l => Math.max(l - 1, -maxLane));
  }, [laneCount]);

  const moveRight = useCallback(() => {
      const maxLane = Math.floor(laneCount / 2);
      setLane(l => Math.min(l + 1, maxLane));
  }, [laneCount]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (status !== GameStatus.PLAYING) return;
      if (e.key === 'ArrowLeft') moveLeft();
      else if (e.key === 'ArrowRight') moveRight();
      else if (e.key === 'ArrowUp' || e.key === 'w') handleJump();
    };

    const onMoveLeft = () => { if(status === GameStatus.PLAYING) moveLeft(); };
    const onMoveRight = () => { if(status === GameStatus.PLAYING) moveRight(); };
    const onJump = () => { if(status === GameStatus.PLAYING) handleJump(); };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('move-left', onMoveLeft);
    window.addEventListener('move-right', onMoveRight);
    window.addEventListener('player-jump', onJump);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('move-left', onMoveLeft);
        window.removeEventListener('move-right', onMoveRight);
        window.removeEventListener('player-jump', onJump);
    };
  }, [status, moveLeft, moveRight, handleJump]);

  useEffect(() => {
    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };
    const handleTouchEnd = (e: TouchEvent) => {
        if (status !== GameStatus.PLAYING) return;
        const deltaX = e.changedTouches[0].clientX - touchStartX.current;
        const deltaY = e.changedTouches[0].clientY - touchStartY.current;
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 30) {
             if (deltaX > 0) moveRight();
             else moveLeft();
        } else if (Math.abs(deltaY) > Math.abs(deltaX) && deltaY < -30) {
            handleJump();
        }
    };
    window.addEventListener('touchstart', handleTouchStart);
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
        window.removeEventListener('touchstart', handleTouchStart);
        window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [status, moveLeft, moveRight, handleJump]);

  useFrame((state, delta) => {
    if (!groupRef.current) return;
    if (status !== GameStatus.PLAYING && status !== GameStatus.SHOP) return;

    // 1. Horizontal Position
    targetX.current = lane * LANE_WIDTH;
    groupRef.current.position.x = THREE.MathUtils.lerp(
        groupRef.current.position.x, 
        targetX.current, 
        delta * 15 
    );

    // 2. Physics & Vertical Movement
    if (activeEffects.rocket) {
        // Rocket Flight Mode: Fly High
        const flightHeight = 3.5;
        groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, flightHeight, delta * 5);
        velocityY.current = 0;
        isJumping.current = true; // Treated as jumping for animation purposes
        
        // Tilt forward
        if (bodyRef.current) {
             bodyRef.current.rotation.x = THREE.MathUtils.lerp(bodyRef.current.rotation.x, -Math.PI / 4, delta * 5);
        }
    } else {
        // Standard Physics
        if (isJumping.current) {
            groupRef.current.position.y += velocityY.current * delta;
            velocityY.current -= GRAVITY * delta;

            if (groupRef.current.position.y <= 0) {
                groupRef.current.position.y = 0;
                isJumping.current = false;
                jumpsPerformed.current = 0;
                velocityY.current = 0;
                if (bodyRef.current) bodyRef.current.rotation.x = 0;
            }

            // Double Jump Flip
            if (jumpsPerformed.current === 2 && bodyRef.current) {
                 spinRotation.current -= delta * 15;
                 if (spinRotation.current < -Math.PI * 2) spinRotation.current = -Math.PI * 2;
                 bodyRef.current.rotation.x = spinRotation.current;
            }
        }
    }

    // 3. Banking
    const xDiff = targetX.current - groupRef.current.position.x;
    groupRef.current.rotation.z = -xDiff * 0.2; 
    
    // Reset body rotation if not flying/flipping
    if (!activeEffects.rocket && !isJumping.current && bodyRef.current) {
        bodyRef.current.rotation.x = isJumping.current ? 0.1 : 0.05;
    }

    // 4. Skeletal Animation
    const time = state.clock.elapsedTime * 25; 
    
    if (!isJumping.current && !activeEffects.rocket) {
        // Run
        if (leftArmRef.current) leftArmRef.current.rotation.x = Math.sin(time) * 0.7;
        if (rightArmRef.current) rightArmRef.current.rotation.x = Math.sin(time + Math.PI) * 0.7;
        if (leftLegRef.current) leftLegRef.current.rotation.x = Math.sin(time + Math.PI) * 1.0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = Math.sin(time) * 1.0;
        if (bodyRef.current) bodyRef.current.position.y = 1.1 + Math.abs(Math.sin(time)) * 0.1;
    } else {
        // Jump / Fly Pose
        const jumpPoseSpeed = delta * 10;
        // Arms back for superman/rocket pose
        const armTarget = activeEffects.rocket ? -3.0 : -2.5; 
        if (leftArmRef.current) leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, armTarget, jumpPoseSpeed);
        if (rightArmRef.current) rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, armTarget, jumpPoseSpeed);
        
        // Legs straight back for rocket
        const legTarget = activeEffects.rocket ? 0.2 : 0.5;
        if (leftLegRef.current) leftLegRef.current.rotation.x = THREE.MathUtils.lerp(leftLegRef.current.rotation.x, legTarget, jumpPoseSpeed);
        if (rightLegRef.current) rightLegRef.current.rotation.x = THREE.MathUtils.lerp(rightLegRef.current.rotation.x, activeEffects.rocket ? 0.2 : -0.5, jumpPoseSpeed);
        
        if (bodyRef.current && jumpsPerformed.current !== 2) bodyRef.current.position.y = 1.1; 
    }

    // 5. FX Updates
    if (shieldRef.current) {
        shieldRef.current.visible = activeEffects.shield;
        if (activeEffects.shield) {
            shieldRef.current.rotation.y += delta;
            shieldRef.current.rotation.z += delta * 0.5;
            // Pulsate
            const scale = 1.0 + Math.sin(state.clock.elapsedTime * 5) * 0.05;
            shieldRef.current.scale.setScalar(scale);
        }
    }

    if (magnetRef.current) {
        magnetRef.current.visible = activeEffects.magnet;
        if (activeEffects.magnet) {
            magnetRef.current.rotation.y -= delta * 2;
            magnetRef.current.rotation.z += delta;
            // "Black hole" wobble
            const s = 1.0 + Math.sin(state.clock.elapsedTime * 10) * 0.1;
            magnetRef.current.scale.setScalar(s);
        }
    }
    
    if (rocketRef.current) {
        rocketRef.current.visible = activeEffects.rocket;
        if (activeEffects.rocket) {
             // Flicker engine or something
        }
    }

    // Damage Flicker
    if (isInvincible.current) {
         if (Date.now() - lastDamageTime.current > 1500) {
            isInvincible.current = false;
            groupRef.current.visible = true;
         } else {
            groupRef.current.visible = Math.floor(Date.now() / 50) % 2 === 0;
         }
    } else {
        groupRef.current.visible = true;
    }
  });

  useEffect(() => {
     const checkHit = (e: any) => {
        if (isInvincible.current || activeEffects.shield || activeEffects.rocket) return;
        audio.playDamage();
        takeDamage();
        isInvincible.current = true;
        lastDamageTime.current = Date.now();
     };
     window.addEventListener('player-hit', checkHit);
     return () => window.removeEventListener('player-hit', checkHit);
  }, [takeDamage, activeEffects]);

  return (
    <group ref={groupRef} position={[0, 0, 0]}>
      {/* Shield Effect */}
      <mesh ref={shieldRef} visible={false} position={[0, 1.0, 0]} geometry={SHIELD_GEO} material={materials.shield} />

      {/* Magnet Effect */}
      <group ref={magnetRef} visible={false} position={[0, 1.0, 0]}>
         <mesh geometry={MAGNET_FIELD_GEO} material={materials.magnetField} />
         <mesh scale={[0.5, 0.5, 0.5]} geometry={SHIELD_GEO} material={materials.magnetCore} />
      </group>

      {/* Rocket Model */}
      <group ref={rocketRef} visible={false} position={[0, 0.5, 0.2]} rotation={[Math.PI/2, 0, 0]}>
           <mesh geometry={ROCKET_BODY_GEO} material={materials.rocketBody} />
           <mesh position={[0, -1.0, 0.25]} geometry={ROCKET_FIN_GEO} material={materials.rocketFin} />
           <mesh position={[0, -1.0, -0.25]} rotation={[0,0,Math.PI]} geometry={ROCKET_FIN_GEO} material={materials.rocketFin} />
           {/* Flame placeholder */}
           <mesh position={[0, -1.2, 0]}>
               <coneGeometry args={[0.15, 0.8, 8]} />
               <meshBasicMaterial color="#ffff00" transparent opacity={0.8} />
           </mesh>
      </group>

      <group ref={bodyRef} position={[0, 1.1, 0]}> 
        <mesh castShadow position={[0, 0.2, 0]} geometry={TORSO_GEO} material={materials.armor} />
        <mesh position={[0, 0.2, -0.2]} geometry={JETPACK_GEO} material={materials.joint} />
        <mesh position={[-0.08, 0.1, -0.28]} geometry={GLOW_STRIP_GEO} material={materials.glow} />
        <mesh position={[0.08, 0.1, -0.28]} geometry={GLOW_STRIP_GEO} material={materials.glow} />

        <group ref={headRef} position={[0, 0.6, 0]}>
            <mesh castShadow geometry={HEAD_GEO} material={materials.armor} />
        </group>

        <group position={[0.32, 0.4, 0]}>
            <group ref={rightArmRef}>
                <mesh position={[0, -0.25, 0]} castShadow geometry={ARM_GEO} material={materials.armor} />
                <mesh position={[0, -0.55, 0]} geometry={JOINT_SPHERE_GEO} material={materials.glow} />
            </group>
        </group>
        <group position={[-0.32, 0.4, 0]}>
            <group ref={leftArmRef}>
                 <mesh position={[0, -0.25, 0]} castShadow geometry={ARM_GEO} material={materials.armor} />
                 <mesh position={[0, -0.55, 0]} geometry={JOINT_SPHERE_GEO} material={materials.glow} />
            </group>
        </group>

        <mesh position={[0, -0.15, 0]} geometry={HIPS_GEO} material={materials.joint} />

        <group position={[0.12, -0.25, 0]}>
            <group ref={rightLegRef}>
                 <mesh position={[0, -0.35, 0]} castShadow geometry={LEG_GEO} material={materials.armor} />
            </group>
        </group>
        <group position={[-0.12, -0.25, 0]}>
            <group ref={leftLegRef}>
                 <mesh position={[0, -0.35, 0]} castShadow geometry={LEG_GEO} material={materials.armor} />
            </group>
        </group>
      </group>
      
      <mesh ref={shadowRef} position={[0, 0.02, 0]} rotation={[-Math.PI/2, 0, 0]} geometry={SHADOW_GEO} material={materials.shadow} />
    </group>
  );
};
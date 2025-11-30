
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/


import { create } from 'zustand';
import { GameStatus, RUN_SPEED_BASE, Inventory, ActiveEffects } from './types';

interface GameState {
  status: GameStatus;
  score: number;
  lives: number;
  maxLives: number;
  speed: number;
  collectedLetters: number[]; 
  level: number;
  laneCount: number;
  gemsCollected: number;
  distance: number;
  
  // Inventory
  inventory: Inventory;
  activeEffects: ActiveEffects;

  // Bonus State (Permanent upgrades from Recharge)
  bonusLives: number;
  bonusInventory: Inventory;

  // Actions
  startGame: () => void;
  restartGame: () => void;
  pauseGame: () => void;
  resumeGame: () => void;
  quitToMenu: () => void;
  
  takeDamage: () => void;
  collectGem: (value: number) => void;
  collectLetter: (index: number) => void;
  
  setDistance: (dist: number) => void;
  
  // Shop / Abilities
  buyItem: (type: 'SHIELD' | 'ROCKET' | 'POTION' | 'MAGNET', cost: number) => boolean;
  useItem: (type: 'SHIELD' | 'ROCKET' | 'POTION' | 'MAGNET') => void;
  
  openShop: () => void;
  closeShop: () => void;
  advanceLevel: () => void;

  // Recharge / Key Redemption
  openRecharge: () => void;
  closeRecharge: () => void;
  redeemKey: (key: string) => { success: boolean; message: string };
}

const GEMINI_TARGET = ['G', 'E', 'M', 'I', 'N', 'I'];
const MAX_LEVEL = 3;

// Timers for effects
let rocketTimer: any = null;
let potionTimer: any = null;
let shieldTimer: any = null;
let magnetTimer: any = null;

export const useStore = create<GameState>((set, get) => ({
  status: GameStatus.MENU,
  score: 0,
  lives: 3,
  maxLives: 3,
  speed: 0,
  collectedLetters: [],
  level: 1,
  laneCount: 3,
  gemsCollected: 0,
  distance: 0,
  
  inventory: {
      shield: 0,
      rocket: 0,
      potion: 0,
      magnet: 0
  },
  
  activeEffects: {
      shield: false,
      rocket: false,
      potion: false,
      magnet: false
  },

  // Initial Bonus State
  bonusLives: 0,
  bonusInventory: {
      shield: 0,
      rocket: 0,
      potion: 0,
      magnet: 0
  },

  startGame: () => {
    const { bonusLives, bonusInventory } = get();
    set({ 
        status: GameStatus.PLAYING, 
        score: 0, 
        lives: 3 + bonusLives, 
        maxLives: 3 + bonusLives,
        speed: RUN_SPEED_BASE,
        collectedLetters: [],
        level: 1,
        laneCount: 3,
        gemsCollected: 0,
        distance: 0,
        inventory: { ...bonusInventory },
        activeEffects: { shield: false, rocket: false, potion: false, magnet: false }
    });
  },

  restartGame: () => {
    const { bonusLives, bonusInventory } = get();
    set({ 
        status: GameStatus.PLAYING, 
        score: 0, 
        lives: 3 + bonusLives, 
        maxLives: 3 + bonusLives,
        speed: RUN_SPEED_BASE,
        collectedLetters: [],
        level: 1,
        laneCount: 3,
        gemsCollected: 0,
        distance: 0,
        inventory: { ...bonusInventory },
        activeEffects: { shield: false, rocket: false, potion: false, magnet: false }
    });
  },

  pauseGame: () => {
    if (get().status === GameStatus.PLAYING) {
        set({ status: GameStatus.PAUSED });
    }
  },

  resumeGame: () => {
    if (get().status === GameStatus.PAUSED || get().status === GameStatus.SHOP) {
        set({ status: GameStatus.PLAYING });
    }
  },

  quitToMenu: () => set({ status: GameStatus.MENU }),

  takeDamage: () => {
    const { lives, activeEffects } = get();
    // Immune if Shield or Rocket is active
    if (activeEffects.shield || activeEffects.rocket) return; 

    if (lives > 1) {
      set({ lives: lives - 1 });
    } else {
      set({ lives: 0, status: GameStatus.GAME_OVER, speed: 0 });
    }
  },

  collectGem: (value) => {
      const { score, gemsCollected, activeEffects } = get();
      const multiplier = activeEffects.potion ? 2 : 1;
      const points = value * multiplier;

      set({ 
        score: score + points, 
        gemsCollected: gemsCollected + 1 
      });
  },

  setDistance: (dist) => set({ distance: dist }),

  collectLetter: (index) => {
    const { collectedLetters, level, speed } = get();
    
    if (!collectedLetters.includes(index)) {
      const newLetters = [...collectedLetters, index];
      
      const speedIncrease = RUN_SPEED_BASE * 0.10;
      const nextSpeed = speed + speedIncrease;

      set({ 
        collectedLetters: newLetters,
        speed: nextSpeed
      });

      if (newLetters.length === GEMINI_TARGET.length) {
        if (level < MAX_LEVEL) {
            get().advanceLevel();
        } else {
            set({
                status: GameStatus.VICTORY,
                score: get().score + 5000
            });
        }
      }
    }
  },

  advanceLevel: () => {
      const { level, laneCount, speed } = get();
      const nextLevel = level + 1;
      const speedIncrease = RUN_SPEED_BASE * 0.40;
      const newSpeed = speed + speedIncrease;

      set({
          level: nextLevel,
          laneCount: Math.min(laneCount + 2, 9),
          status: GameStatus.PLAYING,
          speed: newSpeed,
          collectedLetters: []
      });
  },

  openShop: () => set({ status: GameStatus.SHOP }),
  closeShop: () => set({ status: GameStatus.PLAYING }),

  buyItem: (type, cost) => {
      const { score, inventory } = get();
      
      if (score >= cost) {
          const newInventory = { ...inventory };
          
          if (type === 'SHIELD') newInventory.shield++;
          if (type === 'ROCKET') newInventory.rocket++;
          if (type === 'POTION') newInventory.potion++;
          if (type === 'MAGNET') newInventory.magnet++;

          set({ 
              score: score - cost,
              inventory: newInventory
          });
          return true;
      }
      return false;
  },

  useItem: (type) => {
      const { inventory, activeEffects, speed } = get();
      const newInventory = { ...inventory };
      const newEffects = { ...activeEffects };

      if (type === 'SHIELD') {
          if (inventory.shield > 0) {
              newInventory.shield--;
              newEffects.shield = true;
              
              // Clear existing timer if any
              if (shieldTimer) clearTimeout(shieldTimer);
              shieldTimer = setTimeout(() => {
                   set(state => ({ activeEffects: { ...state.activeEffects, shield: false } }));
              }, 5000);
          }
      } else if (type === 'ROCKET') {
           if (inventory.rocket > 0) {
              newInventory.rocket--;
              newEffects.rocket = true;
              
              // Boost speed for rocket duration
              const currentBaseSpeed = speed;
              const boostSpeed = speed + 30; 
              set({ speed: boostSpeed });

              if (rocketTimer) clearTimeout(rocketTimer);
              rocketTimer = setTimeout(() => {
                   // Restore speed (approximate, prevents permanent speedup)
                   set(state => ({ 
                       speed: state.speed - 30, // rough restore
                       activeEffects: { ...state.activeEffects, rocket: false } 
                   }));
              }, 4000);
          }
      } else if (type === 'POTION') {
           if (inventory.potion > 0) {
              newInventory.potion--;
              newEffects.potion = true;

              if (potionTimer) clearTimeout(potionTimer);
              potionTimer = setTimeout(() => {
                   set(state => ({ activeEffects: { ...state.activeEffects, potion: false } }));
              }, 5000);
          }
      } else if (type === 'MAGNET') {
          if (inventory.magnet > 0) {
              newInventory.magnet--;
              newEffects.magnet = true;

              if (magnetTimer) clearTimeout(magnetTimer);
              magnetTimer = setTimeout(() => {
                   set(state => ({ activeEffects: { ...state.activeEffects, magnet: false } }));
              }, 4000);
          }
      }

      set({ inventory: newInventory, activeEffects: newEffects });
  },

  openRecharge: () => set({ status: GameStatus.RECHARGE }),
  closeRecharge: () => set({ status: GameStatus.MENU }),

  redeemKey: (key: string) => {
      const { bonusLives, bonusInventory } = get();
      const k = key.trim();

      if (k === 'daoju_enter_1') {
          set({
              bonusInventory: {
                  shield: bonusInventory.shield + 1,
                  rocket: bonusInventory.rocket + 1,
                  potion: bonusInventory.potion + 1,
                  magnet: bonusInventory.magnet + 1,
              }
          });
          return { success: true, message: '道具大礼包兑换成功！' };
      } 
      else if (k === 'life_enter_1') {
          set({ bonusLives: bonusLives + 1 });
          return { success: true, message: '生命值大礼包兑换成功！' };
      } 
      else if (k === 'super_gift') {
          set({
              bonusLives: bonusLives + 2,
              bonusInventory: {
                  shield: bonusInventory.shield + 2,
                  rocket: bonusInventory.rocket + 2,
                  potion: bonusInventory.potion + 2,
                  magnet: bonusInventory.magnet + 2,
              }
          });
          return { success: true, message: '超级大礼包兑换成功！' };
      }
      
      return { success: false, message: '不给钱想瞎蒙？大胆！' };
  }

}));

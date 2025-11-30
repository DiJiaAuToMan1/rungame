/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

import React from 'react';

// Augment the global JSX namespace and React's JSX namespace
// to include React Three Fiber intrinsic elements.
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

export enum GameStatus {
  MENU = 'MENU',
  PLAYING = 'PLAYING',
  PAUSED = 'PAUSED',
  SHOP = 'SHOP',
  GAME_OVER = 'GAME_OVER',
  VICTORY = 'VICTORY',
  RECHARGE = 'RECHARGE'
}

export enum ObjectType {
  OBSTACLE = 'OBSTACLE',
  GEM = 'GEM',
  LETTER = 'LETTER',
  SHOP_PORTAL = 'SHOP_PORTAL',
  ALIEN = 'ALIEN',
  MISSILE = 'MISSILE'
}

export interface GameObject {
  id: string;
  type: ObjectType;
  position: [number, number, number]; // x, y, z
  active: boolean;
  value?: string; // For letters (G, E, M...)
  color?: string;
  targetIndex?: number; // Index in the GEMINI target word
  points?: number; // Score value for gems
  hasFired?: boolean; // For Aliens
}

export interface Inventory {
    shield: number;
    rocket: number;
    potion: number;
    magnet: number;
}

export interface ActiveEffects {
    shield: boolean;
    rocket: boolean;
    potion: boolean;
    magnet: boolean;
}

export const LANE_WIDTH = 2.2;
export const JUMP_HEIGHT = 2.5;
export const JUMP_DURATION = 0.6; // seconds
export const RUN_SPEED_BASE = 22.5;
export const SPAWN_DISTANCE = 120;
export const REMOVE_DISTANCE = 20; // Behind player

// Google-ish Neon Colors: Blue, Red, Yellow, Blue, Green, Red
export const GEMINI_COLORS = [
    '#2979ff', // G - Blue
    '#ff1744', // E - Red
    '#ffea00', // M - Yellow
    '#2979ff', // I - Blue
    '#00e676', // N - Green
    '#ff1744', // I - Red
];

export interface ShopItem {
    id: 'SHIELD' | 'ROCKET' | 'POTION' | 'MAGNET';
    name: string;
    description: string;
    cost: number;
    icon: any; // Lucide icon component
}
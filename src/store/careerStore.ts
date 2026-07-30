import { create } from 'zustand';
import type { Position } from '../lib/engine';

export interface Team {
  id: string;
  name: string;
  elo_rating: number;
  league_name?: string;
  league_tier?: number;
}

export interface SeasonStats {
  year: number;
  teamName: string;
  appearances: number;
  goals?: number;
  assists?: number;
  cleanSheets?: number;
  goalsConceded?: number;
  saves?: number;
  averageRating: number;
  playerRating: number;
  trophiesWon: string[];
  love: number;
  fame: number;
  wageEarned: number;
}

export interface PlayerState {
  name: string;
  nationality: string;
  position: Position;
  dominantFoot: 'Left' | 'Right';
  age: number;
  overallRating: number;
  peakRating: number;
  currentTeam: Team | null;
  statsHistory: SeasonStats[];
  trophies: string[];
  careerEarnings: number;
  weeklyWage: number;
  isRetired: boolean;
  retireReason?: string;
  love: number;
  fame: number;
  legacy: number;
}

interface CareerStore {
  player: PlayerState | null;
  createPlayer: (playerData: Omit<PlayerState, 'statsHistory' | 'trophies' | 'careerEarnings' | 'weeklyWage' | 'isRetired' | 'peakRating' | 'love' | 'fame' | 'legacy'>) => void;
  updatePlayer: (updates: Partial<PlayerState>) => void;
  addSeasonStats: (stats: SeasonStats) => void;
  retirePlayer: (reason?: string) => void;
  resetCareer: () => void;
}

export const useCareerStore = create<CareerStore>((set) => ({
  player: null,

  createPlayer: (playerData) => set({
    player: {
      ...playerData,
      peakRating: playerData.overallRating,
      statsHistory: [],
      trophies: [],
      careerEarnings: 0,
      weeklyWage: 0, // start with 0 until signed
      isRetired: false,
      love: 10,
      fame: 10,
      legacy: 0
    }
  }),

  updatePlayer: (updates) => set((state) => ({
    player: state.player ? {
        ...state.player,
        ...updates,
        peakRating: updates.overallRating && updates.overallRating > state.player.peakRating
            ? updates.overallRating
            : state.player.peakRating
    } : null
  })),

  addSeasonStats: (stats) => set((state) => ({
    player: state.player ? {
      ...state.player,
      statsHistory: [...state.player.statsHistory, stats],
      careerEarnings: state.player.careerEarnings + stats.wageEarned,
      trophies: [...state.player.trophies, ...stats.trophiesWon]
    } : null
  })),

  retirePlayer: (reason?: string) => set((state) => ({
    player: state.player ? { ...state.player, isRetired: true, retireReason: reason } : null
  })),

  resetCareer: () => set({ player: null })
}));

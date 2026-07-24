import { createClient } from '@supabase/supabase-js';
import type { Team } from '../store/careerStore';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'dummy_key';

// Only create a real client if keys are likely valid (e.g. not the defaults)
export const supabase = createClient(supabaseUrl, supabaseKey);

// Mock Data for Prototype without real DB
export const MOCK_TEAMS: Team[] = [
  { id: '1', name: 'Real Madrid', elo_rating: 97, league_tier: 1, league_name: 'La Liga' },
  { id: '2', name: 'Manchester City', elo_rating: 96, league_tier: 1, league_name: 'Premier League' },
  { id: '3', name: 'Arsenal', elo_rating: 92, league_tier: 1, league_name: 'Premier League' },
  { id: '4', name: 'Inter Milan', elo_rating: 91, league_tier: 1, league_name: 'Serie A' },
  { id: '5', name: 'Leicester City', elo_rating: 78, league_tier: 2, league_name: 'Championship' },
  { id: '6', name: 'Palmeiras', elo_rating: 82, league_tier: 2, league_name: 'Brasileirão' },
  { id: '7', name: 'Portsmouth', elo_rating: 68, league_tier: 3, league_name: 'League One' },
  { id: '8', name: 'Stockport County', elo_rating: 60, league_tier: 4, league_name: 'League Two' },
  { id: '9', name: 'Mansfield Town', elo_rating: 58, league_tier: 4, league_name: 'League Two' },
  { id: '10', name: 'Vissel Kobe', elo_rating: 72, league_tier: 3, league_name: 'J1 League' },
];

export async function fetchTeams(): Promise<Team[]> {
  // In a real app:
  // const { data } = await supabase.from('teams').select('*, leagues(name, tier)');
  // return data;

  // For the prototype running locally without backend:
  return MOCK_TEAMS;
}

import { supabase } from './supabase';

export interface LeaderboardEntry {
  name: string;
  score: number;
  max_combo: number;
  rank_title: string;
  created_at: string;
}

export async function submitScore(
  name: string,
  score: number,
  maxCombo: number,
  rankTitle: string
): Promise<boolean> {
  if (!supabase) return false;

  const { error } = await supabase.from('leaderboard').insert({
    name: name.trim().toUpperCase(),
    score,
    max_combo: maxCombo,
    rank_title: rankTitle,
  });

  if (error) {
    console.error('Leaderboard submit failed:', error.message);
    return false;
  }
  return true;
}

export async function getTopScores(limit = 20): Promise<LeaderboardEntry[]> {
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('leaderboard')
    .select('name, score, max_combo, rank_title, created_at')
    .order('score', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Leaderboard fetch failed:', error.message);
    return [];
  }
  return data ?? [];
}

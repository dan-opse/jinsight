export interface MoodPoint {
  date: string;
  mood_score: number;
}

export interface SearchResult {
  id: string;
  content: string;
  created_at: string;
  similarity: number;
}

export interface Entry {
  id: string;
  content: string;
  created_at: string;
  entry_metadata?: { mood_score: number | null; processing_status: string }[];
}

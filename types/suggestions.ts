export type SuggestionStatus = 'Open' | 'In Review' | 'Implemented' | 'Closed';

export interface Suggestion {
  id: string;
  user: { id: string; first_name: string; last_name: string | null; email: string };
  suggestion_type: { id: string; name: string; description: string | null };
  title: string;
  details: string;
  status: SuggestionStatus;
  created_at: string;
  updated_at: string;
}

export interface SuggestionList {
  items: Suggestion[];
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface SuggestionCreate {
  suggestion_type_id: string;
  title: string;
  details: string;
}

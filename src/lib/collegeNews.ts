// College news & success stories
// In a real app these would come from Supabase college_news table.
// Format: keyed by college name (case-insensitive match on first word).

export type CollegeStory = {
  id: number;
  type: 'news' | 'success';
  title: string;
  summary: string;
  date: string;
  author?: string;
  tag: string;
};

// Stories will be fetched from Supabase in the future.
// Returns an empty array until real data is available.
export function getStoriesForCollege(_collegeName: string): CollegeStory[] {
  return [];
}

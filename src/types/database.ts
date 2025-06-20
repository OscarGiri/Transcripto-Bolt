export interface Database {
  public: {
    Tables: {
      video_summaries: {
        Row: {
          id: string;
          user_id: string;
          video_id: string;
          title: string;
          thumbnail: string;
          duration: string;
          channel_name: string;
          summary: string;
          bullet_points: string[];
          key_quote: string;
          transcript: TranscriptSegment[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          video_id: string;
          title: string;
          thumbnail: string;
          duration: string;
          channel_name: string;
          summary: string;
          bullet_points: string[];
          key_quote: string;
          transcript: TranscriptSegment[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          video_id?: string;
          title?: string;
          thumbnail?: string;
          duration?: string;
          channel_name?: string;
          summary?: string;
          bullet_points?: string[];
          key_quote?: string;
          transcript?: TranscriptSegment[];
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export interface TranscriptSegment {
  timestamp: string;
  text: string;
  start: number;
}
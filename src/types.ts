export type Emotion = 'happy' | 'sad' | 'angry' | 'surprised' | 'neutral' | 'confused' | 'bored' | 'focused';

export interface EmotionLog {
  id: string;
  userId: string;
  emotion: Emotion;
  timestamp: any; // Firestore Timestamp
  contentId: string;
}

export interface LearningContent {
  id: string;
  title: string;
  description: string;
  body: string; // Markdown
  difficulty: 'easy' | 'medium' | 'hard';
  tags: string[];
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'student' | 'admin';
  createdAt: any;
}

export type Platform = 'tiktok' | 'instagram' | 'youtube' | 'other';

export interface Profile {
  id: string;
  email: string;
  fullName?: string;
  role: 'user' | 'admin';
  createdAt: string;
}

export interface Account {
  id: string;
  userId: string;
  platform: Platform;
  username: string;
  url?: string;
  status: 'active' | 'inactive' | 'banned';
  createdAt: string;
}

export interface Metric {
  id: string;
  accountId: string;
  followers: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  recordedAt: string;
}

export interface Goal {
  id: string;
  accountId: string;
  metricType: 'followers' | 'views' | 'likes' | 'engagement';
  targetValue: number;
  currentValue: number;
  deadline?: string;
  isAchieved: boolean;
}


export interface UserState {
  username: string;
  name: string;
  email: string;
  password?: string;
  isVerified: boolean;
  isBanned: boolean;
  verificationCode?: string;
  balance: number;
  tasksCompleted: number;
  level: number;
  avatar: string;
  country: string;
  referralCode: string;
  totalReferrals: number;
}

export interface BannerAd {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

export interface SupportMessage {
  id: string;
  senderName: string;
  text: string;
  timestamp: string;
  type: 'support' | 'feedback';
}

export interface UserAd {
  id: string;
  submittedBy: string;
  title: string;
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  timestamp: string;
}

export interface Task {
  id: string;
  title: string;
  reward: number;
  description: string;
  category: 'ad' | 'video' | 'click' | 'popup';
  icon: string;
  adUrl: string;
}

export interface HistoryItem {
  id: string;
  action: string;
  amount: number;
  fee?: number;
  type: 'earn' | 'deposit' | 'withdraw';
  timestamp: string;
  status: 'completed' | 'pending';
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export type ToastType = 'error' | 'success' | 'info' | 'warning';

export interface ToastMessage {
  id: string;
  message: string;
  type: ToastType;
}

export interface User {
  mobile: string;
  workerId?: string;
  adminId?: string;
  role: 'worker' | 'admin' | 'user';
}

export interface AuthToken {
  token: string;
  expiresAt: string;
  user: User;
}

export interface OtpSendRequest {
  mobile: string;
}

export interface OtpSendResponse {
  message: string;
  mobile: string;
  testOtp?: string;
}

export interface OtpVerifyRequest {
  mobile: string;
  otp: string;
}

export interface OtpVerifyResponse {
  message: string;
  token: string;
  user: User & { isNewUser: boolean };
}

export interface Admin {
  adminId: string;
  email: string;
  name: string;
  role: 'super_admin' | 'moderator';
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

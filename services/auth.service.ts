import api from "./api";

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  birthday?: string | null;
  phone?: string | null;
  status: string;
  branchId?: string | null;
  branch?: { id: string; name: string; code: string } | null;
  roles: string[];
  permissions: string[];
  createdAt?: string;
}

export interface AuthResponse {
  user: UserProfile;
  accessToken?: string;
  refreshToken?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  fullName?: string;
  name?: string;
  businessName?: string;
  businessType?: string;
  birthday?: string | null;
  phone?: string | null;
  /** Cloudflare Turnstile CAPTCHA token — required in production */
  turnstileToken?: string;
  /** Device fingerprint for velocity/fraud detection */
  deviceFingerprint?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  /** Cloudflare Turnstile CAPTCHA token — required in production */
  turnstileToken?: string;
  /** Device fingerprint for velocity/fraud detection */
  deviceFingerprint?: string;
}

export const authService = {
  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const res = await api.post("/auth/register", payload);
    return res.data.data;
  },

  async login(payload: LoginPayload): Promise<AuthResponse> {
    const res = await api.post("/auth/login", payload);
    return res.data.data;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string; data?: any }> {
    const res = await api.post("/auth/forgot-password", { email });
    return res.data;
  },

  async resetPassword(payload: {
    email?: string;
    resetToken?: string;
    otp?: string;
    newPassword: string;
  }): Promise<{ success: boolean; message: string }> {
    const res = await api.post("/auth/reset-password", payload);
    return res.data;
  },

  async getMe(): Promise<UserProfile> {
    const res = await api.get("/auth/me");
    return res.data.data;
  },

  async refresh(): Promise<{ user: UserProfile }> {
    const res = await api.post("/auth/refresh", {});
    return res.data.data;
  },

  async logout(): Promise<void> {
    try {
      await api.post("/auth/logout", {});
    } catch {
      // Ignore errors on logout
    }
  },
};

export default authService;

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "https://mandibook-api-server-production.up.railway.app/api";

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

type RequestOptions = RequestInit & {
  token?: string | null;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
    cache: "no-store",
  });

  const text = await response.text();
  const data = text ? (JSON.parse(text) as T & { message?: string }) : ({} as T & { message?: string });

  if (!response.ok) {
    throw new ApiError((data as { message?: string }).message || "Request failed", response.status, data);
  }

  return data;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token?: string;
  user?: {
    id: string;
    name: string;
    role: "farmer" | "manager" | "admin";
    phone?: string;
    email?: string;
    avatar?: string;
    language: "en" | "hi";
    status?: string;
    profileComplete?: boolean;
    village?: string;
    district?: string;
    state?: string;
    pincode?: string;
    landHolding?: number;
    farmSize?: string;
    preferredMandis?: string[];
    crops?: string[];
    priceAlertCrops?: string[];
    mandiId?: string;
    designation?: string;
    managingSince?: string;
    department?: string;
    twoFactorEnabled?: boolean;
    lastLoginAt?: string;
    createdAt?: string;
  };
  isNew?: boolean;
  profileComplete?: boolean;
  requires2FA?: boolean;
  tempUserId?: string;
  otpRequestId?: string;
  expiresInSeconds?: number;
  resendAfterSeconds?: number;
  debugOtp?: string;
  method?: string;
}

export interface ProfileData {
  name: string;
  phone?: string | undefined;
  email?: string | undefined;
  village?: string | undefined;
  district?: string | undefined;
  state?: string | undefined;
  pincode?: string | undefined;
  landHolding?: number | undefined;
  farmSize?: string | undefined;
  crops?: string[] | undefined;
  preferredMandis?: string[] | undefined;
  language?: "en" | "hi" | undefined;
}

export const authApi = {
  sendFarmerOtp(phone: string) {
    return apiRequest<AuthResponse>("/auth/farmer/send-otp", {
      method: "POST",
      body: JSON.stringify({ phone }),
    });
  },
  sendFarmerEmailOtp(email: string) {
    return apiRequest<AuthResponse>("/auth/farmer/send-email-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  },
  verifyFarmerOtp(phone: string, otp: string) {
    return apiRequest<AuthResponse>("/auth/farmer/verify-otp", {
      method: "POST",
      body: JSON.stringify({ phone, otp }),
    });
  },
  verifyFarmerEmailOtp(email: string, otp: string, otpRequestId: string) {
    return apiRequest<AuthResponse>("/auth/farmer/verify-email-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp, otpRequestId }),
    });
  },
  managerLogin(email: string, password: string) {
    return apiRequest<AuthResponse>("/auth/manager/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  adminLogin(email: string, password: string) {
    return apiRequest<AuthResponse>("/auth/admin/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
  adminVerify2FA(tempUserId: string, otpRequestId: string, code: string) {
    return apiRequest<AuthResponse>("/auth/admin/verify-2fa", {
      method: "POST",
      body: JSON.stringify({ tempUserId, otpRequestId, code }),
    });
  },
  me(token: string) {
    return apiRequest<{ success: boolean; user: AuthResponse["user"] }>("/auth/me", {
      method: "GET",
      token,
    });
  },
  logout(token: string) {
    return apiRequest<{ success: boolean; message: string }>("/auth/logout", {
      method: "POST",
      token,
    });
  },
  completeProfile(token: string, data: ProfileData) {
    return apiRequest<AuthResponse>("/auth/complete-profile", {
      method: "PUT",
      token,
      body: JSON.stringify(data),
    });
  },
};

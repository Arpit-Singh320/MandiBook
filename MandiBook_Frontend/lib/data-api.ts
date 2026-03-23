import { API_BASE_URL, ApiError } from "./api";

type RequestOptions = RequestInit & { token?: string | null };

async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { token, headers, ...rest } = options;
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(headers || {}),
    },
  });
  const text = await response.text();
  const data = text ? JSON.parse(text) : {};
  if (!response.ok) {
    throw new ApiError(data.message || "Request failed", response.status, data);
  }
  return data as T;
}

// ── Types ────────────────────────────────────────────────────────────────────

export interface MandiData {
  id: string;
  name: string;
  nameHi?: string;
  code: string;
  address: string;
  city: string;
  district: string;
  state: string;
  pincode: string;
  lat: number;
  lng: number;
  contactPhone?: string;
  crops: string[];
  operatingHoursOpen: string;
  operatingHoursClose: string;
  isActive: boolean;
  rating: number;
  managerId?: string;
}

export interface SlotData {
  id: string;
  mandiId: string;
  date: string;
  startTime: string;
  endTime: string;
  label: string;
  capacity: number;
  bookedCount: number;
  isActive: boolean;
}

export interface BookingData {
  id: string;
  bookingNumber: string;
  farmerId: string;
  mandiId: string;
  slotId: string;
  date: string;
  timeSlot: string;
  cropType: string;
  estimatedQuantity: number;
  vehicleNumber?: string;
  status: "confirmed" | "pending" | "checked-in" | "completed" | "cancelled";
  qrCodeData?: string;
  checkedInAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  createdAt: string;
  Farmer?: { id: string; name: string; phone?: string };
  Mandi?: { id: string; name: string; city?: string };
  TimeSlot?: SlotData;
}

export interface CropPriceData {
  id: string;
  crop: string;
  cropHi?: string;
  unit: string;
  mandiId: string;
  currentPrice: number;
  prevPrice: number;
  minPrice?: number;
  maxPrice?: number;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  Mandi?: { id: string; name: string };
}

export interface NotificationData {
  id: string;
  userId: string;
  type: string;
  title: string;
  titleHi?: string;
  message: string;
  messageHi?: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

export interface IssueData {
  id: string;
  reporterId: string;
  reporterName: string;
  mandiId: string;
  mandiName: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  assignedTo?: string;
  resolution?: string;
  comments: number;
  createdAt: string;
}

export interface AuditLogData {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  entity: string;
  entityId?: string;
  details?: string;
  type: string;
  ipAddress: string;
  createdAt: string;
}

export interface UserData {
  id: string;
  name: string;
  role: string;
  phone?: string;
  email?: string;
  status: string;
  profileComplete: boolean;
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
  landHolding?: number;
  farmSize?: string;
  crops?: string[];
  mandiId?: string;
  designation?: string;
  managingSince?: string;
  createdAt: string;
}

export interface DashboardFarmerData {
  success: boolean;
  data: {
    totalBookings: number;
    activeBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    upcomingBookings: BookingData[];
    recentBookings: BookingData[];
    preferredMandis: MandiData[];
    favoriteCrops: string[];
  };
}

export interface DashboardManagerData {
  success: boolean;
  data: {
    todayBookings: number;
    checkedIn: number;
    pendingBookings: number;
    totalFarmers: number;
    availableSlots: number;
    todayRevenue: number;
    recentBookings: BookingData[];
    mandiInfo: MandiData;
  };
}

export interface DashboardAdminData {
  success: boolean;
  data: {
    totalUsers: number;
    totalFarmers: number;
    totalManagers: number;
    totalMandis: number;
    totalBookings: number;
    todayBookings: number;
    openIssues: number;
    activeUsers: number;
    recentBookings: BookingData[];
    recentIssues: IssueData[];
  };
}

// ── API methods ──────────────────────────────────────────────────────────────

export const mandiApi = {
  list() {
    return apiRequest<{ success: boolean; data: MandiData[] }>("/mandis");
  },
  get(id: string) {
    return apiRequest<{ success: boolean; data: MandiData }>(`/mandis/${id}`);
  },
  stats(id: string, token: string) {
    return apiRequest<{ success: boolean; data: Record<string, unknown> }>(`/mandis/${id}/stats`, { token });
  },
};

export const slotApi = {
  list(params: { mandiId: string; date?: string }) {
    const qs = new URLSearchParams({ mandiId: params.mandiId });
    if (params.date) qs.set("date", params.date);
    return apiRequest<{ success: boolean; data: SlotData[] }>(`/slots?${qs}`);
  },
  create(token: string, data: { mandiId: string; date: string; startTime: string; endTime: string; label: string; capacity: number }) {
    return apiRequest<{ success: boolean; data: SlotData }>("/slots", {
      method: "POST", token, body: JSON.stringify(data),
    });
  },
  update(token: string, id: string, data: Partial<SlotData>) {
    return apiRequest<{ success: boolean; data: SlotData }>(`/slots/${id}`, {
      method: "PUT", token, body: JSON.stringify(data),
    });
  },
  toggle(token: string, id: string) {
    return apiRequest<{ success: boolean; data: SlotData }>(`/slots/${id}/toggle`, {
      method: "PUT", token,
    });
  },
  delete(token: string, id: string) {
    return apiRequest<{ success: boolean }>(`/slots/${id}`, {
      method: "DELETE", token,
    });
  },
};

export const bookingApi = {
  create(token: string, data: { mandiId: string; slotId: string; date: string; cropType: string; estimatedQuantity: number; vehicleNumber?: string }) {
    return apiRequest<{ success: boolean; data: BookingData }>("/bookings", {
      method: "POST", token, body: JSON.stringify(data),
    });
  },
  myBookings(token: string, params?: { status?: string }) {
    const qs = params?.status ? `?status=${params.status}` : "";
    return apiRequest<{ success: boolean; data: BookingData[] }>(`/bookings/my${qs}`, { token });
  },
  mandiBookings(token: string, mandiId: string, params?: { date?: string; status?: string }) {
    const qs = new URLSearchParams();
    if (params?.date) qs.set("date", params.date);
    if (params?.status) qs.set("status", params.status);
    const q = qs.toString();
    return apiRequest<{ success: boolean; data: BookingData[] }>(`/bookings/mandi/${mandiId}${q ? `?${q}` : ""}`, { token });
  },
  get(token: string, id: string) {
    return apiRequest<{ success: boolean; data: BookingData }>(`/bookings/${id}`, { token });
  },
  cancel(token: string, id: string) {
    return apiRequest<{ success: boolean }>(`/bookings/${id}/cancel`, {
      method: "PUT", token,
    });
  },
  checkIn(token: string, id: string) {
    return apiRequest<{ success: boolean; data: BookingData }>(`/bookings/${id}/checkin`, {
      method: "PUT", token,
    });
  },
  complete(token: string, id: string) {
    return apiRequest<{ success: boolean; data: BookingData }>(`/bookings/${id}/complete`, {
      method: "PUT", token,
    });
  },
};

export const priceApi = {
  list(params?: { mandiId?: string }) {
    const qs = params?.mandiId ? `?mandiId=${params.mandiId}` : "";
    return apiRequest<{ success: boolean; data: CropPriceData[] }>(`/prices${qs}`);
  },
  update(token: string, id: string, data: { currentPrice: number }) {
    return apiRequest<{ success: boolean; data: CropPriceData }>(`/prices/${id}`, {
      method: "PUT", token, body: JSON.stringify(data),
    });
  },
};

export const notificationApi = {
  list(token: string) {
    return apiRequest<{ success: boolean; data: NotificationData[] }>("/notifications", { token });
  },
  markRead(token: string, id: string) {
    return apiRequest<{ success: boolean }>(`/notifications/${id}/read`, {
      method: "PUT", token,
    });
  },
  markAllRead(token: string) {
    return apiRequest<{ success: boolean }>("/notifications/read-all", {
      method: "PUT", token,
    });
  },
};

export const dashboardApi = {
  farmer(token: string) {
    return apiRequest<DashboardFarmerData>("/dashboard/farmer", { token });
  },
  manager(token: string) {
    return apiRequest<DashboardManagerData>("/dashboard/manager", { token });
  },
  admin(token: string) {
    return apiRequest<DashboardAdminData>("/dashboard/admin", { token });
  },
  managerReports(token: string) {
    return apiRequest<{ success: boolean; data: Record<string, unknown> }>("/dashboard/manager/reports", { token });
  },
  adminReports(token: string) {
    return apiRequest<{ success: boolean; data: Record<string, unknown> }>("/dashboard/admin/reports", { token });
  },
  analytics(token: string) {
    return apiRequest<{ success: boolean; data: Record<string, unknown> }>("/dashboard/analytics", { token });
  },
};

export const issueApi = {
  list(token: string) {
    return apiRequest<{ success: boolean; data: IssueData[] }>("/issues", { token });
  },
  create(token: string, data: { mandiId: string; mandiName: string; title: string; description: string; priority: string }) {
    return apiRequest<{ success: boolean; data: IssueData }>("/issues", {
      method: "POST", token, body: JSON.stringify(data),
    });
  },
  update(token: string, id: string, data: Partial<IssueData>) {
    return apiRequest<{ success: boolean; data: IssueData }>(`/issues/${id}`, {
      method: "PUT", token, body: JSON.stringify(data),
    });
  },
};

export const userApi = {
  list(token: string, params?: { role?: string }) {
    const qs = params?.role ? `?role=${params.role}` : "";
    return apiRequest<{ success: boolean; data: UserData[] }>(`/users${qs}`, { token });
  },
  get(token: string, id: string) {
    return apiRequest<{ success: boolean; data: UserData }>(`/users/${id}`, { token });
  },
  updateProfile(token: string, data: Record<string, unknown>) {
    return apiRequest<{ success: boolean; data: UserData }>("/users/profile", {
      method: "PUT", token, body: JSON.stringify(data),
    });
  },
  updatePreferredMandis(token: string, mandiIds: string[]) {
    return apiRequest<{ success: boolean }>("/users/preferred-mandis", {
      method: "PUT", token, body: JSON.stringify({ preferredMandis: mandiIds }),
    });
  },
};

export const auditLogApi = {
  list(token: string, params?: { type?: string; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.limit) qs.set("limit", params.limit.toString());
    const q = qs.toString();
    return apiRequest<{ success: boolean; data: AuditLogData[] }>(`/audit-logs${q ? `?${q}` : ""}`, { token });
  },
};

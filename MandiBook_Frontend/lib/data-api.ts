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
  workingDays?: string[];
  holidays?: string[];
  isActive: boolean;
  rating: number;
  managerId?: string;
  managerIds?: string[];
  managerCount?: number;
  distance?: number | null;
  slotsToday?: number;
  manager?: { id: string; name: string; email?: string; phone?: string };
  managers?: Array<{ id: string; name: string; email?: string; phone?: string; designation?: string; status?: string }>;
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
  cancelReason?: string;
  createdAt: string;
  farmer?: { id: string; name: string; phone?: string };
  mandi?: { id: string; name: string; city?: string; address?: string };
  slot?: SlotData;
  Farmer?: { id: string; name: string; phone?: string };
  Mandi?: { id: string; name: string; city?: string };
  TimeSlot?: SlotData;
}

export interface CropPriceData {
  id: string;
  crop: string;
  cropHi?: string;
  category?: string;
  unit: string;
  mandiId: string;
  currentPrice: number;
  prevPrice: number;
  minPrice?: number;
  maxPrice?: number | null;
  updatedBy?: string;
  createdAt: string;
  updatedAt: string;
  mandi?: { id: string; name: string };
  Mandi?: { id: string; name: string };
}

export interface CropCatalogData {
  id: string;
  crop: string;
  cropHi?: string;
  category?: string;
  unit: string;
  minPrice: number;
  maxPrice?: number | null;
  isActive: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PriceOverviewData {
  crop: string;
  cropHi?: string;
  category?: string;
  unit: string;
  minPrice?: number | null;
  maxPrice?: number | null;
  isActive: boolean;
  prices: Array<{
    mandiId?: string;
    mandi: string;
    price: number;
    prevPrice: number;
    minPrice?: number | null;
    maxPrice?: number | null;
    changePercent: number;
    trend: "up" | "down" | "stable";
  }>;
}

export interface MandiStatsResponse {
  success: boolean;
  data: {
    todayBookings: number;
    todayCheckedIn: number;
    totalFarmers: number;
    managerCount: number;
    slotUtilization: number;
    availableSlots: number;
    workingToday: boolean;
    operatingHoursOpen: string;
    operatingHoursClose: string;
    workingDays: string[];
    crops: string[];
  };
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

export interface NotificationListResponse {
  success: boolean;
  data: NotificationData[];
  unreadCount: number;
  total: number;
  page: number;
  limit: number;
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

export interface IssueListResponse {
  success: boolean;
  data: IssueData[];
  counts: Record<string, number>;
  total: number;
  page: number;
  limit: number;
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

export interface AuditLogListResponse {
  success: boolean;
  data: AuditLogData[];
  total: number;
  page: number;
  limit: number;
}

export interface UserData {
  id: string;
  name: string;
  role: "farmer" | "manager" | "admin";
  phone?: string;
  email?: string;
  avatar?: string;
  language: "en" | "hi";
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
  department?: string;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface UserListResponse {
  success: boolean;
  data: UserData[];
  total: number;
  counts: Record<string, number>;
  page: number;
  limit: number;
}

export interface DashboardFarmerData {
  success: boolean;
  data: {
    stats: {
      activeBookings: number;
      totalVisits: number;
      avgPricePerQuintal: number;
      qrScans: number;
    };
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

export interface ManagerReportData {
  success: boolean;
  data: {
    summary: {
      totalBookings: number;
      uniqueFarmers: number;
      checkinRate: number;
      openIssues: number;
    };
    mandiInfo: MandiData;
    slotSummary: {
      totalSlots: number;
      totalCapacity: number;
      totalBooked: number;
      availableSlots: number;
      utilization: number;
    };
    priceSummary: {
      totalCrops: number;
      avgPrice: number;
    };
    weeklyData: Array<{ day: string; date: string; bookings: number; checkins: number }>;
    topCrops: Array<{ crop: string; count: number; totalQty: number; share: number }>;
  };
}

export interface AdminReportData {
  success: boolean;
  data: {
    platformSummary: {
      platformBookings: number;
      totalFarmers: number;
      activeMandis: number;
      totalManagers: number;
      openIssues: number;
      totalCatalogCrops: number;
    };
    totalFarmers: number;
    activeMandis: number;
    totalManagers: number;
    openIssues: number;
    bookingStatusBreakdown: Array<{ status: string; count: number }>;
    managerDistribution: Array<{ mandiId: string; managerCount: number }>;
    cropCoverage: Array<{ id: string; name: string; city?: string; state?: string; priceCount: number; managerCount: number }>;
    recentActivity: Array<{ id: string; action: string; entity: string; details?: string; type: string; createdAt: string; userName?: string; userRole?: string }>;
  };
}

export interface DashboardManagerData {
  success: boolean;
  data: {
    stats: {
      todayBookings: number;
      activeFarmers: number;
      avgWheatPrice: number;
      avgCropPrice: number;
      availableSlots: number;
      managerCount: number;
      openIssues: number;
    };
    mandiInfo: MandiData & {
      workingToday?: boolean;
      managerCount?: number;
    };
    todayBreakdown: {
      checkedIn: number;
      confirmed: number;
      pending: number;
      completed: number;
      cancelled: number;
    };
    slotSummary: {
      totalSlots: number;
      totalCapacity: number;
      totalBooked: number;
      availableSlots: number;
      utilization: number;
    };
    priceSummary: {
      totalCrops: number;
      avgPrice: number;
      outOfRangeCount: number;
      missingCatalogCount: number;
    };
    topCrops: Array<{ crop: string; count: number; totalQty: number }>;
    recentBookings: BookingData[];
    alerts: Array<{ type: string; message: string }>;
  };
}

export interface DashboardAdminData {
  success: boolean;
  data: {
    stats: {
      totalMandis: number;
      activeMandis: number;
      totalFarmers: number;
      totalManagers: number;
      totalBookingsToday: number;
      openIssues: number;
      avgCropPrice: number;
      totalCatalogCrops: number;
    };
    monthlyBookings: Array<{ month: string; bookings: number; farmers: number }>;
    topMandis: Array<{ name: string; city?: string; state?: string; bookings: number; farmers: number }>;
    recentActivity: Array<{ id: string; action: string; entity: string; details?: string; type: string; createdAt: string; userName?: string; userRole?: string }>;
    mandiHealth: Array<{
      id: string;
      name: string;
      city?: string;
      state?: string;
      isActive: boolean;
      managerCount: number;
      configuredCrops: number;
      workingDays?: string[];
      outOfRangePrices: number;
    }>;
    compliance: {
      mandisWithoutManagers: number;
      mandisAtManagerLimit: number;
      mandisMissingPrices: number;
      mandisWithOutOfRangePrices: number;
    };
  };
}

function normalizeBookingData(booking: BookingData): BookingData {
  const mandi = booking.mandi ?? booking.Mandi;
  const farmer = booking.farmer ?? booking.Farmer;
  const slot = booking.slot ?? booking.TimeSlot;

  return {
    ...booking,
    ...(mandi ? { mandi, Mandi: mandi } : {}),
    ...(farmer ? { farmer, Farmer: farmer } : {}),
    ...(slot ? { slot, TimeSlot: slot } : {}),
  };
}

function normalizeCropPriceData(price: CropPriceData): CropPriceData {
  const mandi = price.mandi ?? price.Mandi;
  return {
    ...price,
    ...(mandi ? { mandi, Mandi: mandi } : {}),
  };
}

function normalizeFarmerDashboardData(response: DashboardFarmerData): DashboardFarmerData {
  const upcomingBookings = (response.data.upcomingBookings || []).map(normalizeBookingData);
  return {
    ...response,
    data: {
      ...response.data,
      activeBookings: response.data.activeBookings ?? response.data.stats?.activeBookings ?? 0,
      upcomingBookings,
      recentBookings: (response.data.recentBookings || upcomingBookings).map(normalizeBookingData),
      preferredMandis: response.data.preferredMandis || [],
      favoriteCrops: response.data.favoriteCrops || [],
    },
  };
}

function normalizeManagerDashboardData(response: DashboardManagerData): DashboardManagerData {
  return {
    ...response,
    data: {
      ...response.data,
      recentBookings: (response.data.recentBookings || []).map(normalizeBookingData),
      alerts: response.data.alerts || [],
      topCrops: response.data.topCrops || [],
    },
  };
}

// ── API methods ──────────────────────────────────────────────────────────────

export const mandiApi = {
  list() {
    return apiRequest<{ success: boolean; data: MandiData[] }>("/mandis");
  },
  nearby(params?: { lat?: number; lng?: number; radius?: number }) {
    const qs = new URLSearchParams();
    if (params?.lat !== undefined) qs.set("lat", params.lat.toString());
    if (params?.lng !== undefined) qs.set("lng", params.lng.toString());
    if (params?.radius !== undefined) qs.set("radius", params.radius.toString());
    const query = qs.toString();
    return apiRequest<{ success: boolean; data: MandiData[] }>(`/mandis/nearby${query ? `?${query}` : ""}`);
  },
  get(id: string) {
    return apiRequest<{ success: boolean; data: MandiData }>(`/mandis/${id}`);
  },
  stats(id: string, token: string) {
    return apiRequest<MandiStatsResponse>(`/mandis/${id}/stats`, { token });
  },
  toggle(token: string, id: string) {
    return apiRequest<{ success: boolean; data: MandiData; message?: string }>(`/mandis/${id}/toggle`, {
      method: "PUT", token,
    });
  },
  create(token: string, data: Partial<MandiData>) {
    return apiRequest<{ success: boolean; data: MandiData; message?: string }>("/mandis", {
      method: "POST", token, body: JSON.stringify(data),
    });
  },
  update(token: string, id: string, data: Partial<MandiData>) {
    return apiRequest<{ success: boolean; data: MandiData; message?: string }>(`/mandis/${id}`, {
      method: "PUT", token, body: JSON.stringify(data),
    });
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
    }).then((response) => ({ ...response, data: normalizeBookingData(response.data) }));
  },
  myBookings(token: string, params?: { status?: string }) {
    const qs = params?.status ? `?status=${params.status}` : "";
    return apiRequest<{ success: boolean; data: BookingData[] }>(`/bookings/my${qs}`, { token }).then((response) => ({
      ...response,
      data: response.data.map(normalizeBookingData),
    }));
  },
  mandiBookings(token: string, mandiId: string, params?: { date?: string; status?: string }) {
    const qs = new URLSearchParams();
    if (params?.date) qs.set("date", params.date);
    if (params?.status) qs.set("status", params.status);
    const q = qs.toString();
    return apiRequest<{ success: boolean; data: BookingData[] }>(`/bookings/mandi/${mandiId}${q ? `?${q}` : ""}`, { token }).then((response) => ({
      ...response,
      data: response.data.map(normalizeBookingData),
    }));
  },
  get(token: string, id: string) {
    return apiRequest<{ success: boolean; data: BookingData }>(`/bookings/${id}`, { token }).then((response) => ({
      ...response,
      data: normalizeBookingData(response.data),
    }));
  },
  cancel(token: string, id: string) {
    return apiRequest<{ success: boolean; data: BookingData }>(`/bookings/${id}/cancel`, {
      method: "PUT", token,
    }).then((response) => ({ ...response, data: normalizeBookingData(response.data) }));
  },
  checkIn(token: string, id: string) {
    return apiRequest<{ success: boolean; data: BookingData }>(`/bookings/${id}/checkin`, {
      method: "PUT", token,
    }).then((response) => ({ ...response, data: normalizeBookingData(response.data) }));
  },
  complete(token: string, id: string) {
    return apiRequest<{ success: boolean; data: BookingData }>(`/bookings/${id}/complete`, {
      method: "PUT", token,
    }).then((response) => ({ ...response, data: normalizeBookingData(response.data) }));
  },
};

export const priceApi = {
  list(params?: { mandiId?: string }) {
    const qs = params?.mandiId ? `?mandiId=${params.mandiId}` : "";
    return apiRequest<{ success: boolean; data: CropPriceData[] }>(`/prices${qs}`).then((response) => ({
      ...response,
      data: response.data.map(normalizeCropPriceData),
    }));
  },
  overview() {
    return apiRequest<{ success: boolean; data: PriceOverviewData[] }>("/prices/overview");
  },
  create(token: string, data: { crop: string; mandiId: string; currentPrice: number }) {
    return apiRequest<{ success: boolean; data: CropPriceData }>('/prices', {
      method: "POST", token, body: JSON.stringify(data),
    }).then((response) => ({ ...response, data: normalizeCropPriceData(response.data) }));
  },
  update(token: string, id: string, data: { currentPrice: number }) {
    return apiRequest<{ success: boolean; data: CropPriceData }>(`/prices/${id}`, {
      method: "PUT", token, body: JSON.stringify(data),
    }).then((response) => ({ ...response, data: normalizeCropPriceData(response.data) }));
  },
  delete(token: string, id: string) {
    return apiRequest<{ success: boolean; message: string }>(`/prices/${id}`, {
      method: "DELETE", token,
    });
  },
  catalog(params?: { active?: boolean }) {
    const qs = new URLSearchParams();
    if (params?.active !== undefined) qs.set("active", String(params.active));
    const query = qs.toString();
    return apiRequest<{ success: boolean; data: CropCatalogData[] }>(`/prices/catalog${query ? `?${query}` : ""}`);
  },
  createCatalog(token: string, data: { crop: string; cropHi?: string; category?: string; unit?: string; minPrice: number; maxPrice?: number | null; isActive?: boolean }) {
    return apiRequest<{ success: boolean; data: CropCatalogData }>("/prices/catalog", {
      method: "POST", token, body: JSON.stringify(data),
    });
  },
  updateCatalog(token: string, id: string, data: Partial<CropCatalogData>) {
    return apiRequest<{ success: boolean; data: CropCatalogData }>(`/prices/catalog/${id}`, {
      method: "PUT", token, body: JSON.stringify(data),
    });
  },
  deleteCatalog(token: string, id: string) {
    return apiRequest<{ success: boolean; message: string }>(`/prices/catalog/${id}`, {
      method: "DELETE", token,
    });
  },
};

export const notificationApi = {
  list(token: string, params?: { page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set("page", params.page.toString());
    if (params?.limit) qs.set("limit", params.limit.toString());
    const query = qs.toString();
    return apiRequest<NotificationListResponse>(`/notifications${query ? `?${query}` : ""}`, { token });
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
  broadcast(token: string, data: { title: string; message: string; target?: "all" | "farmers" | "managers" }) {
    return apiRequest<{ success: boolean; message: string }>("/notifications/broadcast", {
      method: "POST", token, body: JSON.stringify(data),
    });
  },
};

export const dashboardApi = {
  farmer(token: string) {
    return apiRequest<DashboardFarmerData>("/dashboard/farmer", { token }).then(normalizeFarmerDashboardData);
  },
  manager(token: string) {
    return apiRequest<DashboardManagerData>("/dashboard/manager", { token }).then(normalizeManagerDashboardData);
  },
  admin(token: string) {
    return apiRequest<DashboardAdminData>("/dashboard/admin", { token });
  },
  managerReports(token: string) {
    return apiRequest<ManagerReportData>("/dashboard/manager/reports", { token });
  },
  adminReports(token: string) {
    return apiRequest<AdminReportData>("/dashboard/admin/reports", { token });
  },
  analytics(token: string) {
    return apiRequest<{ success: boolean; data: Record<string, unknown> }>("/dashboard/analytics", { token });
  },
};

export const issueApi = {
  list(token: string, params?: { status?: string; priority?: string; search?: string; page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.set("status", params.status);
    if (params?.priority) qs.set("priority", params.priority);
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", params.page.toString());
    if (params?.limit) qs.set("limit", params.limit.toString());
    const query = qs.toString();
    return apiRequest<IssueListResponse>(`/issues${query ? `?${query}` : ""}`, { token });
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
  list(token: string, params?: { role?: string; search?: string; status?: string; page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.role) qs.set("role", params.role);
    if (params?.search) qs.set("search", params.search);
    if (params?.status) qs.set("status", params.status);
    if (params?.page) qs.set("page", params.page.toString());
    if (params?.limit) qs.set("limit", params.limit.toString());
    const query = qs.toString();
    return apiRequest<UserListResponse>(`/users${query ? `?${query}` : ""}`, { token });
  },
  get(token: string, id: string) {
    return apiRequest<{ success: boolean; data: UserData }>(`/users/${id}`, { token });
  },
  updateStatus(token: string, id: string, status: "active" | "suspended") {
    return apiRequest<{ success: boolean; data: UserData; message: string }>(`/users/${id}/status`, {
      method: "PUT", token, body: JSON.stringify({ status }),
    });
  },
  updateProfile(token: string, data: Record<string, unknown>) {
    return apiRequest<{ success: boolean; data: UserData }>("/users/profile", {
      method: "PUT", token, body: JSON.stringify(data),
    });
  },
  createManager(token: string, data: { name: string; email: string; password: string; phone?: string; mandiId?: string; designation?: string }) {
    return apiRequest<{ success: boolean; data: UserData; message: string }>("/users/manager", {
      method: "POST", token, body: JSON.stringify(data),
    });
  },
  createAdmin(token: string, data: { name: string; email: string; password: string; phone?: string; department?: string; twoFactorEnabled?: boolean }) {
    return apiRequest<{ success: boolean; data: UserData; message: string }>("/users/admin", {
      method: "POST", token, body: JSON.stringify(data),
    });
  },
  assignManager(token: string, id: string, data: { mandiId?: string; designation?: string }) {
    return apiRequest<{ success: boolean; data: UserData; message: string }>(`/users/manager/${id}/assignment`, {
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
  list(token: string, params?: { type?: string; search?: string; page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.type) qs.set("type", params.type);
    if (params?.search) qs.set("search", params.search);
    if (params?.page) qs.set("page", params.page.toString());
    if (params?.limit) qs.set("limit", params.limit.toString());
    const q = qs.toString();
    return apiRequest<AuditLogListResponse>(`/audit-logs${q ? `?${q}` : ""}`, { token });
  },
};

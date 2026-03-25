/**
 * ============================================================================
 * MANDIBOOK — SHARED TYPES
 * ============================================================================
 */

// ── Actor roles ──────────────────────────────────────────────────────────────

export type UserRole = "farmer" | "manager" | "admin";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  phone?: string;
  email?: string;
  avatar?: string;
  language: "en" | "hi";
  profileComplete?: boolean;
  lastLoginAt?: string;
  createdAt: string;
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
}

export interface Farmer extends User {
  role: "farmer";
  phone?: string;
  email?: string;
  aadhaarLast4?: string;
  village?: string;
  district?: string;
  state?: string;
  pincode?: string;
  landHolding?: number;
  farmSize?: string;
  preferredMandis: string[];
  crops?: string[];
  priceAlertCrops?: string[];
}

export interface Manager extends User {
  role: "manager";
  email: string;
  mandiId: string;
  designation?: string;
  managingSince?: string;
}

export interface Admin extends User {
  role: "admin";
  email: string;
  department?: string;
  twoFactorEnabled: boolean;
}

// ── Mandi ────────────────────────────────────────────────────────────────────

export interface Mandi {
  id: string;
  name: string;
  nameHi: string;
  code: string;
  address: string;
  district: string;
  state: string;
  pincode: string;
  lat?: number;
  lng?: number;
  contactPhone: string;
  managerId: string;
  totalSlots: number;
  operatingHours: { open: string; close: string };
  holidays: string[];
  isActive: boolean;
  createdAt: string;
}

// ── Slots & Bookings ─────────────────────────────────────────────────────────

export type SlotStatus = "available" | "booked" | "blocked" | "completed";

export interface TimeSlot {
  id: string;
  mandiId: string;
  date: string;
  startTime: string;
  endTime: string;
  capacity: number;
  bookedCount: number;
  status: SlotStatus;
}

export type BookingStatus =
  | "confirmed"
  | "checked-in"
  | "completed"
  | "cancelled"
  | "no-show";

export interface Booking {
  id: string;
  bookingNumber: string;
  farmerId: string;
  farmerName: string;
  mandiId: string;
  mandiName: string;
  slotId: string;
  date: string;
  timeSlot: string;
  cropType: string;
  estimatedQuantityKg: number;
  vehicleNumber?: string;
  status: BookingStatus;
  qrCode: string;
  checkedInAt?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  createdAt: string;
}

// ── Crops & Prices ───────────────────────────────────────────────────────────

export interface Crop {
  id: string;
  name: string;
  nameHi: string;
  category: string;
  unit: "kg" | "quintal" | "ton";
  icon?: string;
}

export interface CropPrice {
  id: string;
  cropId: string;
  cropName: string;
  mandiId: string;
  mandiName: string;
  minPrice: number;
  maxPrice: number;
  modalPrice: number;
  date: string;
  trend: "up" | "down" | "stable";
  changePercent: number;
}

// ── Notifications ────────────────────────────────────────────────────────────

export type NotificationType =
  | "booking-confirmed"
  | "booking-reminder"
  | "booking-cancelled"
  | "price-alert"
  | "announcement"
  | "system";

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  titleHi?: string;
  message: string;
  messageHi?: string;
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
}

// ── Issues ───────────────────────────────────────────────────────────────────

export type IssueStatus = "open" | "in-progress" | "resolved" | "closed";
export type IssuePriority = "low" | "medium" | "high" | "critical";

export interface Issue {
  id: string;
  reporterId: string;
  reporterName: string;
  mandiId?: string;
  title: string;
  description: string;
  status: IssueStatus;
  priority: IssuePriority;
  assignedTo?: string;
  resolution?: string;
  createdAt: string;
  updatedAt: string;
}

// ── Audit Log ────────────────────────────────────────────────────────────────

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  ipAddress?: string;
  createdAt: string;
}

// ── Dashboard Stats ──────────────────────────────────────────────────────────

export interface FarmerDashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  cancelledBookings: number;
}

export interface ManagerDashboardStats {
  todayBookings: number;
  todayCheckedIn: number;
  slotUtilization: number;
  totalFarmersToday: number;
  topCrops: { crop: string; count: number }[];
}

export interface AdminDashboardStats {
  totalMandis: number;
  activeMandis: number;
  totalFarmers: number;
  totalManagers: number;
  totalBookingsToday: number;
  platformUtilization: number;
  openIssues: number;
}

export type Role = "tenant" | "admin";
export type BillStatus = "pending" | "submitted" | "paid" | "overdue";
export type MaintenanceStatus =
  | "open"
  | "in_progress"
  | "resolved"
  | "cancelled";
export type RoomStatus = "available" | "maintenance";
export type Priority = "low" | "medium" | "high";
export type TenantRoute =
  | "dashboard"
  | "bills"
  | "maintenance"
  | "announcements";
export type AdminRoute =
  | "dashboard"
  | "occupancy"
  | "billing"
  | "maintenance"
  | "announcements";
export type AppRoute = TenantRoute | AdminRoute;

export type FlashState = {
  message: string;
  tone: "success" | "info" | "danger";
} | null;

export type RouteDefinition = {
  key: AppRoute;
  label: string;
  emoji: string;
};

export type PageMeta = {
  title: string;
  description: string;
};

export type OverviewCard = {
  label: string;
  value: string;
  description: string;
};

export type User = {
  id: string;
  username: string;
  password: string;
  fullName: string;
  phone: string;
  role: Role;
  roomId: string;
};

export type Room = {
  id: string;
  number: string;
  type: string;
  status: RoomStatus;
  baseRent: number;
  tenantId: string;
};

export type Announcement = {
  id: string;
  title: string;
  message: string;
  priority: Priority;
  createdAt: string;
  createdBy: string;
};

export type Bill = {
  id: string;
  roomId: string;
  tenantId: string;
  month: string;
  baseRent: number;
  waterUnits: number;
  electricityUnits: number;
  total: number;
  status: BillStatus;
  dueDate: string;
  qrReference: string;
  slipImage: string;
  createdAt: string;
  paidAt: string;
  submittedAt: string;
};

export type MaintenanceRequest = {
  id: string;
  tenantId: string;
  roomId: string;
  title: string;
  category: string;
  description: string;
  status: MaintenanceStatus;
  createdAt: string;
  updatedAt: string;
  assignee: string;
  adminNote: string;
  residentImage: string;
  completionImage: string;
};

export type AppState = {
  users: User[];
  rooms: Room[];
  announcements: Announcement[];
  bills: Bill[];
  maintenanceRequests: MaintenanceRequest[];
};

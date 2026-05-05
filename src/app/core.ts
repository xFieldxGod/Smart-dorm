import type {
  Announcement,
  AppRoute,
  AppState,
  Bill,
  PageMeta,
  Role,
  Room,
  RouteDefinition,
  User,
} from "./types";

export const STORAGE_KEY = "smart-dorm-react-state-v2";
export const SESSION_KEY = "smart-dorm-react-session-v1";
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
export const WATER_RATE = 30;
export const ELECTRIC_RATE = 6;

export const routeDefinitions: Record<Role, RouteDefinition[]> = {
  tenant: [
    { key: "dashboard", label: "Dashboard", emoji: "🏠" },
    { key: "bills", label: "บิลและการชำระเงิน", emoji: "💳" },
    { key: "maintenance", label: "แจ้งซ่อม", emoji: "🛠️" },
    { key: "announcements", label: "ประกาศ", emoji: "📣" },
  ],
  admin: [
    { key: "dashboard", label: "Dashboard", emoji: "📊" },
    { key: "occupancy", label: "ห้องพักและผู้เช่า", emoji: "🏢" },
    { key: "billing", label: "มิเตอร์และบิล", emoji: "🧾" },
    { key: "maintenance", label: "จัดการงานซ่อม", emoji: "🧰" },
    { key: "announcements", label: "ประกาศ", emoji: "📢" },
  ],
};

export const pageTitleMap: Record<Role, Record<AppRoute, PageMeta>> = {
  tenant: {
    dashboard: {
      title: "Tenant Dashboard",
      description:
        "ดูยอดค้างชำระ ข่าวประกาศล่าสุด และสถานะคำร้องของห้องพักคุณได้ในหน้าเดียว",
    },
    bills: {
      title: "บิลและการชำระเงิน",
      description:
        "ตรวจสอบบิลย้อนหลัง ดูยอดปัจจุบัน และอัปโหลดหลักฐานการชำระเงินผ่านหน้าเว็บ",
    },
    maintenance: {
      title: "แจ้งซ่อมและติดตามสถานะ",
      description:
        "สร้างรายการแจ้งซ่อม แนบรูปภาพ และติดตามสถานะการดำเนินงานของเจ้าหน้าที่",
    },
    announcements: {
      title: "ประกาศจากผู้ดูแลอาคาร",
      description: "รับข่าวสารและการแจ้งเตือนสำคัญที่ส่งถึงผู้เช่าทุกคนในระบบ",
    },
    occupancy: { title: "", description: "" },
    billing: { title: "", description: "" },
  },
  admin: {
    dashboard: {
      title: "Admin Dashboard",
      description:
        "สรุปรายรับ ประสิทธิภาพการชำระเงิน และสถานะภาพรวมของหอพักแบบเรียลไทม์",
    },
    occupancy: {
      title: "ห้องพักและผู้เช่า",
      description:
        "เพิ่ม แก้ไข และลบข้อมูลห้องพัก รวมถึงจัดการการเข้าพักของผู้เช่า",
    },
    billing: {
      title: "มิเตอร์และออกบิล",
      description:
        "บันทึกเลขมิเตอร์ สร้างบิลรายเดือน และตรวจสอบสลิปการชำระเงินจากผู้เช่า",
    },
    maintenance: {
      title: "จัดการงานซ่อม",
      description:
        "รับเรื่องแจ้งซ่อม อัปเดตสถานะ มอบหมายงาน และปิดงานด้วยรูปยืนยัน",
    },
    announcements: {
      title: "ระบบประกาศ",
      description: "โพสต์ข่าวสารสำคัญและแจ้งเตือนไปยังผู้เช่าทุกคนในระบบ",
    },
    bills: { title: "", description: "" },
  },
};

function pad(value: number) {
  return String(value).padStart(2, "0");
}

export function addDays(baseDate: Date, amount: number) {
  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + amount);
  return nextDate;
}

export function addMonths(baseDate: Date, amount: number) {
  const nextDate = new Date(baseDate);
  nextDate.setMonth(nextDate.getMonth() + amount);
  return nextDate;
}

export function toDateInput(dateValue: Date | string) {
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toMonthValue(dateValue: Date | string) {
  const date = new Date(dateValue);
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

export const today = new Date();
export const currentMonth = toMonthValue(today);
export const previousMonth = toMonthValue(addMonths(today, -1));

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

export function formatDate(value: string, includeTime = false) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return new Intl.DateTimeFormat(
    "th-TH",
    includeTime
      ? { dateStyle: "medium", timeStyle: "short" }
      : { dateStyle: "medium" },
  ).format(date);
}

export function formatMonthLabel(monthValue: string) {
  const [year, month] = monthValue.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return new Intl.DateTimeFormat("th-TH", {
    month: "long",
    year: "numeric",
  }).format(date);
}

export function getStatusLabel(status: string) {
  const labels: Record<string, string> = {
    open: "รอดำเนินการ",
    in_progress: "กำลังดำเนินการ",
    resolved: "เสร็จสิ้น",
    cancelled: "ยกเลิก",
    pending: "รอชำระ",
    submitted: "รอตรวจสอบ",
    paid: "ชำระแล้ว",
    overdue: "เกินกำหนด",
    available: "ห้องว่าง",
    occupied: "มีผู้พัก",
    maintenance: "ปิดซ่อม",
    low: "ทั่วไป",
    medium: "สำคัญ",
    high: "ด่วน",
  };
  return labels[status] || status;
}

export function getToneClass(status: string) {
  const tones: Record<string, string> = {
    open: "warning",
    in_progress: "info",
    resolved: "success",
    cancelled: "neutral",
    pending: "warning",
    submitted: "info",
    paid: "success",
    overdue: "danger",
    available: "success",
    occupied: "info",
    maintenance: "danger",
    low: "neutral",
    medium: "warning",
    high: "danger",
  };
  return tones[status] || "neutral";
}

export function getRoleLabel(role: Role) {
  return role === "admin" ? "ผู้ดูแลอาคาร" : "ผู้เช่า";
}

export function getBillTotal(bill: Bill) {
  return (
    bill.total ??
    bill.baseRent +
      bill.waterUnits * WATER_RATE +
      bill.electricityUnits * ELECTRIC_RATE
  );
}

export function getInitials(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "SD";
  return parts
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export function sortByCreatedDescending<
  T extends { createdAt: string; updatedAt?: string },
>(left: T, right: T) {
  return (
    new Date(right.updatedAt || right.createdAt).getTime() -
    new Date(left.updatedAt || left.createdAt).getTime()
  );
}

export function sortBillsDescending(left: Bill, right: Bill) {
  if (right.month !== left.month) return right.month.localeCompare(left.month);
  return (
    new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

export async function readImageFile(file: File | null) {
  if (!file) return "";
  if (!file.type.startsWith("image/")) {
    throw new Error(
      "ไม่สามารถอัพโหลดแบบไฟล์ PDF หรือไฟล์อื่นๆ ได้ กรุณาใช้ไฟล์รูปภาพเท่านั้น",
    );
  }
  if (file.size > MAX_IMAGE_SIZE) {
    throw new Error("ไฟล์ภาพต้องมีขนาดไม่เกิน 5 MB");
  }
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve(typeof reader.result === "string" ? reader.result : "");
    reader.onerror = () => reject(new Error("ไม่สามารถอ่านไฟล์ภาพได้"));
    reader.readAsDataURL(file);
  });
}

export function getRoomById(state: AppState, roomId: string) {
  return state.rooms.find((room) => room.id === roomId) || null;
}

export function getUserById(state: AppState, userId: string) {
  return state.users.find((user) => user.id === userId) || null;
}

export function getBillById(state: AppState, billId: string) {
  return state.bills.find((bill) => bill.id === billId) || null;
}

export function getMaintenanceById(state: AppState, requestId: string) {
  return (
    state.maintenanceRequests.find((request) => request.id === requestId) ||
    null
  );
}

export function getRoomName(state: AppState, roomId: string) {
  return getRoomById(state, roomId)?.number || "-";
}

export function getUserName(state: AppState, userId: string) {
  return getUserById(state, userId)?.fullName || "ผู้ใช้งานเดิม";
}

export function getTenantUsers(state: AppState) {
  return state.users.filter((user) => user.role === "tenant");
}

export function getBillsForTenant(state: AppState, tenantId: string) {
  return state.bills
    .filter((bill) => bill.tenantId === tenantId)
    .sort(sortBillsDescending);
}

export function getMaintenanceForTenant(state: AppState, tenantId: string) {
  return state.maintenanceRequests
    .filter((request) => request.tenantId === tenantId)
    .sort(sortByCreatedDescending);
}

export function getLatestAnnouncements(state: AppState, limit = 10) {
  return [...state.announcements].sort(sortByCreatedDescending).slice(0, limit);
}

export function getRoomDisplayStatus(room: Room) {
  return room.tenantId ? "occupied" : room.status;
}

export function getTenantOutstandingAmount(state: AppState, tenantId: string) {
  return getBillsForTenant(state, tenantId)
    .filter((bill) => bill.status !== "paid")
    .reduce((sum, bill) => sum + getBillTotal(bill), 0);
}

export function getAssignableRoomsForTenant(state: AppState, tenantId = "") {
  return state.rooms.filter(
    (room) =>
      (room.status !== "maintenance" || room.tenantId === tenantId) &&
      (!room.tenantId || room.tenantId === tenantId),
  );
}

export function sumBills(bills: Bill[]) {
  return bills.reduce((sum, bill) => sum + getBillTotal(bill), 0);
}

export function getTenantRoom(state: AppState, tenant: User | null) {
  if (!tenant) return null;
  return getRoomById(state, tenant.roomId);
}

export function getPendingCounts(state: AppState) {
  return {
    pendingRequests: state.maintenanceRequests.filter(
      (request) => request.status !== "resolved",
    ).length,
    pendingBills: state.bills.filter((bill) => bill.status !== "paid").length,
  };
}

export function getAnnouncementsPreview(state: AppState): Announcement[] {
  return getLatestAnnouncements(state, 50);
}

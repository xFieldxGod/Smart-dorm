import {
  Activity,
  BarChart3,
  ChevronRight,
  ClipboardList,
  Megaphone,
  TrendingUp,
  Wallet,
  Wrench,
} from "lucide-react";
import { useState, type FormEvent } from "react";
import { cn } from "../../lib/utils";
import { EmptyState, StatusBadge } from "../components/ui";
import {
  addDays,
  currentMonth,
  ELECTRIC_RATE,
  formatCurrency,
  formatDate,
  formatMonthLabel,
  getBillTotal,
  previousMonth,
  sortBillsDescending,
  sortByCreatedDescending,
  sumBills,
  toDateInput,
  today,
  WATER_RATE,
} from "../core";
import type { AppState, MaintenanceRequest, Room, User } from "../types";

type AdminDashboardViewProps = {
  state: AppState;
  onNavigateBilling?: () => void;
  onNavigateMaintenance?: () => void;
  onNavigateAnnouncements?: () => void;
};

function ProgressRing({
  value,
  size = 72,
  strokeWidth = 6,
}: {
  value: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="-rotate-90" width={size} height={size}>
        <circle
          className="text-muted"
          strokeWidth={strokeWidth}
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
          opacity={0.3}
        />
        <circle
          className="text-primary transition-all duration-500 ease-out"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          stroke="currentColor"
          fill="transparent"
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-bold text-foreground">{value}%</span>
      </div>
    </div>
  );
}

function DashCard({
  label,
  value,
  description,
  icon: Icon,
  variant = "default",
  trend,
}: {
  label: string;
  value: string;
  description: string;
  icon: React.ElementType;
  variant?: "default" | "primary" | "warning";
  trend?: { value: number; isPositive: boolean };
}) {
  const styles = {
    default: {
      card: "bg-card border-border",
      icon: "bg-muted text-muted-foreground",
      value: "text-foreground",
    },
    primary: {
      card: "bg-primary/5 border-primary/20",
      icon: "bg-primary/10 text-primary",
      value: "text-primary",
    },
    warning: {
      card: "bg-warning/5 border-warning/30",
      icon: "bg-warning/10 text-warning-foreground",
      value: "text-warning-foreground",
    },
  }[variant];
  return (
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5",
        styles.card,
      )}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-muted-foreground">
            {label}
          </span>
          <div className="mt-2 flex items-baseline gap-2">
            <strong
              className={cn(
                "text-2xl font-bold tracking-tight lg:text-3xl",
                styles.value,
              )}
            >
              {value}
            </strong>
            {trend && (
              <span
                className={cn(
                  "text-xs font-semibold px-1.5 py-0.5 rounded-md",
                  trend.isPositive
                    ? "text-success bg-success/10"
                    : "text-destructive bg-destructive/10",
                )}
              >
                {trend.isPositive ? "+" : ""}
                {trend.value}%
              </span>
            )}
          </div>
          <p className="mt-2 text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
        </div>
        <div
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl",
            styles.icon,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </article>
  );
}

function ActionItem({
  icon: Icon,
  title,
  description,
  status,
  count,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  status: string;
  count: number;
  onClick?: () => void;
}) {
  return (
    <div
      className="group flex items-center gap-4 p-4 rounded-xl bg-muted/40 hover:bg-muted transition-all duration-200 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-semibold text-sm text-foreground truncate">
          {title}
        </h4>
        <p className="text-xs text-muted-foreground truncate mt-0.5">
          {description}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <StatusBadge status={status} />
        <span className="text-lg font-bold text-foreground min-w-[2ch] text-right">
          {count}
        </span>
        <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
      </div>
    </div>
  );
}

function MetricProgress({ label, value }: { label: string; value: number }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-sm font-bold text-foreground">{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div
          className="h-full rounded-full bg-primary transition-all duration-700 ease-out"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function AdminDashboardView({
  state,
  onNavigateBilling,
  onNavigateMaintenance,
  onNavigateAnnouncements,
}: AdminDashboardViewProps) {
  const currentMonthBills = state.bills.filter(
    (bill) => bill.month === currentMonth,
  );
  const previousMonthBills = state.bills.filter(
    (bill) => bill.month === previousMonth,
  );
  const paidRevenue = sumBills(
    currentMonthBills.filter((bill) => bill.status === "paid"),
  );
  const previousRevenue = sumBills(
    previousMonthBills.filter((bill) => bill.status === "paid"),
  );
  const totalGenerated = sumBills(currentMonthBills) || 1;
  const occupancyRate = state.rooms.length
    ? Math.round(
        (state.rooms.filter((room) => room.tenantId).length /
          state.rooms.length) *
          100,
      )
    : 0;
  const maintenanceResolvedRate = state.maintenanceRequests.length
    ? Math.round(
        (state.maintenanceRequests.filter((r) => r.status === "resolved")
          .length /
          state.maintenanceRequests.length) *
          100,
      )
    : 0;
  const pendingMaintenanceCount = state.maintenanceRequests.filter(
    (r) => r.status !== "resolved" && r.status !== "cancelled",
  ).length;
  const submittedBillsCount = state.bills.filter(
    (b) => b.status === "submitted",
  ).length;
  const openMaintenanceCount = state.maintenanceRequests.filter(
    (r) => r.status === "open",
  ).length;
  const collectionRate = Math.round((paidRevenue / totalGenerated) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 rounded-full bg-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            Dashboard
          </h1>
        </div>
        <p className="text-muted-foreground ml-3">
          ภาพรวมการจัดการหอพักประจำเดือน
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <DashCard
          label="รายรับเดือนนี้"
          value={formatCurrency(paidRevenue)}
          description="ยอดที่ได้รับการยืนยันการชำระแล้ว"
          icon={Wallet}
          variant="primary"
          trend={
            previousRevenue > 0
              ? {
                  value: Math.round(
                    ((paidRevenue - previousRevenue) / previousRevenue) * 100,
                  ),
                  isPositive: paidRevenue >= previousRevenue,
                }
              : undefined
          }
        />
        <DashCard
          label="เทียบเดือนก่อน"
          value={formatCurrency(previousRevenue)}
          description="สำหรับเปรียบเทียบแนวโน้มรายรับ"
          icon={TrendingUp}
        />
        <DashCard
          label="คำร้องคงค้าง"
          value={String(pendingMaintenanceCount)}
          description="ต้องติดตามและอัปเดตสถานะอย่างต่อเนื่อง"
          icon={Wrench}
          variant={pendingMaintenanceCount > 5 ? "warning" : "default"}
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                  Performance
                </span>
                <h2 className="text-lg font-bold text-foreground">
                  ตัวชี้วัดภาพรวม
                </h2>
              </div>
            </div>
            <Activity className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="flex items-center justify-around mb-6 py-4 border-y border-border/50">
            <div className="flex flex-col items-center gap-2">
              <ProgressRing value={collectionRate} />
              <span className="text-xs text-muted-foreground text-center">
                อัตราจัดเก็บ
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ProgressRing value={occupancyRate} />
              <span className="text-xs text-muted-foreground text-center">
                อัตราเข้าพัก
              </span>
            </div>
            <div className="flex flex-col items-center gap-2">
              <ProgressRing value={maintenanceResolvedRate} />
              <span className="text-xs text-muted-foreground text-center">
                งานซ่อมสำเร็จ
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <MetricProgress
              label="อัตราการจัดเก็บรายรับ"
              value={collectionRate}
            />
            <MetricProgress label="อัตราการเข้าพัก" value={occupancyRate} />
            <MetricProgress
              label="อัตราปิดงานซ่อม"
              value={maintenanceResolvedRate}
            />
          </div>
        </article>

        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-warning/10">
                <ClipboardList className="h-5 w-5 text-warning-foreground" />
              </div>
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-warning-foreground">
                  Immediate Actions
                </span>
                <h2 className="text-lg font-bold text-foreground">
                  รายการที่ควรติดตาม
                </h2>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <ActionItem
              icon={Wallet}
              title="บิลรอการตรวจสอบ"
              description="ผู้เช่าส่งสลิปแล้วและกำลังรอการยืนยัน"
              status="submitted"
              count={submittedBillsCount}
              onClick={onNavigateBilling}
            />
            <ActionItem
              icon={Wrench}
              title="คำร้องที่ยังไม่รับเรื่อง"
              description="ตรวจสอบคำร้องใหม่และมอบหมายช่างให้เหมาะสม"
              status="open"
              count={openMaintenanceCount}
              onClick={onNavigateMaintenance}
            />
            <ActionItem
              icon={Megaphone}
              title="ประกาศล่าสุด"
              description="อัปเดตข่าวสารเพื่อสื่อสารกับผู้เช่าได้ทันที"
              status="high"
              count={state.announcements.length}
              onClick={onNavigateAnnouncements}
            />
          </div>

          <div className="mt-6 pt-4 border-t border-border/50">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {state.rooms.length}
                </p>
                <p className="text-xs text-muted-foreground">ห้องทั้งหมด</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {state.users.filter((u) => u.role === "tenant").length}
                </p>
                <p className="text-xs text-muted-foreground">ผู้เช่า</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {currentMonthBills.length}
                </p>
                <p className="text-xs text-muted-foreground">บิลเดือนนี้</p>
              </div>
            </div>
          </div>
        </article>
      </section>
    </div>
  );
}

type AdminOccupancyViewProps = {
  rooms: Room[];
  tenants: User[];
  editingRoom: Room | null;
  editingTenant: User | null;
  deletingRoomId: string;
  deletingTenantId: string;
  getAssignableRoomsForTenant: (tenantId?: string) => Room[];
  getRoomName: (roomId: string) => string;
  getRoomDisplayStatus: (room: Room) => string;
  getUserName: (userId: string) => string;
  isSubmittingRoom: boolean;
  isSubmittingTenant: boolean;
  onSubmitTenant: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitRoom: (event: FormEvent<HTMLFormElement>) => void;
  onEditTenant: (tenantId: string) => void;
  onDeleteTenant: (tenantId: string) => void;
  onEditRoom: (roomId: string) => void;
  onDeleteRoom: (roomId: string) => void;
  onClearTenantForm: () => void;
  onClearRoomForm: () => void;
};

export function AdminOccupancyView(props: AdminOccupancyViewProps) {
  const {
    rooms,
    tenants,
    editingRoom,
    editingTenant,
    deletingRoomId,
    deletingTenantId,
    getAssignableRoomsForTenant,
    getRoomName,
    getRoomDisplayStatus,
    getUserName,
    isSubmittingRoom,
    isSubmittingTenant,
    onSubmitTenant,
    onSubmitRoom,
    onEditTenant,
    onDeleteTenant,
    onEditRoom,
    onDeleteRoom,
    onClearTenantForm,
    onClearRoomForm,
  } = props;

  const [activeTab, setActiveTab] = useState<"tenants" | "rooms">("tenants");

  return (
    <>
      <div className="tabs-container">
        <button
          className={`tab-button ${activeTab === "tenants" ? "is-active" : ""}`}
          onClick={() => setActiveTab("tenants")}
        >
          จัดการผู้เช่า
        </button>
        <button
          className={`tab-button ${activeTab === "rooms" ? "is-active" : ""}`}
          onClick={() => setActiveTab("rooms")}
        >
          จัดการห้องพัก
        </button>
      </div>

      <section className="content-grid two-columns align-start">
        {/* Tenants Column (Shows when tab is tenants or on large screens where tabs could be hidden, but we'll just show based on activeTab for all screens) */}
        {activeTab === "tenants" && (
          <div className="tab-pane-content">
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">Tenant Management</span>
                  <h2>
                    {editingTenant ? "แก้ไขข้อมูลผู้เช่า" : "เพิ่มผู้เช่าใหม่"}
                  </h2>
                </div>
                {editingTenant ? (
                  <button
                    className="ghost-button compact"
                    type="button"
                    onClick={onClearTenantForm}
                    disabled={isSubmittingTenant}
                  >
                    ล้างฟอร์ม
                  </button>
                ) : null}
              </div>
              <form
                key={editingTenant?.id || "new-tenant"}
                className="form-grid"
                onSubmit={onSubmitTenant}
              >
                <input
                  name="tenantId"
                  type="hidden"
                  defaultValue={editingTenant?.id || ""}
                />
                <label>
                  <span>ชื่อ - นามสกุล</span>
                  <input
                    name="fullName"
                    type="text"
                    defaultValue={editingTenant?.fullName || ""}
                    placeholder="ชื่อผู้เช่า"
                    required
                    disabled={isSubmittingTenant}
                  />
                </label>
                <label>
                  <span>รหัสผ่าน</span>
                  <input
                    name="password"
                    type="text"
                    placeholder={
                      editingTenant
                        ? "เว้นว่างถ้าใช้รหัสเดิม"
                        : "ตั้งค่ารหัสใหม่ (หรือใช้ tenant123)"
                    }
                    disabled={isSubmittingTenant}
                  />
                </label>
                <label>
                  <span>เบอร์โทรศัพท์</span>
                  <input
                    name="phone"
                    type="text"
                    defaultValue={editingTenant?.phone || ""}
                    placeholder="08x-xxx-xxxx"
                    required
                    disabled={isSubmittingTenant}
                  />
                </label>
                <label>
                  <span>กำหนดห้องพัก</span>
                  <select
                    name="roomId"
                    defaultValue={editingTenant?.roomId || ""}
                    required
                    disabled={isSubmittingTenant}
                  >
                    <option value="">-- กรุณาเลือกห้องพัก --</option>
                    {getAssignableRoomsForTenant(editingTenant?.id || "").map(
                      (room) => (
                        <option key={room.id} value={room.id}>
                          {room.number} · {room.type}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <button
                  className="primary-button full-span"
                  type="submit"
                  disabled={isSubmittingTenant}
                >
                  {isSubmittingTenant
                    ? "กำลังบันทึก..."
                    : editingTenant
                      ? "บันทึกการแก้ไขผู้เช่า"
                      : "เพิ่มผู้เช่า"}
                </button>
              </form>
              <div className="helper-note">
                ผู้เช่าใหม่จะใช้รหัสผ่านเริ่มต้นเป็น <strong>tenant123</strong>
              </div>
            </article>

            <article className="panel" style={{ marginTop: "14px" }}>
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">Tenant List</span>
                  <h2>ผู้เช่าในระบบ</h2>
                </div>
              </div>
              {tenants.length ? (
                tenants.map((tenant) => (
                  <div className="list-item align-start" key={tenant.id}>
                    <div>
                      <strong>{tenant.fullName}</strong>
                      <p>
                        {tenant.username} (เชื่อมกับรหัสห้อง) · 📞{" "}
                        {tenant.phone}
                      </p>
                      <small>
                        {tenant.roomId
                          ? getRoomName(tenant.roomId)
                          : "ไม่มีห้องพัก"}
                      </small>
                    </div>
                    <div className="room-actions-row">
                      <button
                        className="ghost-button compact"
                        type="button"
                        onClick={() => onEditTenant(tenant.id)}
                        disabled={
                          isSubmittingTenant || deletingTenantId === tenant.id
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="ghost-button compact danger-text"
                        type="button"
                        onClick={() => onDeleteTenant(tenant.id)}
                        disabled={
                          isSubmittingTenant || deletingTenantId === tenant.id
                        }
                      >
                        {deletingTenantId === tenant.id
                          ? "กำลังลบ..."
                          : "Delete"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="ยังไม่มีผู้เช่า"
                  description="สามารถเพิ่มข้อมูลผู้เช่าได้จากฟอร์มด้านบน"
                />
              )}
            </article>
          </div>
        )}

        {/* Rooms Column */}
        {activeTab === "rooms" && (
          <div className="tab-pane-content">
            <article className="panel">
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">Room Management</span>
                  <h2>
                    {editingRoom ? "แก้ไขข้อมูลห้องพัก" : "เพิ่มห้องพักใหม่"}
                  </h2>
                </div>
                {editingRoom ? (
                  <button
                    className="ghost-button compact"
                    type="button"
                    onClick={onClearRoomForm}
                    disabled={isSubmittingRoom}
                  >
                    ล้างฟอร์ม
                  </button>
                ) : null}
              </div>
              <form
                key={editingRoom?.id || "new-room"}
                className="form-grid"
                onSubmit={onSubmitRoom}
              >
                <input
                  name="roomId"
                  type="hidden"
                  defaultValue={editingRoom?.id || ""}
                />
                <label>
                  <span>เลขห้อง</span>
                  <input
                    name="number"
                    type="text"
                    defaultValue={editingRoom?.number || ""}
                    placeholder="เช่น A-201"
                    required
                    disabled={isSubmittingRoom}
                  />
                </label>
                <label>
                  <span>ประเภทห้อง</span>
                  <input
                    name="type"
                    type="text"
                    defaultValue={editingRoom?.type || ""}
                    placeholder="Studio / Deluxe / Suite"
                    required
                    disabled={isSubmittingRoom}
                  />
                </label>
                <label>
                  <span>ค่าเช่าพื้นฐาน</span>
                  <input
                    name="baseRent"
                    type="number"
                    min="0"
                    step="100"
                    defaultValue={editingRoom?.baseRent || ""}
                    required
                    disabled={isSubmittingRoom}
                  />
                </label>
                <label>
                  <span>สถานะห้อง</span>
                  <select
                    name="status"
                    defaultValue={editingRoom?.status || "available"}
                    disabled={isSubmittingRoom}
                  >
                    <option value="available">ห้องว่าง</option>
                    <option value="maintenance">ปิดซ่อม</option>
                  </select>
                </label>
                <button
                  className="primary-button full-span"
                  type="submit"
                  disabled={isSubmittingRoom}
                >
                  {isSubmittingRoom
                    ? "กำลังบันทึก..."
                    : editingRoom
                      ? "บันทึกการแก้ไขห้องพัก"
                      : "เพิ่มห้องพัก"}
                </button>
              </form>
            </article>

            <article className="panel" style={{ marginTop: "14px" }}>
              <div className="panel-heading">
                <div>
                  <span className="section-kicker">Room Inventory</span>
                  <h2>ห้องพักทั้งหมด</h2>
                </div>
              </div>
              {rooms.length ? (
                rooms.map((room) => (
                  <div className="list-item align-start" key={room.id}>
                    <div>
                      <strong>
                        {room.number} · {room.type}
                      </strong>
                      <p>ค่าเช่าพื้นฐาน {formatCurrency(room.baseRent)}</p>
                      <small>
                        {room.tenantId
                          ? getUserName(room.tenantId)
                          : "ยังไม่มีผู้เช่า"}
                      </small>
                    </div>
                    <div className="room-actions-row">
                      <StatusBadge status={getRoomDisplayStatus(room)} />
                      <button
                        className="ghost-button compact"
                        type="button"
                        onClick={() => onEditRoom(room.id)}
                        disabled={
                          isSubmittingRoom || deletingRoomId === room.id
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="ghost-button compact danger-text"
                        type="button"
                        onClick={() => onDeleteRoom(room.id)}
                        disabled={
                          isSubmittingRoom || deletingRoomId === room.id
                        }
                      >
                        {deletingRoomId === room.id ? "กำลังลบ..." : "Delete"}
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  title="ยังไม่มีห้องพัก"
                  description="เริ่มต้นเพิ่มข้อมูลห้องพักได้จากฟอร์มด้านบน"
                />
              )}
            </article>
          </div>
        )}
      </section>
    </>
  );
}

type AdminBillingViewProps = {
  state: AppState;
  getUserName: (userId: string) => string;
  getRoomName: (roomId: string) => string;
  isSubmittingGenerateBill: boolean;
  updatingBillId: string;
  editingBillId: string;
  deletingBillId: string;
  onSubmitGenerateBill: (event: FormEvent<HTMLFormElement>) => void;
  onSubmitBillStatus: (
    event: FormEvent<HTMLFormElement>,
    billId: string,
  ) => void;
  onEditBill: (billId: string) => void;
  onDeleteBill: (billId: string) => void;
  onClearBillForm: () => void;
};

export function AdminBillingView({
  state,
  getUserName,
  getRoomName,
  isSubmittingGenerateBill,
  updatingBillId,
  editingBillId,
  deletingBillId,
  onSubmitGenerateBill,
  onSubmitBillStatus,
  onEditBill,
  onDeleteBill,
  onClearBillForm,
}: AdminBillingViewProps) {
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMonth, setFilterMonth] = useState("all");

  const editingBill = state.bills.find((b) => b.id === editingBillId) || null;

  const occupiedRooms = state.rooms.filter((room) => room.tenantId);
  const allBills = [...state.bills].sort(sortBillsDescending);

  const uniqueMonths = Array.from(new Set(allBills.map((b) => b.month)))
    .sort()
    .reverse();

  const bills = allBills.filter((bill) => {
    const matchStatus = filterStatus === "all" || bill.status === filterStatus;
    const matchMonth = filterMonth === "all" || bill.month === filterMonth;
    return matchStatus && matchMonth;
  });

  return (
    <>
      <section className="content-grid two-columns align-start">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Meter Entry</span>
              <h2>{editingBill ? "แก้ไขบิล" : "สร้างบิลรายเดือน"}</h2>
            </div>
            {editingBill && (
              <button
                className="ghost-button compact"
                type="button"
                onClick={onClearBillForm}
              >
                ยกเลิกแก้ไข
              </button>
            )}
          </div>
          {occupiedRooms.length ? (
            <form
              key={editingBill?.id || "new-bill"}
              className="form-grid"
              onSubmit={onSubmitGenerateBill}
            >
              <input
                name="billId"
                type="hidden"
                defaultValue={editingBill?.id || ""}
              />
              <label>
                <span>เลือกห้องพัก</span>
                <select
                  name="roomId"
                  defaultValue={editingBill?.roomId || occupiedRooms[0].id}
                  disabled={isSubmittingGenerateBill || !!editingBill}
                >
                  {occupiedRooms.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.number} · {getUserName(room.tenantId)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>ประจำเดือน</span>
                <input
                  name="month"
                  type="month"
                  defaultValue={editingBill?.month || currentMonth}
                  required
                  disabled={isSubmittingGenerateBill || !!editingBill}
                />
              </label>
              <label>
                <span>เลขมิเตอร์น้ำ</span>
                <input
                  name="waterUnits"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={editingBill?.waterUnits ?? ""}
                  required
                  disabled={isSubmittingGenerateBill}
                />
              </label>
              <label>
                <span>เลขมิเตอร์ไฟ</span>
                <input
                  name="electricityUnits"
                  type="number"
                  min="0"
                  step="1"
                  defaultValue={editingBill?.electricityUnits ?? ""}
                  required
                  disabled={isSubmittingGenerateBill}
                />
              </label>
              <label className="full-span">
                <span>ครบกำหนดชำระ</span>
                <input
                  name="dueDate"
                  type="date"
                  defaultValue={
                    editingBill
                      ? toDateInput(editingBill.dueDate)
                      : toDateInput(addDays(today, 7))
                  }
                  required
                  disabled={isSubmittingGenerateBill}
                />
              </label>
              <button
                className="primary-button full-span"
                type="submit"
                disabled={isSubmittingGenerateBill}
              >
                {isSubmittingGenerateBill
                  ? "กำลังบันทึก..."
                  : editingBill
                    ? "บันทึกการแก้ไขบิล"
                    : "ออกบิลและส่งให้ผู้เช่า"}
              </button>
            </form>
          ) : (
            <EmptyState
              title="ยังไม่มีห้องที่มีผู้พัก"
              description="เพิ่มผู้เช่าและผูกกับห้องก่อนออกบิล"
            />
          )}
          <div className="helper-note">
            ระบบจะดึงค่าเช่าพื้นฐานจากข้อมูลห้อง
            และคำนวณค่าน้ำ/ค่าไฟตามอัตราที่กำหนดไว้ในระบบ
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Billing Summary</span>
              <h2>สถานะบิลของเดือนนี้</h2>
            </div>
          </div>
          <div className="list-item">
            <div>
              <strong>ชำระแล้ว</strong>
              <p>บิลที่ถูกยืนยันการชำระเรียบร้อย</p>
            </div>
            <div className="list-item-meta">
              <StatusBadge status="paid" />
              <strong>
                {
                  state.bills.filter(
                    (bill) =>
                      bill.month === currentMonth && bill.status === "paid",
                  ).length
                }
              </strong>
            </div>
          </div>
          <div className="list-item">
            <div>
              <strong>รอตรวจสอบสลิป</strong>
              <p>ผู้เช่าส่งหลักฐานการชำระเงินเข้ามาแล้ว</p>
            </div>
            <div className="list-item-meta">
              <StatusBadge status="submitted" />
              <strong>
                {
                  state.bills.filter(
                    (bill) =>
                      bill.month === currentMonth &&
                      bill.status === "submitted",
                  ).length
                }
              </strong>
            </div>
          </div>
          <div className="list-item">
            <div>
              <strong>ยังไม่ชำระ</strong>
              <p>รวมบิลที่ยังต้องติดตาม</p>
            </div>
            <div className="list-item-meta">
              <StatusBadge status="pending" />
              <strong>
                {
                  state.bills.filter(
                    (bill) =>
                      bill.month === currentMonth && bill.status === "pending",
                  ).length
                }
              </strong>
            </div>
          </div>
        </article>
      </section>
      <div
        className="panel"
        style={{ marginBottom: "24px", padding: "16px 24px" }}
      >
        <div className="panel-heading" style={{ marginBottom: "16px" }}>
          <div>
            <span className="section-kicker">Filter</span>
            <h2>ตัวกรองบิล</h2>
          </div>
        </div>
        <div
          className="form-grid"
          style={{ gridTemplateColumns: "1fr 1fr", gap: "16px" }}
        >
          <label>
            <span>สถานะบิล</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">ทั้งหมด (All)</option>
              <option value="pending">ยังไม่ชำระ (Pending)</option>
              <option value="submitted">รอตรวจสอบสลิป (Submitted)</option>
              <option value="paid">ชำระแล้ว (Paid)</option>
            </select>
          </label>
          <label>
            <span>รอบเดือน</span>
            <select
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
            >
              <option value="all">ทั้งหมด (All Months)</option>
              {uniqueMonths.map((m) => (
                <option key={m} value={m}>
                  {formatMonthLabel(m)}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <section className="stack-list">
        {bills.length ? (
          bills.map((bill) => (
            <article className="panel bill-card" key={bill.id}>
              <div className="panel-heading wrap-mobile">
                <div>
                  <span className="section-kicker">
                    {formatMonthLabel(bill.month)}
                  </span>
                  <h2>
                    {getRoomName(bill.roomId)} · {getUserName(bill.tenantId)}
                  </h2>
                </div>
                <div className="badge-cluster">
                  <StatusBadge status={bill.status} />
                  <strong>{formatCurrency(getBillTotal(bill))}</strong>
                </div>
              </div>
              <div className="content-grid two-columns tight-gap align-start">
                <div className="detail-card subtle-card">
                  <div className="detail-row">
                    <span>ค่าเช่าพื้นฐาน</span>
                    <strong>{formatCurrency(bill.baseRent)}</strong>
                  </div>
                  <div className="detail-row">
                    <span>ค่าน้ำ ({bill.waterUnits} หน่วย)</span>
                    <strong>
                      {formatCurrency(bill.waterUnits * WATER_RATE)}
                    </strong>
                  </div>
                  <div className="detail-row">
                    <span>ค่าไฟ ({bill.electricityUnits} หน่วย)</span>
                    <strong>
                      {formatCurrency(bill.electricityUnits * ELECTRIC_RATE)}
                    </strong>
                  </div>
                  <div className="detail-row emphasis">
                    <span>รวมสุทธิ</span>
                    <strong>{formatCurrency(getBillTotal(bill))}</strong>
                  </div>
                  <div className="detail-row">
                    <span>ครบกำหนด</span>
                    <strong>{formatDate(bill.dueDate)}</strong>
                  </div>
                </div>
                <div className="detail-card subtle-card">
                  <div className="detail-row">
                    <span>QR Reference</span>
                    <strong>{bill.qrReference}</strong>
                  </div>
                  {bill.slipImage ? (
                    <div className="image-preview">
                      <img src={bill.slipImage} alt="Slip preview" />
                    </div>
                  ) : (
                    <div className="helper-note">ยังไม่มีสลิปจากผู้เช่า</div>
                  )}
                </div>
              </div>
              <div
                className="room-actions-row"
                style={{
                  marginTop: "16px",
                  marginBottom: "8px",
                  borderTop: "1px solid var(--line)",
                  paddingTop: "16px",
                }}
              >
                <button
                  className="ghost-button compact"
                  type="button"
                  onClick={() => onEditBill(bill.id)}
                  disabled={
                    updatingBillId === bill.id || deletingBillId === bill.id
                  }
                >
                  Edit
                </button>
                <button
                  className="ghost-button compact danger-text"
                  type="button"
                  onClick={() => onDeleteBill(bill.id)}
                  disabled={
                    updatingBillId === bill.id || deletingBillId === bill.id
                  }
                >
                  {deletingBillId === bill.id ? "กำลังลบ..." : "Delete"}
                </button>
              </div>
              <form
                className="inline-form two-column-inline"
                onSubmit={(event) => onSubmitBillStatus(event, bill.id)}
              >
                <label>
                  <span>สถานะบิล</span>
                  <select
                    name="status"
                    defaultValue={bill.status}
                    disabled={updatingBillId === bill.id}
                  >
                    <option value="pending">รอชำระ</option>
                    <option value="submitted">รอตรวจสอบ</option>
                    <option value="paid">ชำระแล้ว</option>
                    <option value="overdue">เกินกำหนด</option>
                  </select>
                </label>
                <button
                  className="secondary-button compact"
                  type="submit"
                  disabled={updatingBillId === bill.id}
                >
                  {updatingBillId === bill.id
                    ? "กำลังบันทึก..."
                    : "บันทึกสถานะ"}
                </button>
              </form>
            </article>
          ))
        ) : (
          <EmptyState
            title="ยังไม่มีบิล"
            description="ออกบิลรายการแรกของระบบได้จากฟอร์มด้านบน"
          />
        )}
      </section>
    </>
  );
}

type AdminMaintenanceViewProps = {
  requests: MaintenanceRequest[];
  getRoomName: (roomId: string) => string;
  getUserName: (userId: string) => string;
  updatingRequestId: string;
  onSubmit: (
    event: FormEvent<HTMLFormElement>,
    requestId: string,
  ) => void | Promise<void>;
};

const inputClass =
  "w-full rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20 disabled:opacity-60";

const labelClass = "flex flex-col gap-1.5 text-sm font-medium text-foreground";

export function AdminMaintenanceView({
  requests,
  getRoomName,
  getUserName,
  updatingRequestId,
  onSubmit,
}: AdminMaintenanceViewProps) {
  const sortedRequests = [...requests].sort(sortByCreatedDescending);
  const openCount = sortedRequests.filter((r) => r.status === "open").length;
  const progressCount = sortedRequests.filter(
    (r) => r.status === "in_progress",
  ).length;
  const resolvedCount = sortedRequests.filter(
    (r) => r.status === "resolved",
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 rounded-full bg-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            จัดการงานซ่อม
          </h1>
        </div>
        <p className="text-muted-foreground ml-3">
          รับเรื่อง มอบหมายช่าง และปิดงานพร้อมรูปยืนยัน
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-3">
        <DashCard
          label="รอดำเนินการ"
          value={String(openCount)}
          description="คำร้องใหม่ที่ยังไม่รับเรื่อง"
          icon={Wrench}
          variant={openCount > 0 ? "warning" : "default"}
        />
        <DashCard
          label="กำลังดำเนินการ"
          value={String(progressCount)}
          description="คำร้องที่กำลังอยู่ระหว่างซ่อม"
          icon={Activity}
          variant="primary"
        />
        <DashCard
          label="ปิดงานแล้ว"
          value={String(resolvedCount)}
          description="คำร้องที่ส่งมอบและปิดงานเรียบร้อย"
          icon={ClipboardList}
        />
      </section>

      <section className="space-y-4">
        {sortedRequests.length ? (
          sortedRequests.map((request) => (
            <article
              key={request.id}
              className="rounded-2xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
                <div className="min-w-0">
                  <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                    {request.category}
                  </span>
                  <h2 className="text-lg font-bold text-foreground mt-0.5">
                    {request.title}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {getUserName(request.tenantId)} · ห้อง{" "}
                    {getRoomName(request.roomId)}
                  </p>
                </div>
                <StatusBadge status={request.status} />
              </div>

              <p className="text-sm text-foreground leading-relaxed mb-5 whitespace-pre-wrap">
                {request.description}
              </p>

              <div className="grid gap-4 md:grid-cols-2 mb-5 items-start">
                <div className="rounded-xl bg-muted/40 p-4 space-y-2.5">
                  {[
                    ["วันที่แจ้ง", formatDate(request.createdAt, true)],
                    ["อัปเดตล่าสุด", formatDate(request.updatedAt, true)],
                    ["ผู้รับผิดชอบ", request.assignee || "ยังไม่มอบหมาย"],
                    ["หมายเหตุ", request.adminNote || "ยังไม่มีหมายเหตุ"],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <span className="text-muted-foreground">{label}</span>
                      <strong className="text-foreground text-right">
                        {value}
                      </strong>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl bg-muted/40 p-4 space-y-3">
                  {request.residentImage ? (
                    <div className="overflow-hidden rounded-lg">
                      <img
                        src={request.residentImage}
                        alt="Resident upload"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-6 text-xs text-muted-foreground">
                      ไม่มีรูปจากผู้เช่า
                    </div>
                  )}
                  {request.completionImage ? (
                    <div className="overflow-hidden rounded-lg">
                      <img
                        src={request.completionImage}
                        alt="Completion upload"
                        className="w-full h-auto object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center rounded-lg border border-dashed border-border py-6 text-xs text-muted-foreground">
                      ยังไม่มีรูปยืนยันหลังซ่อม
                    </div>
                  )}
                </div>
              </div>

              <form
                className="grid gap-4 sm:grid-cols-2 pt-5 border-t border-border/50"
                onSubmit={(event) => void onSubmit(event, request.id)}
              >
                <label className={labelClass}>
                  <span>สถานะ</span>
                  <select
                    name="status"
                    defaultValue={request.status}
                    disabled={updatingRequestId === request.id}
                    className={inputClass}
                  >
                    <option value="open">รอดำเนินการ</option>
                    <option value="in_progress">กำลังดำเนินการ</option>
                    <option value="resolved">เสร็จสิ้น</option>
                    <option value="cancelled">ยกเลิก</option>
                  </select>
                </label>
                <label className={labelClass}>
                  <span>มอบหมายให้</span>
                  <input
                    name="assignee"
                    type="text"
                    defaultValue={request.assignee}
                    placeholder="ชื่อผู้รับผิดชอบ"
                    disabled={updatingRequestId === request.id}
                    className={inputClass}
                  />
                </label>
                <label className={cn(labelClass, "sm:col-span-2")}>
                  <span>หมายเหตุจากผู้ดูแลอาคาร</span>
                  <textarea
                    name="adminNote"
                    rows={3}
                    defaultValue={request.adminNote}
                    placeholder="เช่น นัดเข้าซ่อมเวลา 15:00 น."
                    disabled={updatingRequestId === request.id}
                    className={cn(inputClass, "resize-none")}
                  />
                </label>
                <label className={cn(labelClass, "sm:col-span-2")}>
                  <span>
                    รูปยืนยันหลังซ่อม (ไฟล์รูปภาพเท่านั้น · ไม่รองรับ PDF)
                  </span>
                  <input
                    name="completionImage"
                    type="file"
                    accept="image/*"
                    disabled={updatingRequestId === request.id}
                    className={cn(
                      inputClass,
                      "file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-primary",
                    )}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file && !file.type.startsWith("image/")) {
                        alert(
                          "ไม่สามารถอัพโหลดแบบไฟล์ PDF ได้ กรุณาใช้ไฟล์รูปภาพเท่านั้น",
                        );
                        e.target.value = "";
                      }
                    }}
                  />
                </label>
                <button
                  type="submit"
                  disabled={updatingRequestId === request.id}
                  className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
                >
                  {updatingRequestId === request.id
                    ? "กำลังบันทึก..."
                    : "อัปเดตคำร้อง"}
                </button>
              </form>
            </article>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
              <Wrench className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              ยังไม่มีคำร้องแจ้งซ่อม
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              เมื่อผู้เช่าแจ้งซ่อม รายการจะปรากฏที่นี่
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

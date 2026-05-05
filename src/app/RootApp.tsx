import { type FormEvent, type ReactNode, useEffect, useState } from "react";
import { api, fetchAppState, getToken, setToken } from "./api";
import { AppShell } from "./components/AppShell";
import { AuthScreen } from "./components/AuthScreen";
import { FlashMessage } from "./components/ui";
import {
  currentMonth,
  ELECTRIC_RATE,
  formatCurrency,
  getAssignableRoomsForTenant,
  getBillsForTenant,
  getBillTotal,
  getLatestAnnouncements,
  getMaintenanceForTenant,
  getRoleLabel,
  getRoomById,
  getRoomDisplayStatus,
  getRoomName,
  getTenantOutstandingAmount,
  getTenantRoom,
  getTenantUsers,
  getUserById,
  getUserName,
  pageTitleMap,
  readImageFile,
  routeDefinitions,
  toDateInput,
  today,
  WATER_RATE,
} from "./core";
import type {
  AppRoute,
  AppState,
  BillStatus,
  FlashState,
  MaintenanceStatus,
  RoomStatus,
  User,
} from "./types";
import { useTheme } from "./useTheme";
import {
  AdminBillingView,
  AdminDashboardView,
  AdminMaintenanceView,
  AdminOccupancyView,
} from "./views/AdminViews";
import { AnnouncementsView } from "./views/AnnouncementsView";
import {
  TenantBillsView,
  TenantDashboardView,
  TenantMaintenanceView,
} from "./views/TenantViews";

function RootApp() {
  const { mode: themeMode, setMode: setThemeMode } = useTheme();
  const [state, setState] = useState<AppState>({
    users: [],
    rooms: [],
    announcements: [],
    bills: [],
    maintenanceRequests: [],
  });
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAppLoading, setIsAppLoading] = useState(false);

  const [route, setRoute] = useState<AppRoute>("dashboard");
  const [editingTenantId, setEditingTenantId] = useState("");
  const [editingRoomId, setEditingRoomId] = useState("");
  const [flash, setFlash] = useState<FlashState>(null);

  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isSubmittingTenantMaintenance, setIsSubmittingTenantMaintenance] =
    useState(false);
  const [payingBillId, setPayingBillId] = useState("");
  const [isSubmittingAnnouncement, setIsSubmittingAnnouncement] =
    useState(false);
  const [deletingAnnouncementId, setDeletingAnnouncementId] = useState("");
  const [isSubmittingTenant, setIsSubmittingTenant] = useState(false);
  const [deletingTenantId, setDeletingTenantId] = useState("");
  const [isSubmittingRoom, setIsSubmittingRoom] = useState(false);
  const [deletingRoomId, setDeletingRoomId] = useState("");
  const [isSubmittingGenerateBill, setIsSubmittingGenerateBill] =
    useState(false);
  const [updatingBillId, setUpdatingBillId] = useState("");
  const [editingBillId, setEditingBillId] = useState("");
  const [deletingBillId, setDeletingBillId] = useState("");
  const [updatingRequestId, setUpdatingRequestId] = useState("");
  const [editingRequestId, setEditingRequestId] = useState("");
  const [isSubmittingPassword, setIsSubmittingPassword] = useState(false);

  // Initial load
  useEffect(() => {
    async function init() {
      const token = getToken();
      if (!token) {
        setIsAppLoading(false);
        return;
      }
      try {
        const u = await api.auth.me();
        setCurrentUser(u);
        const data = await fetchAppState(u.role);
        setState(data);
      } catch {
        setToken("");
      } finally {
        setIsAppLoading(false);
      }
    }
    init();
  }, []);

  const refreshData = async () => {
    if (!currentUser || !getToken()) return;
    try {
      const data = await fetchAppState(currentUser.role);
      setState(data);
    } catch (e) {
      console.error("Failed to refresh data", e);
    }
  };

  // Realtime Polling (Every 5 seconds) — only if real token exists
  useEffect(() => {
    if (!currentUser || !getToken()) return;
    const interval = setInterval(() => {
      refreshData();
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser]);

  useEffect(() => {
    document.body.className = currentUser ? "app-mode" : "auth-mode";
    document.title = currentUser
      ? `Smart Dorm | ${pageTitleMap[currentUser.role][route].title}`
      : "Smart Dorm | Sign In";
  }, [currentUser, route]);

  useEffect(() => {
    if (!flash) return undefined;
    const timeout = window.setTimeout(() => setFlash(null), 3200);
    return () => window.clearTimeout(timeout);
  }, [flash]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  useEffect(() => {
    if (!currentUser) {
      setRoute("dashboard");
      return;
    }
    const allowedRoutes = routeDefinitions[currentUser.role].map(
      (item) => item.key,
    );
    if (!allowedRoutes.includes(route)) {
      setRoute(allowedRoutes[0]);
    }
  }, [currentUser, route]);

  const showFlash = (
    message: string,
    tone: "success" | "info" | "danger" = "info",
  ) => {
    setFlash({ message, tone });
  };
  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoggingIn(true);
    const formData = new FormData(event.currentTarget);
    const username = String(formData.get("username") || "").trim();
    const password = String(formData.get("password") || "").trim();

    try {
      const resp = await api.auth.login({ username, password });
      setToken(resp.token);
      setCurrentUser(resp.user);
      const data = await fetchAppState(resp.user.role);
      setState(data);
      setRoute(routeDefinitions[resp.user.role as "admin" | "tenant"][0].key);
      showFlash(
        `เข้าสู่ระบบในบทบาท${getRoleLabel(resp.user.role)}สำเร็จ`,
        "success",
      );
    } catch (error) {
      showFlash(
        error instanceof Error
          ? error.message
          : "ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง",
        "danger",
      );
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    if (!window.confirm("ต้องการออกจากระบบใช่หรือไม่?")) return;
    setToken("");
    setCurrentUser(null);
    setState({
      users: [],
      rooms: [],
      announcements: [],
      bills: [],
      maintenanceRequests: [],
    });
    setEditingRoomId("");
    setEditingTenantId("");
  };

  const handleTenantMaintenance = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!currentUser) return;
    const room = getRoomById(state, currentUser.roomId);
    if (!room) {
      showFlash(
        "บัญชีนี้ยังไม่ได้ผูกกับห้องพัก จึงยังไม่สามารถส่งคำร้องแจ้งซ่อมได้",
        "danger",
      );
      return;
    }
    setIsSubmittingTenantMaintenance(true);
    try {
      const formData = new FormData(event.currentTarget);
      const requestId = String(formData.get("requestId") || "");
      const title = String(formData.get("title") || "").trim();
      const category = String(formData.get("category") || "").trim();
      const description = String(formData.get("description") || "").trim();

      const residentImageFile =
        (
          event.currentTarget.elements.namedItem(
            "residentImage",
          ) as HTMLInputElement
        )?.files?.[0] || null;

      const residentImage = await readImageFile(residentImageFile);

      if (requestId) {
        // Edit mode
        const payload: any = { title, category, description };
        if (residentImage) {
          payload.residentImage = residentImage;
        }
        await api.maintenance.update(requestId, payload);
        showFlash("แก้ไขคำร้องแจ้งซ่อมเรียบร้อยแล้ว", "success");
        setEditingRequestId("");
      } else {
        // Create mode
        await api.maintenance.create({
          title,
          category,
          description,
          residentImage,
        });
        showFlash("ส่งคำร้องแจ้งซ่อมเรียบร้อยแล้ว", "success");
      }

      await refreshData();
      form.reset();
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        "danger",
      );
    } finally {
      setIsSubmittingTenantMaintenance(false);
    }
  };

  const handlePayBill = async (
    event: FormEvent<HTMLFormElement>,
    billId: string,
  ) => {
    event.preventDefault();
    setPayingBillId(billId);
    try {
      const fileInput = event.currentTarget.elements.namedItem(
        "slipImage",
      ) as HTMLInputElement;
      const slipImage = await readImageFile(fileInput.files?.[0] || null);
      if (!slipImage) {
        showFlash("กรุณาแนบสลิปการชำระเงิน", "danger");
        return;
      }

      await api.bills.update(billId, { status: "submitted", slipImage });
      await refreshData();
      showFlash("อัปโหลดหลักฐานการชำระเงินเรียบร้อย", "success");
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        "danger",
      );
    } finally {
      setPayingBillId("");
    }
  };

  const handleAnnouncement = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmittingAnnouncement(true);
    try {
      const formData = new FormData(event.currentTarget);
      const title = String(formData.get("title") || "").trim();
      const message = String(formData.get("message") || "").trim();
      if (!title || !message) {
        showFlash("กรุณากรอกหัวข้อและรายละเอียดประกาศให้ครบถ้วน", "danger");
        return;
      }

      await api.announcements.create({
        title,
        message,
        priority: String(formData.get("priority") || "low"),
      });
      await refreshData();
      form.reset();
      showFlash("เผยแพร่ประกาศเรียบร้อยแล้ว", "success");
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        "danger",
      );
    } finally {
      setIsSubmittingAnnouncement(false);
    }
  };

  const handleTenantUpsert = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmittingTenant(true);
    try {
      const formData = new FormData(event.currentTarget);
      const tenantId = String(formData.get("tenantId") || "");
      const fullName = String(formData.get("fullName") || "").trim();
      const phone = String(formData.get("phone") || "").trim();
      const roomId = String(formData.get("roomId") || "").trim();
      const password = String(formData.get("password") || "").trim();

      if (!roomId) {
        throw new Error(
          "กรุณากำหนดห้องพักให้ผู้เช่า (ต้องมีห้องจึงจะเข้าใช้งานได้)",
        );
      }
      const targetRoom = getRoomById(state, roomId);
      if (!targetRoom) {
        throw new Error("ไม่พบข้อมูลห้องพักที่เลือก");
      }
      const username = targetRoom.number; // Use room block/number as username

      if (tenantId) {
        const payload: any = { fullName, phone, roomId };
        if (password) payload.password = password;
        await api.users.update(tenantId, payload);
        showFlash("อัปเดตข้อมูลผู้เช่าเรียบร้อย", "success");
      } else {
        await api.users.create({
          username,
          password: password || "tenant123",
          fullName,
          phone,
          role: "tenant",
          roomId,
        });
        showFlash("เพิ่มผู้เช่าใหม่เรียบร้อย", "success");
      }

      setEditingTenantId("");
      await refreshData();
      form.reset();
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        "danger",
      );
    } finally {
      setIsSubmittingTenant(false);
    }
  };

  const handleTenantChangePassword = async (
    event: FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();
    const form = event.currentTarget;
    if (!currentUser) return;
    setIsSubmittingPassword(true);
    try {
      const formData = new FormData(event.currentTarget);
      const currentPassword = String(
        formData.get("currentPassword") || "",
      ).trim();
      const newPassword = String(formData.get("newPassword") || "").trim();
      const confirmPassword = String(
        formData.get("confirmPassword") || "",
      ).trim();

      if (!currentPassword || !newPassword) {
        throw new Error("กรุณากรอกข้อมูลให้ครบทุกช่อง");
      }
      if (newPassword !== confirmPassword) {
        throw new Error("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      }
      if (newPassword.length < 6) {
        throw new Error("รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร");
      }

      await api.auth.changePassword({ currentPassword, newPassword });
      showFlash("เปลี่ยนรหัสผ่านเรียบร้อยแล้ว", "success");
      form.reset();
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        "danger",
      );
    } finally {
      setIsSubmittingPassword(false);
    }
  };

  const handleRoomUpsert = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmittingRoom(true);
    try {
      const formData = new FormData(event.currentTarget);
      const roomId = String(formData.get("roomId") || "");
      const number = String(formData.get("number") || "").trim();
      const type = String(formData.get("type") || "").trim();
      const status = String(
        formData.get("status") || "available",
      ) as RoomStatus;
      const baseRent = Number(formData.get("baseRent") || 0);

      if (roomId) {
        await api.rooms.update(roomId, { number, type, status, baseRent });
        showFlash("อัปเดตข้อมูลห้องพักเรียบร้อย", "success");
      } else {
        await api.rooms.create({ number, type, status, baseRent });
        showFlash("เพิ่มห้องพักเรียบร้อย", "success");
      }

      setEditingRoomId("");
      await refreshData();
      form.reset();
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        "danger",
      );
    } finally {
      setIsSubmittingRoom(false);
    }
  };

  const handleGenerateBill = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSubmittingGenerateBill(true);
    const formData = new FormData(event.currentTarget);
    const billId = String(formData.get("billId") || "");
    const roomId = String(formData.get("roomId") || "");
    const month = String(formData.get("month") || currentMonth);
    const waterUnits = Number(formData.get("waterUnits") || 0);
    const electricityUnits = Number(formData.get("electricityUnits") || 0);
    const dueDate = String(formData.get("dueDate") || toDateInput(today));

    try {
      if (billId) {
        // Update mode
        const existing = state.bills.find((b) => b.id === billId);
        if (!existing) throw new Error("ไม่พบบิลที่ต้องการแก้ไข");

        const baseRent = existing.baseRent;
        const total =
          baseRent + waterUnits * WATER_RATE + electricityUnits * ELECTRIC_RATE;

        await api.bills.update(billId, {
          waterUnits,
          electricityUnits,
          dueDate,
          total,
        });
        showFlash("อัปเดตข้อมูลบิลเรียบร้อย", "success");
        setEditingBillId("");
      } else {
        // Create mode
        const room = getRoomById(state, roomId);
        if (!room || !room.tenantId)
          throw new Error("กรุณาเลือกห้องที่มีผู้เช่าอยู่");

        await api.bills.create({
          roomId,
          tenantId: room.tenantId,
          month,
          baseRent: room.baseRent,
          waterUnits,
          electricityUnits,
          dueDate,
          qrReference: `SDM-${room.number}-${month.replace("-", "")}`,
        });
        showFlash("ออกบิลและส่งให้ผู้เช่าเรียบร้อย", "success");
      }

      await refreshData();
      form.reset();
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        "danger",
      );
    } finally {
      setIsSubmittingGenerateBill(false);
    }
  };

  const handleBillDelete = async (billId: string) => {
    if (
      !window.confirm(
        "คุณต้องการลบบิลนี้ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้",
      )
    )
      return;
    setDeletingBillId(billId);
    try {
      await api.bills.delete(billId);
      showFlash("ลบบิลเรียบร้อยแล้ว", "success");
      await refreshData();
    } catch (error) {
      showFlash("ไม่สามารถลบบิลได้ กรุณาลองใหม่", "danger");
    } finally {
      setDeletingBillId("");
    }
  };

  const handleAdminBillStatus = async (
    event: FormEvent<HTMLFormElement>,
    billId: string,
  ) => {
    event.preventDefault();
    setUpdatingBillId(billId);
    try {
      const nextStatus = String(
        new FormData(event.currentTarget).get("status") || "pending",
      ) as BillStatus;
      await api.bills.update(billId, { status: nextStatus });
      await refreshData();
      showFlash("อัปเดตสถานะบิลเรียบร้อย", "success");
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        "danger",
      );
    } finally {
      setUpdatingBillId("");
    }
  };

  const handleMaintenanceUpdate = async (
    event: FormEvent<HTMLFormElement>,
    requestId: string,
  ) => {
    event.preventDefault();
    setUpdatingRequestId(requestId);
    try {
      const formData = new FormData(event.currentTarget);
      const completionImage = await readImageFile(
        (
          event.currentTarget.elements.namedItem(
            "completionImage",
          ) as HTMLInputElement
        )?.files?.[0] || null,
      );
      const status = String(formData.get("status")) as MaintenanceStatus;
      const assignee = String(formData.get("assignee") || "").trim();
      const adminNote = String(formData.get("adminNote") || "").trim();

      await api.maintenance.update(requestId, {
        status,
        assignee,
        adminNote,
        ...(completionImage ? { completionImage } : {}),
      });

      await refreshData();
      showFlash("อัปเดตคำร้องแจ้งซ่อมเรียบร้อย", "success");
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        "danger",
      );
    } finally {
      setUpdatingRequestId("");
    }
  };

  const deleteAnnouncement = async (announcementId: string) => {
    if (!window.confirm("ต้องการลบประกาศนี้ใช่หรือไม่?")) return;
    setDeletingAnnouncementId(announcementId);
    try {
      await api.announcements.delete(announcementId);
      await refreshData();
      showFlash("ลบประกาศเรียบร้อย", "success");
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
        "danger",
      );
    } finally {
      setDeletingAnnouncementId("");
    }
  };

  const deleteTenant = async (tenantId: string) => {
    if (!window.confirm("ต้องการลบข้อมูลผู้เช่ารายการนี้ใช่หรือไม่?")) return;
    setDeletingTenantId(tenantId);
    try {
      await api.users.delete(tenantId);
      await refreshData();
      showFlash("ลบข้อมูลผู้เช่าเรียบร้อย", "success");
      setEditingTenantId("");
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : "ไม่สามารถลบผู้เช่าได้",
        "danger",
      );
    } finally {
      setDeletingTenantId("");
    }
  };

  const deleteRoom = async (roomId: string) => {
    if (!window.confirm("ต้องการลบห้องพักรายการนี้ใช่หรือไม่?")) return;
    setDeletingRoomId(roomId);
    try {
      await api.rooms.delete(roomId);
      await refreshData();
      showFlash("ลบข้อมูลห้องพักเรียบร้อย", "success");
      setEditingRoomId("");
    } catch (error) {
      showFlash(
        error instanceof Error ? error.message : "ไม่สามารถลบห้องได้",
        "danger",
      );
    } finally {
      setDeletingRoomId("");
    }
  };

  if (isAppLoading) {
    return (
      <div
        style={{
          display: "flex",
          height: "100vh",
          alignItems: "center",
          justifyContent: "center",
          color: "#6366f1",
        }}
      >
        Loading Smart Dorm...
      </div>
    );
  }

  const flashNode = <FlashMessage flash={flash} />;

  if (!currentUser) {
    return (
      <AuthScreen
        flash={flashNode}
        onLogin={handleLogin}
        isSubmitting={isLoggingIn}
        themeMode={themeMode}
        onSetTheme={setThemeMode}
      />
    );
  }

  const allowedRoutes = routeDefinitions[currentUser.role];
  const latestAnnouncements = getLatestAnnouncements(state, 50);
  const currentRoom = getTenantRoom(state, currentUser);
  const tenantBills = getBillsForTenant(state, currentUser.id);
  const tenantRequests = getMaintenanceForTenant(state, currentUser.id);
  const overviewCards =
    currentUser.role === "tenant"
      ? [
          {
            label: "ยอดค้างชำระปัจจุบัน",
            value: formatCurrency(
              getTenantOutstandingAmount(state, currentUser.id),
            ),
            description: "รวมบิลที่ยังไม่ถูกปิดสถานะทั้งหมด",
          },
          {
            label: "ห้องพัก",
            value: currentRoom?.number || "ยังไม่ผูกห้อง",
            description: currentRoom
              ? `${currentRoom.type} | ค่าเช่าพื้นฐาน ${formatCurrency(currentRoom.baseRent)}`
              : "สามารถกำหนดผ่านฝั่งผู้ดูแลอาคารได้",
          },
          {
            label: "คำร้องที่ยังไม่เสร็จ",
            value: String(
              tenantRequests.filter((request) => request.status !== "resolved")
                .length,
            ),
            description: "ติดตามสถานะงานซ่อมได้จากหน้าแจ้งซ่อม",
          },
          {
            label: "ประวัติบิลทั้งหมด",
            value: String(tenantBills.length),
            description: "รองรับการดูย้อนหลังและอัปโหลดสลิปการโอนเงิน",
          },
        ]
      : [
          {
            label: "รายรับเดือนปัจจุบัน",
            value: formatCurrency(
              state.bills
                .filter(
                  (bill) =>
                    bill.month === currentMonth && bill.status === "paid",
                )
                .reduce((sum, bill) => sum + getBillTotal(bill), 0),
            ),
            description: "คำนวณจากบิลที่ชำระแล้วในเดือนนี้",
          },
          {
            label: "บิลที่ยังไม่ปิด",
            value: String(
              state.bills.filter(
                (bill) => bill.month === currentMonth && bill.status !== "paid",
              ).length,
            ),
            description: "รวมบิลรอชำระ รอตรวจสอบ และเกินกำหนด",
          },
          {
            label: "ห้องที่มีผู้พัก",
            value: `${state.rooms.filter((room) => room.tenantId).length}/${state.rooms.length}`,
            description: "ภาพรวมอัตราการเข้าพักในหอพัก",
          },
          {
            label: "งานซ่อมที่ยังค้าง",
            value: String(
              state.maintenanceRequests.filter(
                (request) => request.status !== "resolved",
              ).length,
            ),
            description: "ช่วยติดตาม SLA ของทีมช่างและผู้ดูแลอาคาร",
          },
        ];

  let content: ReactNode = null;
  if (currentUser.role === "tenant") {
    if (route === "dashboard") {
      content = (
        <TenantDashboardView
          room={currentRoom}
          bills={tenantBills}
          requests={tenantRequests}
          latestAnnouncement={getLatestAnnouncements(state, 1)[0] || null}
          getRoomName={(roomId) => getRoomName(state, roomId)}
          onNavigateBills={() => setRoute("bills")}
          onNavigateMaintenance={() => setRoute("maintenance")}
          onNavigateAnnouncements={() => setRoute("announcements")}
          isSubmittingPassword={isSubmittingPassword}
          onChangePassword={handleTenantChangePassword}
          onEditRequest={(id) => {
            setEditingRequestId(id);
            setRoute("maintenance");
            scrollToTop();
          }}
        />
      );
    } else if (route === "bills") {
      content = (
        <TenantBillsView
          bills={tenantBills}
          getRoomName={(roomId) => getRoomName(state, roomId)}
          payingBillId={payingBillId}
          onPayBill={handlePayBill}
        />
      );
    } else if (route === "maintenance") {
      content = (
        <TenantMaintenanceView
          room={currentRoom}
          requests={tenantRequests}
          isSubmitting={isSubmittingTenantMaintenance}
          editingRequestId={editingRequestId}
          onSubmit={handleTenantMaintenance}
          onEditRequest={(id) => {
            setEditingRequestId(id);
            scrollToTop();
          }}
          onClearRequestForm={() => setEditingRequestId("")}
        />
      );
    } else {
      content = (
        <AnnouncementsView
          adminTools={false}
          announcements={latestAnnouncements}
          deletingAnnouncementId={deletingAnnouncementId}
          isSubmitting={isSubmittingAnnouncement}
          onSubmit={handleAnnouncement}
          onDelete={deleteAnnouncement}
        />
      );
    }
  } else if (route === "dashboard") {
    content = (
      <AdminDashboardView
        state={state}
        onNavigateBilling={() => setRoute("billing")}
        onNavigateMaintenance={() => setRoute("maintenance")}
        onNavigateAnnouncements={() => setRoute("announcements")}
      />
    );
  } else if (route === "occupancy") {
    content = (
      <AdminOccupancyView
        rooms={[...state.rooms].sort((left, right) =>
          left.number.localeCompare(right.number),
        )}
        tenants={getTenantUsers(state).sort((left, right) =>
          left.fullName.localeCompare(right.fullName, "th"),
        )}
        editingRoom={editingRoomId ? getRoomById(state, editingRoomId) : null}
        editingTenant={
          editingTenantId ? getUserById(state, editingTenantId) : null
        }
        deletingRoomId={deletingRoomId}
        deletingTenantId={deletingTenantId}
        getAssignableRoomsForTenant={(tenantId) =>
          getAssignableRoomsForTenant(state, tenantId)
        }
        getRoomName={(roomId) => getRoomName(state, roomId)}
        getRoomDisplayStatus={getRoomDisplayStatus}
        getUserName={(userId) => getUserName(state, userId)}
        isSubmittingRoom={isSubmittingRoom}
        isSubmittingTenant={isSubmittingTenant}
        onSubmitTenant={handleTenantUpsert}
        onSubmitRoom={handleRoomUpsert}
        onEditTenant={(id) => {
          setEditingTenantId(id);
          scrollToTop();
        }}
        onDeleteTenant={deleteTenant}
        onEditRoom={(id) => {
          setEditingRoomId(id);
          scrollToTop();
        }}
        onDeleteRoom={deleteRoom}
        onClearTenantForm={() => setEditingTenantId("")}
        onClearRoomForm={() => setEditingRoomId("")}
      />
    );
  } else if (route === "billing") {
    content = (
      <AdminBillingView
        state={state}
        getUserName={(userId) => getUserName(state, userId)}
        getRoomName={(roomId) => getRoomName(state, roomId)}
        isSubmittingGenerateBill={isSubmittingGenerateBill}
        updatingBillId={updatingBillId}
        editingBillId={editingBillId}
        deletingBillId={deletingBillId}
        onSubmitGenerateBill={handleGenerateBill}
        onSubmitBillStatus={handleAdminBillStatus}
        onEditBill={(id) => {
          setEditingBillId(id);
          scrollToTop();
        }}
        onDeleteBill={handleBillDelete}
        onClearBillForm={() => setEditingBillId("")}
      />
    );
  } else if (route === "maintenance") {
    content = (
      <AdminMaintenanceView
        requests={state.maintenanceRequests}
        getRoomName={(roomId) => getRoomName(state, roomId)}
        getUserName={(userId) => getUserName(state, userId)}
        updatingRequestId={updatingRequestId}
        onSubmit={handleMaintenanceUpdate}
      />
    );
  } else {
    content = (
      <AnnouncementsView
        adminTools
        announcements={latestAnnouncements}
        deletingAnnouncementId={deletingAnnouncementId}
        isSubmitting={isSubmittingAnnouncement}
        onSubmit={handleAnnouncement}
        onDelete={deleteAnnouncement}
      />
    );
  }

  return (
    <AppShell
      currentUser={currentUser}
      route={route}
      allowedRoutes={allowedRoutes}
      pageMeta={pageTitleMap[currentUser.role][route]}
      overviewCards={overviewCards}
      flash={flashNode}
      themeMode={themeMode}
      onNavigate={setRoute}
      onLogout={handleLogout}
      onSetTheme={setThemeMode}
    >
      {content}
    </AppShell>
  );
}

export default RootApp;

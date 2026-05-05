import type { FormEvent } from "react";
import {
  EmptyState,
  PasswordInput,
  QrPayment,
  StatusBadge,
  SummaryCard,
} from "../components/ui";
import {
  ELECTRIC_RATE,
  WATER_RATE,
  formatCurrency,
  formatDate,
  formatMonthLabel,
  getBillTotal,
} from "../core";
import type { Bill, MaintenanceRequest, Room } from "../types";

type TenantDashboardViewProps = {
  room: Room | null;
  bills: Bill[];
  requests: MaintenanceRequest[];
  latestAnnouncement: {
    title: string;
    message: string;
    priority: string;
    createdAt: string;
  } | null;
  getRoomName: (roomId: string) => string;
  onNavigateBills: () => void;
  onNavigateMaintenance: () => void;
  onNavigateAnnouncements: () => void;
  isSubmittingPassword?: boolean;
  onChangePassword?: (event: FormEvent<HTMLFormElement>) => void;
  onEditRequest?: (requestId: string) => void;
};

export function TenantDashboardView({
  room,
  bills,
  requests,
  latestAnnouncement,
  getRoomName,
  onNavigateBills,
  onNavigateMaintenance,
  onNavigateAnnouncements,
  isSubmittingPassword,
  onChangePassword,
  onEditRequest,
}: TenantDashboardViewProps) {
  const currentBill =
    bills.find((bill) => bill.status !== "paid") || bills[0] || null;

  return (
    <>
      <section className="content-grid two-columns">
        <article className="panel highlight-panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Current Snapshot</span>
              <h2>สถานะบัญชีและห้องพักของคุณ</h2>
            </div>
            {currentBill ? <StatusBadge status={currentBill.status} /> : null}
          </div>
          <div className="detail-stack">
            <div className="detail-row">
              <span>ห้องพัก</span>
              <strong>{room?.number || "ยังไม่ระบุ"}</strong>
            </div>
            <div className="detail-row">
              <span>ประเภทห้อง</span>
              <strong>{room?.type || "-"}</strong>
            </div>
            <div className="detail-row">
              <span>ยอดล่าสุด</span>
              <strong>
                {currentBill
                  ? formatCurrency(getBillTotal(currentBill))
                  : "ไม่มีบิลค้างชำระ"}
              </strong>
            </div>
            <div className="detail-row">
              <span>ครบกำหนด</span>
              <strong>
                {currentBill ? formatDate(currentBill.dueDate) : "-"}
              </strong>
            </div>
          </div>
          <div className="action-row">
            <button
              className="primary-button compact"
              type="button"
              onClick={onNavigateBills}
            >
              ดูบิลทั้งหมด
            </button>
            <button
              className="secondary-button compact"
              type="button"
              onClick={onNavigateMaintenance}
            >
              แจ้งซ่อม
            </button>
          </div>
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Latest News</span>
              <h2>ประกาศล่าสุด</h2>
            </div>
            <button
              className="ghost-button compact"
              type="button"
              onClick={onNavigateAnnouncements}
            >
              ดูทั้งหมด
            </button>
          </div>
          {latestAnnouncement ? (
            <div className="announcement-card notice-card">
              <div className="announcement-top">
                <StatusBadge status={latestAnnouncement.priority} />
                <small>{formatDate(latestAnnouncement.createdAt, true)}</small>
              </div>
              <h3>{latestAnnouncement.title}</h3>
              <p>{latestAnnouncement.message}</p>
            </div>
          ) : (
            <EmptyState
              title="ยังไม่มีประกาศ"
              description="เมื่อมีประกาศใหม่ คุณจะเห็นรายการล่าสุดที่นี่"
            />
          )}
        </article>
      </section>

      <section className="content-grid two-columns">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Security</span>
              <h2>เปลี่ยนรหัสผ่าน</h2>
            </div>
          </div>
          <form className="form-grid" onSubmit={onChangePassword}>
            <label className="full-span">
              <span>รหัสผ่านปัจจุบัน</span>
              <PasswordInput
                name="currentPassword"
                placeholder="กรอกรหัสผ่านปัจจุบัน"
                required
                disabled={isSubmittingPassword}
              />
            </label>
            <label>
              <span>รหัสผ่านใหม่</span>
              <PasswordInput
                name="newPassword"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                required
                disabled={isSubmittingPassword}
                minLength={6}
              />
            </label>
            <label>
              <span>ยืนยันรหัสผ่านใหม่</span>
              <PasswordInput
                name="confirmPassword"
                placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                required
                disabled={isSubmittingPassword}
                minLength={6}
              />
            </label>
            <button
              className="secondary-button compact full-span"
              type="submit"
              disabled={isSubmittingPassword}
            >
              {isSubmittingPassword ? "กำลังอัปเดต..." : "เปลี่ยนรหัสผ่าน"}
            </button>
          </form>
        </article>
      </section>

      <section className="content-grid two-columns">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Recent Bills</span>
              <h2>ประวัติบิลล่าสุด</h2>
            </div>
          </div>
          {bills.length ? (
            bills.slice(0, 3).map((bill) => (
              <div className="list-item" key={bill.id}>
                <div>
                  <strong>{formatMonthLabel(bill.month)}</strong>
                  <p>
                    {getRoomName(bill.roomId)} · ครบกำหนด{" "}
                    {formatDate(bill.dueDate)}
                  </p>
                </div>
                <div className="list-item-meta">
                  <StatusBadge status={bill.status} />
                  <strong>{formatCurrency(getBillTotal(bill))}</strong>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="ยังไม่มีบิล"
              description="เมื่อระบบออกบิลแล้วจะแสดงในส่วนนี้"
            />
          )}
        </article>

        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Maintenance</span>
              <h2>คำร้องที่อัปเดตล่าสุด</h2>
            </div>
          </div>
          {requests.length ? (
            requests.slice(0, 3).map((request) => (
              <div className="list-item align-start" key={request.id}>
                <div>
                  <strong>{request.title}</strong>
                  <p>{request.description}</p>
                  <small>
                    อัปเดตล่าสุด {formatDate(request.updatedAt, true)}
                  </small>
                </div>
                <div className="list-item-meta vertical-align">
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <StatusBadge status={request.status} />
                    {request.status !== "resolved" &&
                      request.status !== "cancelled" &&
                      onEditRequest && (
                        <button
                          type="button"
                          className="ghost-button compact"
                          onClick={() => onEditRequest(request.id)}
                        >
                          Edit
                        </button>
                      )}
                  </div>
                  <span>{request.assignee || "รอมอบหมายงาน"}</span>
                </div>
              </div>
            ))
          ) : (
            <EmptyState
              title="ยังไม่มีคำร้อง"
              description="คุณสามารถแจ้งซ่อมจากหน้าแจ้งซ่อมได้"
            />
          )}
        </article>
      </section>
    </>
  );
}

type TenantBillsViewProps = {
  bills: Bill[];
  getRoomName: (roomId: string) => string;
  payingBillId: string;
  onPayBill: (
    event: FormEvent<HTMLFormElement>,
    billId: string,
  ) => void | Promise<void>;
};

export function TenantBillsView({
  bills,
  getRoomName,
  payingBillId,
  onPayBill,
}: TenantBillsViewProps) {
  const paidTotal = bills
    .filter((bill) => bill.status === "paid")
    .reduce((sum, bill) => sum + getBillTotal(bill), 0);
  const currentDue = bills.find((bill) => bill.status !== "paid");

  return (
    <>
      <section className="content-grid three-columns">
        <SummaryCard
          label="ยอดที่ต้องชำระตอนนี้"
          value={
            currentDue
              ? formatCurrency(getBillTotal(currentDue))
              : formatCurrency(0)
          }
          description={
            currentDue
              ? `ครบกำหนด ${formatDate(currentDue.dueDate)}`
              : "ไม่มีบิลค้างชำระ"
          }
        />
        <SummaryCard
          label="บิลที่ยังไม่ปิด"
          value={String(bills.filter((bill) => bill.status !== "paid").length)}
          description="รวมบิลรอชำระและรอตรวจสอบ"
        />
        <SummaryCard
          label="ยอดที่ชำระแล้ว"
          value={formatCurrency(paidTotal)}
          description="รวมเฉพาะบิลที่ถูกยืนยันสถานะแล้ว"
        />
      </section>
      <section className="stack-list">
        {bills.length ? (
          bills.map((bill) => (
            <article className="panel bill-card" key={bill.id}>
              <div className="panel-heading wrap-mobile">
                <div>
                  <span className="section-kicker">
                    {formatMonthLabel(bill.month)}
                  </span>
                  <h2>{getRoomName(bill.roomId)}</h2>
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
                  <QrPayment reference={bill.qrReference} />
                </div>
              </div>
              {bill.status === "paid" ? (
                <div className="callout success">
                  <strong>ชำระเงินเรียบร้อยแล้ว</strong>
                  <span>ยืนยันเมื่อ {formatDate(bill.paidAt, true)}</span>
                </div>
              ) : bill.status === "submitted" ? (
                <div className="callout info">
                  <strong>ส่งหลักฐานการชำระเงินแล้ว</strong>
                  <span>ระบบกำลังรอผู้ดูแลอาคารตรวจสอบสลิปของคุณ</span>
                </div>
              ) : (
                <form
                  className="inline-form"
                  onSubmit={(event) => void onPayBill(event, bill.id)}
                >
                  <label>
                    <span>
                      แนบหลักฐานการชำระเงิน (ไฟล์รูปภาพเท่านั้น · ไม่รองรับ PDF)
                    </span>
                    <input
                      name="slipImage"
                      type="file"
                      accept="image/*"
                      required
                      disabled={payingBillId === bill.id}
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
                    className="primary-button compact"
                    type="submit"
                    disabled={payingBillId === bill.id}
                  >
                    {payingBillId === bill.id
                      ? "กำลังอัปโหลด..."
                      : "อัปโหลดสลิปและยืนยันการชำระ"}
                  </button>
                </form>
              )}
              {bill.slipImage ? (
                <div className="image-preview">
                  <img src={bill.slipImage} alt="Payment slip" />
                </div>
              ) : null}
            </article>
          ))
        ) : (
          <EmptyState
            title="ยังไม่มีบิล"
            description="ระบบยังไม่ออกบิลให้กับบัญชีนี้"
          />
        )}
      </section>
    </>
  );
}

type TenantMaintenanceViewProps = {
  room: Room | null;
  requests: MaintenanceRequest[];
  isSubmitting: boolean;
  editingRequestId?: string;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void | Promise<void>;
  onEditRequest?: (requestId: string) => void;
  onClearRequestForm?: () => void;
};

export function TenantMaintenanceView({
  room,
  requests,
  isSubmitting,
  editingRequestId,
  onSubmit,
  onEditRequest,
  onClearRequestForm,
}: TenantMaintenanceViewProps) {
  const editingRequest =
    requests.find((r) => r.id === editingRequestId) || null;

  return (
    <>
      <section className="content-grid three-columns">
        <SummaryCard
          label="รอดำเนินการ"
          value={String(
            requests.filter((request) => request.status === "open").length,
          )}
          description="คำร้องที่ส่งเข้าระบบแล้ว"
        />
        <SummaryCard
          label="กำลังดำเนินการ"
          value={String(
            requests.filter((request) => request.status === "in_progress")
              .length,
          )}
          description="คำร้องที่มีการรับเรื่องแล้ว"
        />
        <SummaryCard
          label="เสร็จสิ้น"
          value={String(
            requests.filter((request) => request.status === "resolved").length,
          )}
          description="ปิดงานเรียบร้อยแล้ว"
        />
      </section>
      <section className="content-grid two-columns align-start">
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">
                {editingRequest ? "Edit Request" : "Create Request"}
              </span>
              <h2>{editingRequest ? "แก้ไขคำร้องแจ้งซ่อม" : "แจ้งซ่อมใหม่"}</h2>
            </div>
            {editingRequest && (
              <button
                className="ghost-button compact"
                type="button"
                onClick={onClearRequestForm}
              >
                ยกเลิกแก้ไข
              </button>
            )}
          </div>
          {room ? (
            <div className="callout info">
              <strong>ห้องพักปัจจุบัน</strong>
              <span>
                {room.number} · {room.type}
              </span>
            </div>
          ) : null}
          <form
            key={editingRequest?.id || "new-request"}
            className="form-grid"
            onSubmit={(event) => void onSubmit(event)}
          >
            <input
              name="requestId"
              type="hidden"
              defaultValue={editingRequest?.id || ""}
            />
            <label>
              <span>หัวข้อปัญหา</span>
              <input
                name="title"
                type="text"
                placeholder="เช่น แอร์ไม่เย็น"
                defaultValue={editingRequest?.title || ""}
                required
                disabled={isSubmitting || !room}
              />
            </label>
            <label>
              <span>หมวดหมู่</span>
              <select
                name="category"
                defaultValue={editingRequest?.category || "ไฟฟ้า"}
                disabled={isSubmitting || !room}
              >
                <option value="ไฟฟ้า">ไฟฟ้า</option>
                <option value="ประปา">ประปา</option>
                <option value="เฟอร์นิเจอร์">เฟอร์นิเจอร์</option>
                <option value="อื่น ๆ">อื่น ๆ</option>
              </select>
            </label>
            <label className="full-span">
              <span>รายละเอียด</span>
              <textarea
                name="description"
                rows={4}
                placeholder="อธิบายปัญหาที่พบและช่วงเวลาที่เกิดขึ้น"
                defaultValue={editingRequest?.description || ""}
                required
                disabled={isSubmitting || !room}
              />
            </label>
            <label className="full-span">
              <span>แนบรูปภาพ (ไฟล์รูปภาพเท่านั้น · ไม่รองรับ PDF)</span>
              <input
                name="residentImage"
                type="file"
                accept="image/*"
                disabled={isSubmitting || !room}
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
              className="primary-button"
              type="submit"
              disabled={isSubmitting || !room}
            >
              {isSubmitting
                ? "กำลังส่งคำร้อง..."
                : editingRequest
                  ? "บันทึกการแก้ไข"
                  : "ส่งคำร้องแจ้งซ่อม"}
            </button>
          </form>
        </article>
        <article className="panel">
          <div className="panel-heading">
            <div>
              <span className="section-kicker">Request Tracking</span>
              <h2>รายการแจ้งซ่อมของคุณ</h2>
            </div>
          </div>
          {requests.length ? (
            requests.map((request) => (
              <article className="request-card" key={request.id}>
                <div className="panel-heading wrap-mobile">
                  <div>
                    <h3>{request.title}</h3>
                    <p>
                      {request.category} · แจ้งเมื่อ{" "}
                      {formatDate(request.createdAt, true)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <StatusBadge status={request.status} />
                    {request.status !== "resolved" &&
                      request.status !== "cancelled" &&
                      onEditRequest && (
                        <button
                          type="button"
                          className="ghost-button compact"
                          onClick={() => onEditRequest(request.id)}
                        >
                          แก้ไข
                        </button>
                      )}
                  </div>
                </div>
                <p>{request.description}</p>
                <div className="detail-stack compact">
                  <div className="detail-row">
                    <span>ผู้รับผิดชอบ</span>
                    <strong>{request.assignee || "ยังไม่มอบหมาย"}</strong>
                  </div>
                  <div className="detail-row">
                    <span>หมายเหตุจากผู้ดูแลอาคาร</span>
                    <strong>{request.adminNote || "ยังไม่มีการอัปเดต"}</strong>
                  </div>
                </div>
                {request.residentImage ? (
                  <div className="image-preview">
                    <img src={request.residentImage} alt="Resident upload" />
                  </div>
                ) : null}
                {request.completionImage ? (
                  <div className="image-preview">
                    <img
                      src={request.completionImage}
                      alt="Completion upload"
                    />
                  </div>
                ) : null}
              </article>
            ))
          ) : (
            <EmptyState
              title="ยังไม่มีคำร้อง"
              description="เริ่มต้นแจ้งซ่อมรายการแรกของคุณได้จากฟอร์มด้านซ้าย"
            />
          )}
        </article>
      </section>
    </>
  );
}

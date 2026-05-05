import { Calendar, Inbox, Megaphone, Send, Trash2 } from "lucide-react";
import type { FormEventHandler } from "react";
import { StatusBadge } from "../components/ui";
import { formatDate } from "../core";
import type { Announcement } from "../types";

type AnnouncementsViewProps = {
  adminTools: boolean;
  announcements: Announcement[];
  deletingAnnouncementId: string;
  isSubmitting: boolean;
  onSubmit: FormEventHandler<HTMLFormElement>;
  onDelete: (announcementId: string) => void;
};

export function AnnouncementsView({
  adminTools,
  announcements,
  deletingAnnouncementId,
  isSubmitting,
  onSubmit,
  onDelete,
}: AnnouncementsViewProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <div className="h-8 w-1 rounded-full bg-primary" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground lg:text-3xl">
            ประกาศ
          </h1>
        </div>
        <p className="text-muted-foreground ml-3">
          {adminTools
            ? "เผยแพร่ข่าวสารและแจ้งเตือนถึงผู้เช่าทุกคน"
            : "ข่าวสารล่าสุดจากผู้ดูแลอาคาร"}
        </p>
      </div>

      {/* Admin create form */}
      {adminTools && (
        <article className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <Megaphone className="h-5 w-5 text-primary" />
            </div>
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                Broadcast
              </span>
              <h2 className="text-lg font-bold text-foreground">
                สร้างประกาศใหม่
              </h2>
            </div>
          </div>

          <form className="grid gap-4 sm:grid-cols-2" onSubmit={onSubmit}>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                หัวข้อประกาศ
              </span>
              <input
                name="title"
                type="text"
                placeholder="หัวข้อประกาศ"
                required
                disabled={isSubmitting}
                className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                ระดับความสำคัญ
              </span>
              <select
                name="priority"
                defaultValue="low"
                disabled={isSubmitting}
                className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20 disabled:opacity-60"
              >
                <option value="low">ทั่วไป</option>
                <option value="medium">สำคัญ</option>
                <option value="high">ด่วน</option>
              </select>
            </label>

            <label className="sm:col-span-2 flex flex-col gap-1.5">
              <span className="text-sm font-medium text-foreground">
                รายละเอียด
              </span>
              <textarea
                name="message"
                rows={5}
                placeholder="ระบุรายละเอียดประกาศที่ต้องการส่งถึงผู้เช่าทุกคน"
                required
                disabled={isSubmitting}
                className="rounded-xl border border-border bg-muted/40 px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-all focus:border-primary focus:bg-card focus:ring-2 focus:ring-primary/20 resize-none disabled:opacity-60"
              />
            </label>

            <button
              type="submit"
              disabled={isSubmitting}
              className="sm:col-span-2 flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:shadow-lg hover:shadow-primary/20 hover:-translate-y-0.5 disabled:opacity-70 disabled:cursor-not-allowed disabled:translate-y-0"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "กำลังเผยแพร่..." : "เผยแพร่ประกาศ"}
            </button>
          </form>
        </article>
      )}

      {/* Announcements list */}
      <section className="space-y-3">
        {announcements.length ? (
          announcements.map((announcement) => (
            <article
              key={announcement.id}
              className="rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <StatusBadge status={announcement.priority} />
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Calendar className="h-3 w-3" />
                    {formatDate(announcement.createdAt, true)}
                  </span>
                </div>
                {adminTools && (
                  <button
                    type="button"
                    onClick={() => onDelete(announcement.id)}
                    disabled={deletingAnnouncementId === announcement.id}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    {deletingAnnouncementId === announcement.id
                      ? "กำลังลบ..."
                      : "ลบประกาศ"}
                  </button>
                )}
              </div>
              <h3 className="text-lg font-bold text-foreground mb-1.5">
                {announcement.title}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {announcement.message}
              </p>
              <div className="mt-3 pt-3 border-t border-border/50 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                ประกาศโดย {announcement.createdBy}
              </div>
            </article>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/50 py-16 px-6 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-muted mb-4">
              <Inbox className="h-7 w-7 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold text-foreground">
              ยังไม่มีประกาศ
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              ระบบยังไม่มีข่าวสารหรือประกาศในขณะนี้
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

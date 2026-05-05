import type { FormEventHandler, ReactNode } from "react";
import type { ThemeMode } from "../useTheme";
import { ThemeToggle } from "./ThemeToggle";
import { PasswordInput } from "./ui";

type AuthScreenProps = {
  flash: ReactNode;
  onLogin: FormEventHandler<HTMLFormElement>;
  isSubmitting: boolean;
  themeMode: ThemeMode;
  onSetTheme: (mode: ThemeMode) => void;
};

export function AuthScreen({
  flash,
  onLogin,
  isSubmitting,
  themeMode,
  onSetTheme,
}: AuthScreenProps) {
  return (
    <div className="auth-shell">
      {/* Theme toggle */}
      <ThemeToggle mode={themeMode} onSetMode={onSetTheme} />

      {/* Floating gradient orbs */}
      <div className="auth-orb auth-orb--1" />
      <div className="auth-orb auth-orb--2" />
      <div className="auth-orb auth-orb--3" />

      <div className="auth-card">
        {/* Brand */}
        <div className="auth-brand">
          <div className="auth-logo">
            <svg
              width="28"
              height="28"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
          </div>
          <h1>Kamu Kamu</h1>
          <p className="auth-subtitle">ระบบบริหารจัดการหอพัก</p>
        </div>

        {/* Flash message */}
        {flash}

        {/* Login Form */}
        <form className="auth-form" onSubmit={onLogin}>
          <div className="auth-input-group">
            <svg
              className="auth-input-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input
              name="username"
              type="text"
              placeholder="ชื่อผู้ใช้"
              required
              disabled={isSubmitting}
              autoComplete="username"
            />
          </div>

          <div className="auth-input-group">
            <svg
              className="auth-input-icon"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
            <PasswordInput
              name="password"
              placeholder="รหัสผ่าน"
              required
              disabled={isSubmitting}
            />
          </div>

          <button className="auth-submit" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="auth-spinner" />
                กำลังตรวจสอบ...
              </>
            ) : (
              "เข้าสู่ระบบ"
            )}
          </button>
        </form>

        <p className="auth-help">หากลืมรหัสผ่าน กรุณาติดต่อผู้ดูแลอาคาร</p>
      </div>
    </div>
  );
}

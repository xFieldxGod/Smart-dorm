import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { getStatusLabel, getToneClass } from "../core";
import type { FlashState } from "../types";

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`status-badge tone-${getToneClass(status)}`}>
      {getStatusLabel(status)}
    </span>
  );
}

export function SummaryCard({
  label,
  value,
  description,
}: {
  label: string;
  value: string;
  description: string;
}) {
  return (
    <article className="summary-card panel">
      <span className="summary-label">{label}</span>
      <strong>{value}</strong>
      <p>{description}</p>
    </article>
  );
}

export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="empty-state panel">
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

export function FlashMessage({ flash }: { flash: FlashState }) {
  if (!flash) {
    return null;
  }

  return (
    <div className={`flash tone-${flash.tone}`}>
      <strong>{flash.message}</strong>
    </div>
  );
}

export function PasswordInput({
  name,
  placeholder,
  required,
  disabled,
  minLength,
}: {
  name: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  minLength?: number;
}) {
  const [show, setShow] = useState(false);

  return (
    <div className="password-input-wrapper">
      <input
        name={name}
        type={show ? "text" : "password"}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        minLength={minLength}
        className="password-input"
      />
      <button
        type="button"
        className="password-toggle"
        onClick={() => setShow(!show)}
        tabIndex={-1}
      >
        {show ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

export function QrPayment({ reference }: { reference: string }) {
  return (
    <div className="qr-wrapper">
      <div className="qr-image-container">
        <img src="/assets/payment_qr.png" alt="PromptPay QR Code" />
      </div>
      <div className="qr-info">
        <span className="section-kicker">PromptPay Reference</span>
        <strong>{reference}</strong>
      </div>
    </div>
  );
}

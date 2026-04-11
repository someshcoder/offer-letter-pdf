"use client";

import { useEffect } from "react";

type SendEmailModalProps = {
  isOpen: boolean;
  userEmail: string;
  onUserEmailChange: (value: string) => void;
  onClose: () => void;
  onSendNow: () => void;
  sending: boolean;
  message: string | null;
};

export function SendEmailModal({
  isOpen,
  userEmail,
  onUserEmailChange,
  onClose,
  onSendNow,
  sending,
  message,
}: SendEmailModalProps) {
  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !sending) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, onClose, sending]);

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-200 ${
        isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
      }`}
      aria-hidden={!isOpen}
    >
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        disabled={sending}
        className="absolute inset-0 bg-slate-950/55 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="send-email-title"
        className={`relative w-full max-w-md rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl transition-all duration-200 dark:border-slate-700 dark:bg-slate-900 ${
          isOpen ? "translate-y-0 scale-100" : "translate-y-2 scale-95"
        }`}
      >
        <h3 id="send-email-title" className="text-lg font-semibold text-slate-900 dark:text-white">
          Send Email
        </h3>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
          Recipient email dalo. "Send Now" par mail draft khulega aur Offer Letter PDF download ho jayega.
        </p>

        <label className="mt-4 block text-sm font-medium text-slate-800 dark:text-slate-100">
          User Email
          <input
            type="email"
            value={userEmail}
            onChange={(e) => onUserEmailChange(e.target.value)}
            placeholder="user@example.com"
            className="mt-1.5 w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-100"
          />
        </label>

        {message ? (
          <p
            className={`mt-3 text-xs ${
              message.toLowerCase().includes("success")
                ? "text-emerald-700 dark:text-emerald-300"
                : "text-red-700 dark:text-red-300"
            }`}
          >
            {message}
          </p>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={sending}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSendNow}
            disabled={sending}
            className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-60"
          >
            {sending ? "Sending..." : "Send Now"}
          </button>
        </div>
      </div>
    </div>
  );
}

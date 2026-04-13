"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  isLocalDashboardItem,
  type DashboardItem,
} from "@/lib/dashboardTypes";
import {
  DOCUMENT_KIND_LABELS,
  type DocumentKind,
} from "@/lib/formTypes";
import { SendEmailModal } from "@/components/SendEmailModal";
import {
  downloadLocalSavedPdf,
  mergeDashboardItems,
  openLocalSavedPdf,
  readLocalSavedPdfs,
} from "@/lib/localSavedPdfs";

type EmployeeCounts = { Admin: number; Employee: number; TL: number; HR: number };

type Props = {
  initialItems: DashboardItem[];
  serverError: string | null;
  employeeTotal: number;
  roleCounts: EmployeeCounts;
  recentEmployees: Array<{
    id: string;
    name: string;
    role: string;
    designation: string;
  }>;
};

type Filter = "all" | DocumentKind;

const KIND_BADGE: Record<
  DocumentKind,
  string
> = {
  offer:
    "bg-indigo-500/15 text-indigo-700 ring-indigo-500/30 dark:bg-indigo-500/20 dark:text-indigo-200 dark:ring-indigo-400/30",
  internship:
    "bg-emerald-500/15 text-emerald-800 ring-emerald-500/30 dark:bg-emerald-500/20 dark:text-emerald-200 dark:ring-emerald-400/30",
  other:
    "bg-slate-500/10 text-slate-700 ring-slate-400/30 dark:bg-slate-500/20 dark:text-slate-300 dark:ring-slate-500/40",
};

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "offer", label: DOCUMENT_KIND_LABELS.offer },
  { id: "internship", label: DOCUMENT_KIND_LABELS.internship },
  { id: "other", label: DOCUMENT_KIND_LABELS.other },
];

const stableDateFormatter = new Intl.DateTimeFormat("en-GB", {
  day: "2-digit",
  month: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: true,
  timeZone: "UTC",
});

function formatStableDate(value: string): string {
  return stableDateFormatter.format(new Date(value));
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function DashboardClient({
  initialItems,
  serverError,
  employeeTotal,
  roleCounts,
  recentEmployees,
}: Props) {
  const router = useRouter();
  const [filter, setFilter] = useState<Filter>("all");
  const [activeMailId, setActiveMailId] = useState<string | null>(null);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [mailMsg, setMailMsg] = useState<string | null>(null);
  const [localItems, setLocalItems] = useState(() => readLocalSavedPdfs());

  useEffect(() => {
    const syncLocalItems = () => {
      setLocalItems(readLocalSavedPdfs());
    };

    syncLocalItems();
    window.addEventListener("storage", syncLocalItems);
    window.addEventListener("focus", syncLocalItems);

    return () => {
      window.removeEventListener("storage", syncLocalItems);
      window.removeEventListener("focus", syncLocalItems);
    };
  }, []);

  const items = useMemo(
    () => mergeDashboardItems(initialItems, localItems),
    [initialItems, localItems],
  );

  const activeItem = useMemo(
    () => items.find((item) => item.id === activeMailId) ?? null,
    [activeMailId, items],
  );

  const stats = useMemo(() => {
    const total = items.length;
    const offer = items.filter((i) => i.documentKind === "offer").length;
    const internship = items.filter(
      (i) => i.documentKind === "internship",
    ).length;
    const other = items.filter((i) => i.documentKind === "other").length;
    return { total, offer, internship, other };
  }, [items]);

  const filtered = useMemo(() => {
    if (filter === "all") return items;
    return items.filter((i) => i.documentKind === filter);
  }, [items, filter]);

  if (items.length === 0) {
    return (
      <div className="space-y-4">
        {serverError ? (
          <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            {serverError} Local browser saves will still appear here on this device.
          </div>
        ) : null}
        <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 p-12 text-center shadow-sm dark:border-slate-600 dark:bg-slate-900/50">
          <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">
            No saved letters yet
          </p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            Save a letter from the editor and it will appear here instantly.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 sm:gap-7 lg:gap-8">
      {serverError ? (
        <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {serverError} Database records may be incomplete until the server connection is restored.
        </div>
      ) : null}

      <section className="rounded-3xl border border-slate-200/80 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-700 dark:bg-slate-900/70 sm:p-6">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-indigo-600 dark:text-indigo-300">
              Saved Letters
            </p>
            <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
              Manage your offer and internship documents
            </h2>
          </div>
          <p className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-200">
            Total {stats.total}
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Total" value={stats.total} accent="from-slate-600 to-slate-800" />
        <StatCard
          label="Offer letters"
          value={stats.offer}
          accent="from-indigo-500 to-indigo-700"
        />
        <StatCard
          label="Internship"
          value={stats.internship}
          accent="from-emerald-500 to-emerald-700"
        />
        <StatCard label="Other" value={stats.other} accent="from-slate-500 to-slate-700" />
      </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Employees" value={employeeTotal} accent="from-cyan-500 to-cyan-700" />
        <StatCard label="Admin" value={roleCounts.Admin} accent="from-rose-500 to-rose-700" />
        <StatCard label="HR" value={roleCounts.HR} accent="from-amber-500 to-amber-700" />
        <StatCard label="TL" value={roleCounts.TL} accent="from-blue-500 to-blue-700" />
        <StatCard
          label="Employee"
          value={roleCounts.Employee}
          accent="from-emerald-500 to-emerald-700"
        />
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-300">
          Recent employees
        </h3>
        {recentEmployees.length === 0 ? (
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No employee records yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentEmployees.map((emp) => (
              <li
                key={emp.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700"
              >
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{emp.name}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{emp.designation}</p>
                </div>
                <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                  {emp.role}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm dark:border-slate-700 dark:bg-slate-900/70">
        <span className="mr-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
          Filter
        </span>
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition sm:px-4 sm:text-sm ${
                active
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-600 dark:hover:bg-slate-700/80"
              }`}
            >
              {f.label}
              {f.id !== "all" && (
                <span className="ml-1.5 tabular-nums opacity-70">
                  ·{" "}
                  {f.id === "offer"
                    ? stats.offer
                    : f.id === "internship"
                      ? stats.internship
                      : stats.other}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-sm text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
          No documents in this category. Switch filter or save a new letter with this
          type from the editor.
        </p>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:gap-5 lg:grid-cols-2">
          {filtered.map((row) => (
            <li
              key={row.id}
              className="group flex h-full flex-col rounded-3xl border border-slate-200/90 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg dark:border-slate-700 dark:bg-slate-900/90 dark:hover:border-indigo-500/40 sm:p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="flex flex-wrap gap-2">
                  <span
                    className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${KIND_BADGE[row.documentKind]}`}
                  >
                    {DOCUMENT_KIND_LABELS[row.documentKind]}
                  </span>
                  <span className="inline-flex rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 ring-1 ring-inset ring-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:ring-slate-700">
                    {row.storage === "local" ? "Local" : "Database"}
                  </span>
                </div>
                <time
                  className="text-xs tabular-nums text-slate-500 dark:text-slate-400"
                  dateTime={row.createdAt}
                >
                  {formatStableDate(row.createdAt)}
                </time>
              </div>
              <h2 className="mt-3 text-sm font-semibold leading-snug text-slate-900 dark:text-white sm:text-base lg:text-lg">
                {row.title}
              </h2>
              {row.refNo ? (
                <p className="mt-0.5 font-mono text-xs text-slate-500 dark:text-slate-400">
                  {row.refNo}
                </p>
              ) : null}
              <p className="mt-2 text-xs text-slate-600 dark:text-slate-400 sm:text-sm md:text-base">
                <span className="text-slate-400 dark:text-slate-500">Candidate:</span>{" "}
                {row.name?.trim() || "—"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                {row.mailSentAt ? (
                  <span className="rounded-md bg-emerald-500/10 px-2 py-1 font-medium text-emerald-800 dark:text-emerald-300">
                    Emailed {formatStableDate(row.mailSentAt)}
                  </span>
                ) : null}
                {row.lastMailTo ? (
                  <span className="text-slate-500 dark:text-slate-400">
                    → {row.lastMailTo}
                  </span>
                ) : null}
              </div>
              {row.mailError &&
              !row.mailError.includes("Resend send failed") &&
              !row.mailError.includes("Email not configured. Use a real mail server") ? (
                <p className="mt-2 rounded-lg bg-red-500/10 px-2 py-1.5 text-xs text-red-700 dark:text-red-300">
                  {row.mailError}
                </p>
              ) : null}
              <CardActions
                item={row}
                onSendEmail={() => {
                  setActiveMailId(row.id);
                  setRecipientEmail("");
                  setMailMsg(null);
                }}
              />
            </li>
          ))}
        </ul>
      )}
      <SendEmailModal
        isOpen={Boolean(activeMailId)}
        userEmail={recipientEmail}
        onUserEmailChange={setRecipientEmail}
        onClose={() => {
          if (sending) return;
          setActiveMailId(null);
        }}
        onSendNow={async () => {
          if (!activeItem) return;
          const to = recipientEmail.trim();
          if (!to) {
            setMailMsg("Please enter recipient email.");
            return;
          }
          if (!isValidEmail(to)) {
            setMailMsg("Please enter a valid email address.");
            return;
          }
          setSending(true);
          setMailMsg(null);
          try {
            if (isLocalDashboardItem(activeItem)) {
              downloadLocalSavedPdf(activeItem);
            } else {
              const fileUrl = `/api/pdfs/${activeItem.id}/file`;
              const anchor = document.createElement("a");
              anchor.href = fileUrl;
              anchor.download = "offer-letter.pdf";
              document.body.appendChild(anchor);
              anchor.click();
              anchor.remove();
            }

            const subject = encodeURIComponent("Offer Letter");
            const body = encodeURIComponent(
              "Hi,\n\nPlease find the offer letter attached.\n\nThanks.",
            );
            const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(
              to,
            )}&su=${subject}&body=${body}`;
            const link = document.createElement("a");
            link.href = gmailComposeUrl;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            document.body.appendChild(link);
            link.click();
            link.remove();
            setMailMsg(
              "Gmail opened in new tab & PDF downloaded. Please attach and send.",
            );
            setActiveMailId(null);
            if (!isLocalDashboardItem(activeItem)) {
              router.refresh();
            }
          } catch (e) {
            setMailMsg(e instanceof Error ? e.message : "Failed to prepare email.");
          } finally {
            setSending(false);
          }
        }}
        sending={sending}
        message={mailMsg}
      />
    </div>
  );
}

function StatCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="h-full overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className={`h-1 bg-linear-to-r ${accent}`} aria-hidden />
      <div className="px-5 py-4">
        <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-xs">
          {label}
        </p>
        <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900 dark:text-white sm:text-3xl">
          {value}
        </p>
      </div>
    </div>
  );
}

function CardActions({
  item,
  onSendEmail,
}: {
  item: DashboardItem;
  onSendEmail: () => void;
}) {
  const downloadHref = item.storage === "remote" ? `/api/pdfs/${item.id}/file` : null;

  return (
    <div className="mt-4 flex flex-col gap-2 border-t border-slate-100 pt-4 dark:border-slate-800">
      <div className="flex flex-wrap gap-2">
        {isLocalDashboardItem(item) ? (
          <>
            <button
              type="button"
              onClick={() => downloadLocalSavedPdf(item)}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 sm:flex-none"
            >
              Download PDF
            </button>
            <button
              type="button"
              onClick={() => openLocalSavedPdf(item)}
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Open in tab
            </button>
          </>
        ) : (
          <>
            <a
              href={downloadHref ?? undefined}
              className="inline-flex flex-1 items-center justify-center rounded-xl bg-indigo-600 px-3 py-2 text-xs font-semibold text-white shadow-sm hover:bg-indigo-500 sm:flex-none"
            >
              Download PDF
            </a>
            <a
              href={downloadHref ?? undefined}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Open in tab
            </a>
          </>
        )}
        <button
          type="button"
          onClick={onSendEmail}
          className="inline-flex items-center justify-center rounded-xl border border-emerald-600 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 shadow-sm hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-200 dark:hover:bg-emerald-950"
        >
          Send Email
        </button>
      </div>
    </div>
  );
}

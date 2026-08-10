"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { PageShell, btnPrimary, btnSecondary } from "@/components/modules/DataTable";
import { moduleBreadcrumbs, MODULE_REGISTRY } from "@/lib/navigation";
import { EmptyState } from "@/components/modules/EmptyState";
import toast from "react-hot-toast";
import { fetchJsonCached, getCachedJson, invalidateCachedUrl } from "@/lib/clientDataCache";

const mod = MODULE_REGISTRY.notifications;

type Notification = {
  _id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string;
  createdAt: string;
};

export default function NotificationsPage() {
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const url = "/api/notifications";
    const cached = getCachedJson<{ items?: Notification[]; unreadCount?: number }>(url);
    if (cached) {
      setItems(cached.items || []);
      setUnreadCount(cached.unreadCount || 0);
      setLoading(false);
    } else {
      setLoading(true);
    }
    try {
      const data = await fetchJsonCached<{ items?: Notification[]; unreadCount?: number }>(url);
      setItems(data.items || []);
      setUnreadCount(data.unreadCount || 0);
    } catch {
      toast.error("Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    invalidateCachedUrl("/api/notifications");
    load();
  };

  const markAllRead = async () => {
    await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ markAll: true }),
    });
    toast.success("All marked as read");
    invalidateCachedUrl("/api/notifications");
    load();
  };

  return (
    <PageShell
      title={mod.title}
      subtitle={`Tasks completed by employees — ${unreadCount} unread`}
      breadcrumbs={<Breadcrumb items={moduleBreadcrumbs(mod.route)} />}
      action={
        items.length > 0 ? (
          <button type="button" onClick={markAllRead} className={btnSecondary}>
            Mark all read
          </button>
        ) : undefined
      }
    >
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200 dark:bg-slate-800" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          title="No task completion notifications"
          description="When an employee marks a task complete from their dashboard, it will appear here."
        />
      ) : (
        <div className="space-y-3">
          {items.map((n) => (
            <div
              key={n._id}
              className={`rounded-2xl border p-4 ${
                n.read
                  ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                  : "border-emerald-300 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/20"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                      Task Done
                    </span>
                    <h3 className="font-semibold text-slate-900 dark:text-white">{n.title}</h3>
                  </div>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">{n.message}</p>
                  <p className="mt-2 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p>
                  {n.link && (
                    <Link href={n.link} className="mt-2 inline-block text-xs font-semibold text-cyan-600 hover:underline">
                      View task →
                    </Link>
                  )}
                </div>
                {!n.read && (
                  <button type="button" onClick={() => markRead(n._id)} className={btnPrimary}>
                    Mark read
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageShell>
  );
}

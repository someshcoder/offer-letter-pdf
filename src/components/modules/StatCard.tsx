"use client";

import {
  Briefcase,
  Clock,
  CreditCard,
  FileText,
  Shield,
  TrendingUp,
  UserCircle,
  Users,
  type LucideIcon,
} from "lucide-react";

type StatIconKey =
  | "Shield"
  | "Briefcase"
  | "TrendingUp"
  | "CreditCard"
  | "Clock"
  | "Users"
  | "FileText"
  | "UserCircle";

const iconMap: Record<StatIconKey, LucideIcon> = {
  Shield,
  Briefcase,
  TrendingUp,
  CreditCard,
  Clock,
  Users,
  FileText,
  UserCircle,
};

const colorMap = {
  indigo: "text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20 dark:text-indigo-300",
  green: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-300",
  orange: "text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300",
  red: "text-rose-600 bg-rose-50 dark:bg-rose-900/20 dark:text-rose-300",
  blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20 dark:text-blue-300",
};

export function StatCard({
  title,
  value,
  icon,
  color,
}: {
  title: string;
  value: string | number;
  icon: StatIconKey;
  color: keyof typeof colorMap;
}) {
  const Icon = iconMap[icon];
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <h3 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</h3>
        </div>
        <div className={`shrink-0 rounded-xl p-3 ${colorMap[color]}`}>
          <Icon className="size-6" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="h-24 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800" />
      ))}
    </>
  );
}

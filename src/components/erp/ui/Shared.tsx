"use client";

import React from "react";
import { motion } from "framer-motion";
import { 
  Shield, Briefcase, TrendingUp, CreditCard, Clock, 
  Users, FileText, Play, UserCircle
} from "lucide-react";

type StatIconKey = "Shield" | "Briefcase" | "TrendingUp" | "CreditCard" | "Clock" | "Users" | "FileText" | "Play" | "UserCircle";

const StatIconMap: Record<StatIconKey, React.ElementType> = {
  Shield, Briefcase, TrendingUp, CreditCard, Clock, Users, FileText, Play, UserCircle
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: StatIconKey;
  color: "indigo" | "green" | "orange" | "red" | "blue";
  trend?: string;
}

const colorMap = {
  indigo: "from-indigo-500 to-indigo-600 text-indigo-600 bg-indigo-50 dark:bg-indigo-900/20",
  green: "from-emerald-500 to-emerald-600 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
  orange: "from-orange-500 to-orange-600 text-orange-600 bg-orange-50 dark:bg-orange-900/20",
  red: "from-rose-500 to-rose-600 text-rose-600 bg-rose-50 dark:bg-rose-900/20",
  blue: "from-blue-500 to-blue-600 text-blue-600 bg-blue-50 dark:bg-blue-900/20",
};

export function StatCard({ title, value, icon, color, trend }: StatCardProps) {
  const colorClasses = colorMap[color];
  const TheIcon = StatIconMap[icon];
  
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm shadow-slate-100 dark:shadow-none relative overflow-hidden"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">{title}</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{value}</h3>
        </div>
        <div className={`p-3 rounded-xl ${colorClasses.split(' ').slice(2).join(' ')}`}>
          {TheIcon && <TheIcon className={`w-6 h-6 ${colorClasses.split(' ')[2]}`} />}
        </div>
      </div>
      {trend && (
        <div className="mt-4 flex items-center gap-1.5">
          <span className="text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded">
            {trend}
          </span>
          <span className="text-xs text-slate-400">from last month</span>
        </div>
      )}
    </motion.div>
  );
}

export function PageHeader({ 
  title, 
  subtitle, 
  action 
}: { 
  title: string; 
  subtitle?: string; 
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function CardSkeleton({ count = 3, grid = "grid-cols-1 md:grid-cols-3" }: { count?: number, grid?: string }) {
  return (
    <div className={`grid ${grid} gap-6`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm animate-pulse h-48 flex flex-col justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded w-3/4"></div>
              <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded w-1/2"></div>
            </div>
          </div>
          <div className="space-y-2 mt-auto">
            <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded w-full"></div>
            <div className="h-3 bg-slate-100 dark:bg-slate-900 rounded w-5/6"></div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden">
      <div className="h-12 bg-slate-50 dark:bg-slate-900/50 animate-pulse border-b border-slate-100 dark:border-slate-800"></div>
      <div className="p-4 space-y-4">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 rounded-full shrink-0"></div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded w-1/4"></div>
            <div className="h-4 bg-slate-100 dark:bg-slate-800 rounded flex-1"></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Modal({ isOpen, onClose, title, children, size = "lg" }: { isOpen: boolean, onClose: () => void, title: string, children: React.ReactNode, size?: "md"|"lg"|"xl"|"2xl"|"3xl" }) {
  if (!isOpen) return null;
  
  const sizeMap = {
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl"
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className={`bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 w-full ${sizeMap[size]} rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200`}>
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:text-slate-500 cursor-pointer transition-colors font-mono font-bold text-xl">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

export function Badge({ label, type = "neutral" }: { label: string, type?: "neutral"|"success"|"warning"|"danger"|"info" }) {
  const map = {
    neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300",
    success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
    warning: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    danger: "bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-400",
    info: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
  };
  return <span className={`text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${map[type]}`}>{label}</span>;
}

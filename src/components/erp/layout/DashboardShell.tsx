"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { 
  Menu, X, LogOut, ChevronRight, 
  Bell, User, ShieldCheck, Sun, Moon 
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import { useEffect } from "react";

import { 
  LayoutDashboard, Users, Briefcase, 
  CreditCard, FileText, Shield, History, Settings
} from "lucide-react";

type IconKey = "LayoutDashboard" | "Users" | "Briefcase" | "CreditCard" | "FileText" | "Shield" | "History" | "Settings";

const IconMap: Record<IconKey, React.ElementType> = {
  LayoutDashboard,
  Users,
  Briefcase,
  CreditCard,
  FileText,
  Shield,
  History,
  Settings
};

type NavItem = {
  label: string;
  href: string;
  icon: IconKey;
};

interface DashboardShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  role: "Admin" | "Franchise";
  userName?: string;
  companyName?: string;
  companyLogo?: string | null;
}

export default function DashboardShell({
  children,
  navItems,
  role,
  userName = "User",
  companyName = "ERP PORTAL",
  companyLogo = null,
}: DashboardShellProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    // Check runtime state
    const isDarkMode = document.documentElement.classList.contains("dark") || 
                       document.documentElement.getAttribute("data-theme") === "dark";
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDark;
    setIsDark(newTheme);
    
    // Mutate HTML class instantly for smooth switch
    if (newTheme) {
      document.documentElement.classList.add("dark");
      document.documentElement.setAttribute("data-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      document.documentElement.setAttribute("data-theme", "light");
    }

    // Update cookie for reload persistence
    document.cookie = `ems-theme=${newTheme ? "dark" : "light"}; path=/; max-age=31536000; SameSite=Lax`;
  };

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/erp/auth/logout", { method: "POST" });
      if (res.ok) {
        toast.success("Logged out");
        router.push("/erp/login");
      }
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-[#0f172a] text-slate-300 border-r border-slate-800">
      <div className="h-20 flex items-center px-6 border-b border-slate-800/50">
        <Link href={`/erp/${role.toLowerCase()}`} className="flex items-center gap-3 group overflow-hidden">
          {companyLogo ? (
            <img src={companyLogo} alt={companyName} className="h-10 w-auto object-contain max-w-[40px] rounded-md bg-white p-0.5" />
          ) : (
            <div className="w-10 h-10 shrink-0 bg-gradient-to-br from-indigo-600 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-900/20 group-hover:rotate-6 transition-transform">
              <ShieldCheck className="text-white w-6 h-6" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold tracking-wide truncate">{companyName}</h1>
            <span className="text-[10px] bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full font-semibold tracking-wider uppercase inline-block mt-0.5">{role} Panel</span>
          </div>
        </Link>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-1.5 py-6 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setIsMobileMenuOpen(false)}
              className={`group flex items-center justify-between px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/30"
                  : "hover:bg-slate-800/50 hover:text-white"
              }`}
            >
              <div className="flex items-center gap-3">
                {IconMap[item.icon] && React.createElement(IconMap[item.icon], {
                  className: `w-5 h-5 transition-colors ${isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"}`
                })}
                {item.label}
              </div>
              {isActive && <ChevronRight size={14} className="text-indigo-200" />}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800/50 bg-slate-900/30">
        <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl mb-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-slate-700 to-slate-600 flex items-center justify-center border border-slate-600">
            <User size={18} className="text-slate-300" />
          </div>
          <div className="overflow-hidden flex-1">
            <p className="text-sm font-semibold text-slate-100 truncate">{userName}</p>
            <p className="text-[11px] text-slate-500 truncate capitalize">{role}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-900/10 rounded-xl transition-colors cursor-pointer"
        >
          <LogOut size={18} />
          Sign Out
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#f8fafc] dark:bg-[#060a15] overflow-hidden">
      <Toaster position="top-right" />
      
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-72 shrink-0 h-full">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", bounce: 0, duration: 0.4 }}
              className="fixed inset-y-0 left-0 w-72 z-50 shadow-2xl lg:hidden h-full"
            >
              <SidebarContent />
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="absolute top-6 -right-12 bg-slate-800 text-white p-2 rounded-lg"
              >
                <X size={20} />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-4 md:px-8 bg-white dark:bg-[#0f172a]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800/50 shrink-0 z-20">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="lg:hidden p-2 -ml-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-600 dark:text-slate-400"
            >
              <Menu size={24} />
            </button>
            
            <div className="hidden sm:block">
              <h2 className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                Welcome back, <span className="text-slate-900 dark:text-slate-100 font-semibold">{userName}</span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-all transform active:scale-90"
            >
              {isDark ? <Sun size={20} className="text-amber-400" /> : <Moon size={20} />}
            </button>
            
            <button className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors relative">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-500 rounded-full ring-2 ring-white dark:ring-[#0f172a]"></span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto bg-[#f3f7fb] dark:bg-[#060a15] p-4 md:p-8 relative">
          {/* Subtle Background decorative radial */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 dark:bg-indigo-500/10 blur-3xl rounded-full pointer-events-none" />
          <div className="relative z-10 max-w-[1400px] mx-auto h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

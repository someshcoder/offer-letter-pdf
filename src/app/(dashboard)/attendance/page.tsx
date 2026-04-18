"use client";

import React, { useState, useMemo } from "react";
import { SalaryForm } from "@/components/SalaryForm";
import { SalarySummary } from "@/components/SalarySummary";
import { calculateSalary, SalaryStructure } from "@/utils/salaryCalculator";

export default function AttendancePayrollPage() {
  const [formData, setFormData] = useState<SalaryStructure>({
    monthlySalary: 0,
    totalDays: 30,
    unpaidLeaves: 0,
    paidLeaves: 0,
    bonus: 0,
    overtime: 0,
    taxPercentage: 0,
    otherDeductions: 0,
  });

  const breakdown = useMemo(() => calculateSalary(formData), [formData]);

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl animate-in fade-in slide-in-from-bottom-4 duration-500">
        <header className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-600 dark:text-cyan-400">
              Payroll Management
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 dark:text-white sm:text-4xl">
              Employee Attendance
            </h1>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Calculate real-time salaries based on attendance, government deductions, and incentives.
              Everything you need for precise payroll processing.
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-cyan-600 dark:bg-cyan-950 dark:text-cyan-400">
             <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
             </svg>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1fr_400px]">
          <SalaryForm data={formData} onChange={setFormData} />
          <SalarySummary breakdown={breakdown} />
        </div>
      </div>
    </div>
  );
}

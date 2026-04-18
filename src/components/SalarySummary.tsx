"use client";

import React from "react";
import { SalaryBreakdown } from "@/utils/salaryCalculator";

interface Props {
  breakdown: SalaryBreakdown;
  employeeName?: string;
}

export const SalarySummary: React.FC<Props> = ({ breakdown, employeeName = "John Doe" }) => {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(val);

  return (
    <div className="flex flex-col gap-6">
      {/* Main Net Salary Card */}
      <div className="relative overflow-hidden rounded-[2rem] bg-gradient-to-br from-cyan-600 to-indigo-700 p-8 text-white shadow-2xl">
        <div className="relative z-10">
          <p className="text-sm font-semibold uppercase tracking-widest opacity-80">Estimated Net Salary</p>
          <h2 className="mt-2 text-5xl font-black tracking-tight">{formatCurrency(breakdown.netSalary)}</h2>
          <div className="mt-6 flex flex-wrap gap-4">
            <div className="rounded-2xl bg-white/10 px-4 py-2 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase opacity-60">Worked Days</p>
              <p className="text-sm font-bold">{breakdown.workedDays} Days</p>
            </div>
            <div className="rounded-2xl bg-white/10 px-4 py-2 backdrop-blur-md">
              <p className="text-[10px] font-bold uppercase opacity-60">Per Day Rate</p>
              <p className="text-sm font-bold">{formatCurrency(breakdown.perDaySalary)}</p>
            </div>
          </div>
        </div>
        {/* Decorative elements */}
        <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
        <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-cyan-400/20 blur-3xl"></div>
      </div>

      {/* Breakdown Card */}
      <div className="rounded-[2.5rem] border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900/40">
        <h3 className="mb-6 text-lg font-bold text-slate-800 dark:text-white">Detailed Breakdown</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">Gross Salary (Earned)</span>
            <span className="font-semibold text-slate-900 dark:text-white">{formatCurrency(breakdown.grossEarned)}</span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-500 dark:text-slate-400">Bonus & Incentives</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">+{formatCurrency(breakdown.totalBonus)}</span>
          </div>

          <div className="my-4 border-t border-slate-100 dark:border-slate-800 pt-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">Deductions</p>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">PF Contribution (12%)</span>
                <span className="font-semibold text-rose-500">-{formatCurrency(breakdown.pfDeduction)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Tax (TDS)</span>
                <span className="font-semibold text-rose-500">-{formatCurrency(breakdown.taxDeduction)}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500 dark:text-slate-400">Total Deductions</span>
                <span className="rounded-lg bg-rose-50 px-2 py-1 font-bold text-rose-600 dark:bg-rose-900/20 dark:text-rose-400">
                   {formatCurrency(breakdown.totalDeduction)}
                </span>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.print()}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-4 text-sm font-bold text-white transition-all hover:bg-slate-800 hover:shadow-lg active:scale-[0.98] dark:bg-white dark:text-slate-900"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2-2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          Generate Salary Slip
        </button>
      </div>

      {/* Printable Area (Hidden by default) */}
      <div className="hidden print:block fixed inset-0 bg-white p-12 text-black z-[9999]">
        <div className="border border-slate-300 p-8 rounded-lg max-w-2xl mx-auto">
          <div className="flex justify-between items-start border-b pb-6 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Salary Slip</h1>
              <p className="text-sm text-slate-500 uppercase tracking-widest mt-1">Official Remittance</p>
            </div>
            <div className="text-right">
              <p className="font-bold">EMS Suite</p>
              <p className="text-xs text-slate-500">Generated on {new Date().toLocaleDateString()}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-8 mb-8">
            <div>
              <p className="text-[10px] uppercase font-bold text-slate-400">Employee Details</p>
              <p className="font-bold text-lg">{employeeName}</p>
              <p className="text-sm text-slate-600">Performance Period: {new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
            </div>
            <div className="text-right">
              <p className="text-[10px] uppercase font-bold text-slate-400">Total Net Payable</p>
              <p className="text-2xl font-black text-cyan-700">{formatCurrency(breakdown.netSalary)}</p>
            </div>
          </div>

          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-slate-50 text-left">
                <th className="p-2 border">Description</th>
                <th className="p-2 border text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr><td className="p-2 border">Gross Base Salary</td><td className="p-2 border text-right">{formatCurrency(breakdown.grossEarned)}</td></tr>
              <tr><td className="p-2 border">Bonus & Incentives</td><td className="p-2 border text-right">{formatCurrency(breakdown.totalBonus)}</td></tr>
              <tr className="text-rose-600"><td className="p-2 border italic">PF Contribution (12%)</td><td className="p-2 border text-right">-{formatCurrency(breakdown.pfDeduction)}</td></tr>
              <tr className="text-rose-600"><td className="p-2 border italic">TDS / Income Tax</td><td className="p-2 border text-right">-{formatCurrency(breakdown.taxDeduction)}</td></tr>
              <tr className="bg-slate-50 font-bold"><td className="p-2 border">Total Net Salary</td><td className="p-2 border text-right">{formatCurrency(breakdown.netSalary)}</td></tr>
            </tbody>
          </table>

          <div className="mt-12 pt-12 border-t flex justify-between items-center opacity-50">
            <p className="text-xs">Computer generated slip, no signature required.</p>
            <p className="text-xs italic underline">Support: help@ems-suite.com</p>
          </div>
        </div>
      </div>
    </div>
  );
};

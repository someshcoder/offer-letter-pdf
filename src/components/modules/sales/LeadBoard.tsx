"use client";

import { useMemo } from "react";
import { format } from "date-fns";

const PIPELINE_STATUSES = [
  "New",
  "Pending",
  "In Review",
  "In Progress",
  "On Hold",
  "Completed",
  "Closed",
] as const;

/** Shared lead row shape for list/board (API may return null dates). */
export type LeadBoardItem = {
  _id: string;
  name: string;
  phone?: string;
  email?: string;
  company?: string;
  status?: string;
  source?: string;
  expectedValue?: number;
  assignedTo?: string;
  assignedToName?: string;
  nextFollowUpDate?: string | null;
  notes?: string;
  createdAt?: string;
};

export function LeadBoard({
  leads,
  onLeadClick,
}: {
  leads: LeadBoardItem[];
  onLeadClick: (leadId: string) => void;
}) {
  const columns = useMemo(() => {
    const cols: Record<string, LeadBoardItem[]> = {};
    for (const s of PIPELINE_STATUSES) cols[s] = [];
    cols.Other = [];

    for (const lead of leads) {
      const status = lead.status || "New";
      if (cols[status]) cols[status].push(lead);
      else cols.Other.push(lead);
    }
    return cols;
  }, [leads]);

  const visibleStatuses = useMemo(() => {
    const list = [...PIPELINE_STATUSES] as string[];
    if ((columns.Other || []).length > 0) list.push("Other");
    return list;
  }, [columns]);

  return (
    <div className="flex h-[min(70vh,720px)] gap-3 overflow-x-auto pb-2">
      {visibleStatuses.map((status) => {
        const columnLeads = columns[status] || [];
        return (
          <div
            key={status}
            className="flex w-64 shrink-0 flex-col rounded-xl border border-slate-200 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/40"
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200/80 px-3 py-2.5 dark:border-slate-800">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{status}</h3>
              <span className="rounded-full bg-slate-200 px-2 py-0.5 text-[10px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                {columnLeads.length}
              </span>
            </div>

            <div className="custom-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-2">
              {columnLeads.map((lead) => (
                <button
                  key={lead._id}
                  type="button"
                  onClick={() => onLeadClick(lead._id)}
                  className="rounded-xl border border-slate-200 bg-white p-3 text-left shadow-sm transition hover:border-cyan-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate text-sm font-bold text-slate-900 dark:text-white">{lead.name}</p>
                    {(lead.expectedValue || 0) > 0 && (
                      <span className="shrink-0 text-[10px] font-bold text-emerald-600">
                        ₹{Number(lead.expectedValue).toLocaleString()}
                      </span>
                    )}
                  </div>
                  {lead.company ? (
                    <p className="mt-0.5 truncate text-xs text-slate-500">{lead.company}</p>
                  ) : null}
                  <div className="mt-2 flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[11px] text-slate-400 dark:border-slate-800">
                    <span className="truncate">{lead.phone || "—"}</span>
                    <span className="shrink-0">
                      {lead.createdAt ? format(new Date(lead.createdAt), "MMM d") : ""}
                    </span>
                  </div>
                </button>
              ))}
              {columnLeads.length === 0 && (
                <div className="flex h-20 items-center justify-center rounded-xl border border-dashed border-slate-200 text-xs text-slate-400 dark:border-slate-700">
                  No leads
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

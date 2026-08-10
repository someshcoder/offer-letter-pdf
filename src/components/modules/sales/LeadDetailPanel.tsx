"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { format } from "date-fns";
import { fetchJsonCached, invalidateCachedUrl } from "@/lib/clientDataCache";
import { LEAD_STATUSES } from "@/types/modules/constants";
import { formInput, formSelect, formTextarea, btnPrimary, btnSecondary } from "@/components/modules/DataTable";

export function LeadDetailPanel({
  leadId,
  onClose,
  onUpdate,
}: {
  leadId: string | null;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [data, setData] = useState<{ item: any; followUps: any[] } | null>(null);
  const [loading, setLoading] = useState(false);

  // Form State
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (!leadId) {
      setData(null);
      return;
    }
    setLoading(true);
    fetchJsonCached<{ item: any; followUps: any[] }>(`/api/sales/leads/${leadId}`)
      .then((res) => {
        setData(res);
        setStatus(res.item.status);
      })
      .catch((err) => toast.error(err.message))
      .finally(() => setLoading(false));
  }, [leadId]);

  if (!leadId) return null;

  async function handleLogCall() {
    if (!note) return toast.error("Please add a note for the call");

    try {
      const res = await fetch(`/api/sales/leads/${leadId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          note,
          status,
          nextFollowUpDate: nextDate || undefined,
        }),
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Failed to log call");

      toast.success("Call logged successfully!");
      setNote("");
      setNextDate("");
      
      // Refresh local data
      invalidateCachedUrl(`/api/sales/leads/${leadId}`);
      invalidateCachedUrl("/api/sales/leads?limit=1000"); // invalidate kanban board cache
      const updated = await fetchJsonCached<{ item: any; followUps: any[] }>(`/api/sales/leads/${leadId}`);
      setData(updated);
      onUpdate();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function handleConvert() {
    if (!confirm("Are you sure you want to convert this lead to a customer?")) return;
    try {
      const res = await fetch(`/api/sales/leads/${leadId}?action=convert`, { method: "PUT" });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || "Conversion failed");
      toast.success("Lead converted to customer!");
      invalidateCachedUrl("/api/sales/leads?limit=1000");
      invalidateCachedUrl("/api/clients");
      onUpdate();
      onClose();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} 
      />
      
      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white shadow-2xl flex flex-col dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 transform transition-transform duration-300">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 p-5 dark:border-slate-800">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">Lead Details</h2>
          <button onClick={onClose} className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200">
            ✕
          </button>
        </div>

        {loading || !data ? (
          <div className="p-8 text-center text-slate-500 flex items-center justify-center h-full">Loading lead information...</div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {/* Info Section */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">{data.item.name}</h3>
                  <p className="text-sm font-medium text-slate-500">{data.item.company || "No Company"}</p>
                </div>
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 border border-blue-200 dark:border-blue-800/50 shadow-sm">
                  {data.item.status}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm bg-white dark:bg-slate-900 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Phone</p>
                  <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{data.item.phone}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Email</p>
                  <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5 truncate" title={data.item.email}>{data.item.email || "—"}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Source</p>
                  <p className="font-medium text-slate-700 dark:text-slate-300 mt-0.5">{data.item.source}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">Value</p>
                  <p className="font-medium text-emerald-600 dark:text-emerald-400 mt-0.5">₹{(data.item.expectedValue || 0).toLocaleString()}</p>
                </div>
              </div>
              
              {data.item.status !== "Closed" ? (
                <div className="mt-5">
                  <button onClick={handleConvert} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-emerald-500/30 transition-all active:scale-[0.98]">
                    Convert to Customer
                  </button>
                </div>
              ) : data.item.convertedClientId ? (
                <div className="mt-5">
                  <button onClick={() => setShowPaymentModal(true)} className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 hover:bg-emerald-700 hover:shadow-emerald-500/30 transition-all active:scale-[0.98]">
                    Record Payment
                  </button>
                </div>
              ) : null}
            </div>

            {/* Log Call Form */}
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
              <h4 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
                Log a Call / Follow-up
              </h4>
              <div className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-slate-500">Call Notes</label>
                  <textarea 
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="What was discussed?"
                    className={formTextarea + " min-h-[100px]"}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Update Status</label>
                    <select value={status} onChange={(e) => setStatus(e.target.value)} className={formSelect}>
                      {LEAD_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-slate-500">Next Follow-up</label>
                    <input 
                      type="date"
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className={formInput}
                    />
                  </div>
                </div>
                <button onClick={handleLogCall} className={btnPrimary + " w-full mt-2"}>
                  Save Call Log
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="p-5">
              <h4 className="font-bold text-slate-900 dark:text-white mb-5 flex items-center gap-2">
                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Activity Timeline
              </h4>
              {data.followUps.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 p-8 text-center dark:border-slate-800">
                  <p className="text-sm text-slate-500">No follow-ups logged yet.</p>
                </div>
              ) : (
                <div className="space-y-5">
                  {data.followUps.map((f, i) => (
                    <div key={f._id} className="relative pl-6">
                      <div className="absolute left-[3px] top-2 h-2.5 w-2.5 rounded-full border-2 border-white bg-blue-500 shadow-sm dark:border-slate-900"></div>
                      {i !== data.followUps.length - 1 && (
                        <div className="absolute left-[7px] top-5 h-[calc(100%+8px)] w-px bg-slate-200 dark:bg-slate-700"></div>
                      )}
                      <div className="rounded-xl border border-slate-100 bg-white p-3.5 shadow-sm dark:border-slate-800 dark:bg-slate-800/50">
                        <p className="font-medium text-slate-700 dark:text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{f.note}</p>
                        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-medium">
                          <span className="flex items-center gap-1">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {format(new Date(f.createdAt), "MMM d, yyyy h:mm a")}
                          </span>
                          {f.status && <span className="bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-600 dark:text-slate-400">Changed to: {f.status}</span>}
                          <span>by {f.createdByName}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      {showPaymentModal && data?.item?.convertedClientId && (
        <LeadPaymentModal 
          clientId={data.item.convertedClientId}
          clientName={data.item.name}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </>
  );
}

function LeadPaymentModal({ clientId, clientName, onClose }: { clientId: string, clientName: string, onClose: () => void }) {
  const [form, setForm] = useState({
    totalAmount: "",
    paidAmount: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);

  async function submitPayment() {
    if (!form.totalAmount || !form.paidAmount) return toast.error("Fill required fields");
    setSaving(true);
    try {
      const res = await fetch("/api/sales/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          totalAmount: Number(form.totalAmount),
          paidAmount: Number(form.paidAmount),
          notes: form.notes,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Payment recorded successfully!");
      onClose();
    } catch (err: any) {
      toast.error("Failed to record payment: " + err.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl dark:bg-slate-900 border border-slate-100 dark:border-slate-800">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Record Payment</h2>
        <p className="mt-1 text-sm text-slate-500">For newly converted customer: <span className="font-semibold text-slate-700 dark:text-slate-300">{clientName}</span></p>
        
        <div className="mt-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Total Invoice (₹)</label>
              <input
                type="number"
                className={formInput}
                value={form.totalAmount}
                onChange={(e) => setForm((p) => ({ ...p, totalAmount: e.target.value }))}
                placeholder="50000"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-slate-500">Amount Collected (₹)</label>
              <input
                type="number"
                className={formInput}
                value={form.paidAmount}
                onChange={(e) => setForm((p) => ({ ...p, paidAmount: e.target.value }))}
                placeholder="10000"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold text-slate-500">Notes / Reference</label>
            <input
              type="text"
              className={formInput}
              value={form.notes}
              onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
              placeholder="Advance payment, Cheque #, etc"
            />
          </div>
        </div>
        
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className={btnSecondary}>Cancel</button>
          <button type="button" onClick={submitPayment} disabled={saving} className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-emerald-500 disabled:opacity-60 transition-all active:scale-95">
            {saving ? "Saving..." : "Save Payment"}
          </button>
        </div>
      </div>
    </div>
  );
}

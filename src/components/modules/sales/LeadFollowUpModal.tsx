"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FormModal, FormField } from "@/components/ui/FormUi";
import { LEAD_STATUSES } from "@/types/modules/constants";
import { formSelect, formTextarea, formInput, btnPrimary } from "@/components/modules/DataTable";

export type FollowUp = {
  _id: string;
  leadId: string;
  note: string;
  followUpDate: string;
  status: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
};

type Lead = {
  _id: string;
  name: string;
  status: string;
  nextFollowUpDate?: string;
};

type Props = {
  open: boolean;
  leadId: string | null;
  onClose: () => void;
};

export function LeadFollowUpModal({ open, leadId, onClose }: Props) {
  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState<Lead | null>(null);
  const [followUps, setFollowUps] = useState<FollowUp[]>([]);
  const [note, setNote] = useState("");
  const [status, setStatus] = useState("");
  const [nextDate, setNextDate] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open && leadId) {
      loadData();
    }
  }, [open, leadId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/sales/leads/${leadId}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load lead");
      setLead(data.item);
      setFollowUps(data.followUps || []);
      setStatus(data.item.status);
      setNote("");
      setNextDate("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Error loading lead");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!note.trim()) return toast.error("Please enter a note");
    setSaving(true);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      toast.success("Follow-up saved");
      loadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <FormModal
      open={open}
      onClose={onClose}
      title={`Log Call: ${lead?.name || "..."}`}
      size="lg"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left side: Timeline */}
        <div className="flex flex-col h-[60vh]">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Past Calls & Notes</h3>
          <div className="flex-1 overflow-y-auto space-y-4 pr-2">
            {loading ? (
              <p className="text-sm text-slate-500">Loading...</p>
            ) : followUps.length === 0 ? (
              <p className="text-sm text-slate-500">No calls logged yet.</p>
            ) : (
              followUps.map((f) => (
                <div key={f._id} className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-semibold text-cyan-700 dark:text-cyan-400">{f.createdByName || 'User'}</span>
                    <span className="text-xs text-slate-500">{new Date(f.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{f.note}</p>
                  <div className="mt-2 text-xs font-medium text-slate-500">
                    Status: <span className="text-slate-800 dark:text-slate-200">{f.status}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right side: New Note Form */}
        <div className="flex flex-col bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 h-fit">
          <h3 className="font-semibold text-slate-800 dark:text-slate-200 mb-4">Add New Follow-up</h3>
          <FormField label="Call Notes / Summary" required>
            <textarea
              className={formTextarea}
              rows={4}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="What was discussed?"
            />
          </FormField>

          <FormField label="Update Status">
            <select
              className={formSelect}
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </FormField>

          <FormField label="Next Follow-up Date (Optional)">
            <input
              type="datetime-local"
              className={formInput}
              value={nextDate}
              onChange={(e) => setNextDate(e.target.value)}
            />
          </FormField>

          <div className="mt-6">
            <button
              onClick={handleSave}
              disabled={saving || !note.trim()}
              className={`${btnPrimary} w-full py-2.5`}
            >
              {saving ? "Saving..." : "Save Follow-up"}
            </button>
          </div>
        </div>
      </div>
    </FormModal>
  );
}

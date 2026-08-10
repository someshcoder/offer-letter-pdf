"use client";

import React, { useEffect, useState } from "react";
import { PageHeader, Card, TableSkeleton } from "@/components/erp/ui/Shared";
import { Plus, UserCircle, Search, Mail, Phone, MapPin, Loader2, FolderOpen } from "lucide-react";
import toast from "react-hot-toast";
import { IErpClient } from "@/types/erp";

export default function FranchiseClientsPage() {
  const [clients, setClients] = useState<IErpClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/erp/franchise/clients");
      const data = await res.json();
      if (res.ok) setClients(data.data);
    } catch (err) {
      toast.error("Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/erp/franchise/clients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      
      toast.success("Client registered!");
      setIsModalOpen(false);
      setFormData({ name: "", email: "", phone: "", address: "" });
      fetchClients();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredList = clients.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <PageHeader 
        title="Client Directory" 
        subtitle="Maintain secure unified records of your clientele."
        action={
          <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-xl font-medium text-sm flex items-center gap-2 transition-shadow hover:shadow-lg shadow-indigo-900/20">
            <Plus size={18} /> Add Client
          </button>
        }
      />

      <div className="bg-white dark:bg-[#0f172a] border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2 mb-6 flex items-center max-w-sm shadow-sm">
        <Search className="text-slate-400 w-4 h-4 mr-2" />
        <input type="text" placeholder="Search by name..." className="bg-transparent border-none outline-none w-full text-sm" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <TableSkeleton rows={6} />
      ) : filteredList.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">
          <UserCircle className="mx-auto w-12 h-12 opacity-30 mb-4" />
          <h3 className="font-bold text-slate-900 dark:text-white">No Clients Registered</h3>
          <p className="text-sm mt-1">Kick start by recording your first customer detail.</p>
        </Card>
      ) : (
        <div className="overflow-hidden border border-slate-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-[#0f172a] shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Client Info</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Contact</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Location</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/50">
                {filteredList.map((c) => (
                  <tr key={c._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-slate-900 dark:text-white">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-0.5 text-sm">
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><Mail size={13} /> {c.email || "N/A"}</div>
                        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400"><Phone size={13} /> {c.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-500">
                      <div className="flex items-center gap-1.5"><MapPin size={13} /> {c.address || "---"}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="text-xs bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 hover:text-indigo-600 font-semibold py-1.5 px-3 rounded-lg transition-colors inline-flex items-center gap-1.5 cursor-pointer">
                        <FolderOpen size={13} /> View Projects
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#0f172a] rounded-2xl w-full max-w-md overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800"><h2 className="font-bold text-lg dark:text-white">Add Client</h2></div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Full Name</label>
                <input required className="w-full border dark:border-slate-700 bg-transparent rounded-xl px-3.5 py-2 text-sm dark:text-white" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Phone</label>
                  <input required className="w-full border dark:border-slate-700 bg-transparent rounded-xl px-3.5 py-2 text-sm dark:text-white" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Email</label>
                  <input type="email" className="w-full border dark:border-slate-700 bg-transparent rounded-xl px-3.5 py-2 text-sm dark:text-white" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-slate-500 dark:text-slate-400 block mb-1">Address</label>
                <textarea className="w-full border dark:border-slate-700 bg-transparent rounded-xl px-3.5 py-2 text-sm dark:text-white h-20" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-xl hover:bg-slate-200 transition-colors">Cancel</button>
                <button type="submit" disabled={saving} className="flex-1 py-2 text-sm font-medium text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-900/20 flex justify-center items-center gap-2 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Client"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

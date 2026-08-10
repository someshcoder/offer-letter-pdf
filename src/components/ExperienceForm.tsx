"use client";

import React, { useState, useEffect, useRef } from "react";
import { ExperienceLetterData } from "@/utils/experienceLetterGenerator";
import { motion, AnimatePresence } from "framer-motion";
import { Search, User, Building, Briefcase, Calendar, Star, MessageSquare, Image as ImageIcon, Check, MapPin, Phone, Globe, Mail, ShieldCheck } from "lucide-react";
import type { Employee } from "@/types/employee";
import { formInput, formSection, formSectionDesc, formSectionTitle } from "@/components/ui/FormUi";

const inputClass = formInput;

interface Props {
  data: ExperienceLetterData;
  onChange: (newData: ExperienceLetterData) => void;
}

export const ExperienceForm: React.FC<Props> = ({ data, onChange }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [search, setSearch] = useState("");
  const [companySettings, setCompanySettings] = useState<any>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings/company");
        const json = await res.json();
        if (json && !json.error) setCompanySettings(json);
      } catch (error) {
        console.error("Failed to fetch company settings", error);
      }
    };
    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch("/api/employees");
        const json = await res.json();
        if (json.items) setEmployees(json.items);
      } catch (error) {
        console.error("Failed to fetch employees", error);
      }
    };
    fetchEmployees();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    onChange({ ...data, [name]: value });
  };

  const selectEmployee = (emp: Employee) => {
    onChange({
      ...data,
      employeeName: emp.employeeName,
      role: emp.designation,
      joiningDate: emp.createdAt ? emp.createdAt.split("T")[0] : "", // Using createdAt as joining date if not specified elsewhere
    });
    setSearch(emp.employeeName);
    setShowDropdown(false);
  };

  const filteredEmployees = employees.filter(emp => 
    emp.employeeName.toLowerCase().includes(search.toLowerCase()) ||
    emp.email.toLowerCase().includes(search.toLowerCase())
  );

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: { opacity: 1, x: 0 }
  };

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className={`${formSection} space-y-6 shadow-lg shadow-slate-200/50 dark:shadow-black/20 sm:space-y-8`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className={formSectionTitle}>Experience Details</h2>
          <p className={formSectionDesc}>Fill in the details for the experience letter</p>
        </div>
        <div className="flex gap-2">
           <button 
             onClick={() => onChange({...data, template: 'simple'})}
             className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${data.template === 'simple' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
           >
             Simple
           </button>
           <button 
             onClick={() => onChange({...data, template: 'professional'})}
             className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${data.template === 'professional' ? 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/50 dark:text-cyan-300' : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}
           >
             Professional
           </button>
        </div>
      </div>

      {/* Employee Search */}
      <motion.div variants={itemVariants} className="relative" ref={searchRef}>
        <label className="block">
          <span className="mb-1 flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
            <Search className="size-4 text-cyan-500" /> Auto-fill from Employee Data
          </span>
          <div className="relative min-w-0">
            <input
              type="text"
              placeholder="Search employee name..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
              onFocus={() => setShowDropdown(true)}
              className={inputClass}
            />
            <AnimatePresence>
              {showDropdown && search && (
                <motion.div 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute z-50 mt-2 w-full min-w-0 max-h-60 overflow-auto rounded-xl border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900"
                >
                  {filteredEmployees.length > 0 ? (
                    filteredEmployees.map((emp) => (
                      <button
                        key={emp._id}
                        type="button"
                        onClick={() => selectEmployee(emp)}
                        className="flex w-full min-w-0 items-center gap-3 px-3 py-3 text-left transition hover:bg-slate-50 dark:hover:bg-slate-800 sm:px-4"
                      >
                        <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-cyan-100 text-cyan-600 dark:bg-cyan-900 dark:text-cyan-300 font-bold text-xs">
                          {emp.employeeName.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold dark:text-white">{emp.employeeName}</p>
                          <p className="truncate text-[10px] text-slate-500">{emp.designation} • {emp.email}</p>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-slate-500">No employees found</div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </label>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={itemVariants}>
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <User className="size-4 text-slate-400" /> Employee Name
            </span>
            <input
              type="text"
              name="employeeName"
              value={data.employeeName}
              onChange={handleChange}
              placeholder="Full Name"
              className={inputClass}
            />
          </label>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <Building className="size-4 text-slate-400" /> Company Name
            </span>
            <input
              type="text"
              name="companyName"
              value={data.companyName}
              onChange={handleChange}
              placeholder="e.g. Acme Corp"
              className={inputClass}
            />
          </label>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <Briefcase className="size-4 text-slate-400" /> Role / Position
            </span>
            <input
              type="text"
              name="role"
              value={data.role}
              onChange={handleChange}
              placeholder="e.g. Senior Developer"
              className={inputClass}
            />
          </label>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <Star className="size-4 text-slate-400" /> Performance
            </span>
            <select
              name="performance"
              value={data.performance}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="Excellent">Excellent</option>
              <option value="Very Good">Very Good</option>
              <option value="Good">Good</option>
              <option value="Average">Average</option>
              <option value="Satisfactory">Satisfactory</option>
            </select>
          </label>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <Calendar className="size-4 text-slate-400" /> Joining Date
            </span>
            <input
              type="date"
              name="joiningDate"
              value={data.joiningDate}
              onChange={handleChange}
              className={inputClass}
            />
          </label>
        </motion.div>

        <motion.div variants={itemVariants}>
          <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <Calendar className="size-4 text-slate-400" /> Ending Date
            </span>
            <input
              type="date"
              name="endingDate"
              value={data.endingDate}
              onChange={handleChange}
              className={inputClass}
            />
          </label>
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <label className="block">
          <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
            <MessageSquare className="size-4 text-slate-400" /> Additional Remarks (Optional)
          </span>
          <textarea
            name="remarks"
            value={data.remarks}
            onChange={handleChange}
            placeholder="Add any specific achievements or remarks..."
            rows={3}
            className={`${inputClass} resize-none`}
          />
        </label>
      </motion.div>

      <motion.div variants={itemVariants} className="space-y-6">
        <div className="flex flex-col gap-3 rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
             Include Company Details
          </label>
          <select
            value={data.showCompanyAddress ? "yes" : "no"}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "yes" && companySettings) {
                onChange({
                  ...data,
                  showCompanyName: true,
                  showCompanyAddress: true,
                  showCompanyMobile: true,
                  showCompanyEmail: true,
                  showCompanyWebsite: true,
                  showCompanyLogo: true,
                  companyName: companySettings.companyName || data.companyName,
                  companyAddress: companySettings.companyAddress || "",
                  companyMobile: companySettings.companyMobile || "",
                  companyEmail: companySettings.companyEmail || "",
                  companyWebsite: companySettings.companyWebsite || "",
                  logo: companySettings.companyLogo?.url || data.logo,
                  signature: data.authorizedSignatory === "Director" 
                    ? (companySettings.directorSignature?.url || data.signature)
                    : (companySettings.seniorHrSignature?.url || data.signature)
                });
              } else {
                const checked = value === "yes";
                onChange({
                  ...data,
                  showCompanyName: checked,
                  showCompanyAddress: checked,
                  showCompanyMobile: checked,
                  showCompanyEmail: checked,
                  showCompanyWebsite: checked,
                  showCompanyLogo: checked,
                });
              }
            }}
            className={inputClass}
          >
            <option value="no">No (Exclude Company Details)</option>
            <option value="yes">Yes (Include & Auto-fill from Settings)</option>
            <option value="manual">Manual Entry Only</option>
          </select>
        </div>

        <AnimatePresence>
          {data.showCompanyAddress && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="grid gap-6 md:grid-cols-2 overflow-hidden"
            >
              <div className="space-y-4 md:col-span-2">
                <label className="block">
                  <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    <MapPin className="size-4 text-slate-400" /> Company Address
                  </span>
                  <input
                    type="text"
                    name="companyAddress"
                    value={data.companyAddress || ""}
                    onChange={handleChange}
                    placeholder="123 Business Ave, Suite 100..."
                    className={inputClass}
                  />
                </label>
              </div>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <Phone className="size-4 text-slate-400" /> Company Mobile No.
                </span>
                <input
                  type="text"
                  name="companyMobile"
                  value={data.companyMobile || ""}
                  onChange={handleChange}
                  placeholder="+91 9876543210"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <Mail className="size-4 text-slate-400" /> Company Email
                </span>
                <input
                  type="email"
                  name="companyEmail"
                  value={data.companyEmail || ""}
                  onChange={handleChange}
                  placeholder="contact@company.com"
                  className={inputClass}
                />
              </label>

              <label className="block">
                <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  <Globe className="size-4 text-slate-400" /> Company Website
                </span>
                <input
                  type="text"
                  name="companyWebsite"
                  value={data.companyWebsite || ""}
                  onChange={handleChange}
                  placeholder="www.company.com"
                  className={inputClass}
                />
              </label>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
           <label className="block">
            <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
              <ShieldCheck className="size-4 text-slate-400" /> Signature (Authorized Signatory)
            </span>
            <select
              name="authorizedSignatory"
              value={data.authorizedSignatory || "HR"}
              onChange={(e) => {
                const value = e.target.value as any;
                let newSignature = data.signature;
                if (companySettings) {
                   if (value === "Director") newSignature = companySettings.directorSignature?.url || "";
                   else if (value === "HR") newSignature = companySettings.seniorHrSignature?.url || "";
                }
                onChange({ ...data, authorizedSignatory: value, signature: newSignature });
              }}
              className={inputClass}
            >
              <option value="HR">HR</option>
              <option value="Director">Director</option>
              <option value="None">None</option>
            </select>
          </label>
        </div>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        <motion.div variants={itemVariants}>
           <label className="block">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <ImageIcon className="size-4 text-slate-400" /> Company Logo (URL)
              </span>
              <input 
                type="text"
                name="logo"
                value={data.logo}
                onChange={handleChange}
                placeholder="https://example.com/logo.png"
                className={inputClass}
              />
           </label>
        </motion.div>
        <motion.div variants={itemVariants}>
           <label className="block">
              <span className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-300 mb-1">
                <ImageIcon className="size-4 text-slate-400" /> Signature (URL)
              </span>
              <input 
                type="text"
                name="signature"
                value={data.signature}
                onChange={handleChange}
                placeholder="https://example.com/sig.png"
                className={inputClass}
              />
           </label>
        </motion.div>
      </div>
    </motion.div>
  );
};

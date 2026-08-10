"use client";

import { useEffect, useState, useCallback } from "react";
import type { Employee } from "@/types/employee";
import { 
  User, Mail, Phone, Calendar, Heart, Droplets, Users, 
  DollarSign, Briefcase, Shield, MapPin, Building, 
  CreditCard, Landmark, FileText, Download, X, Clock,
  CheckCircle2, Globe, Home
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type Props = {
  employee: Employee;
  onClose: () => void;
};

export default function EmployeeDetailModal({ employee, onClose }: Props) {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = useCallback(() => {
    setIsOpen(false);
    onClose();
  }, [onClose]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleClose]);

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-950/40 backdrop-blur-sm"
        onClick={handleClose}
        aria-hidden
      />

      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="fixed inset-x-2 top-3 z-50 max-h-[94vh] w-auto overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:inset-x-4 sm:top-1/2 sm:w-[calc(100%-2rem)] sm:max-w-5xl sm:-translate-y-1/2 sm:left-1/2 sm:-translate-x-1/2"
      >
        {/* Header */}
        <div className="relative flex items-center justify-between border-b border-slate-100 bg-slate-50/50 px-6 py-5 dark:border-slate-800 dark:bg-slate-950/30">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-600 dark:bg-cyan-500/20 dark:text-cyan-400">
              <User className="size-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white sm:text-2xl">
                {employee.employeeName}
              </h2>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1">
                <span className="flex items-center gap-1.5 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <Briefcase className="size-3.5" />
                  {employee.designation}
                </span>
                <span className="size-1 rounded-full bg-slate-300 dark:bg-slate-700" />
                <span className="flex items-center gap-1.5 text-sm font-medium text-cyan-600 dark:text-cyan-400">
                  <Shield className="size-3.5" />
                  {employee.accessRole}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="group flex size-10 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 transition-all hover:bg-slate-50 hover:text-slate-900 dark:bg-slate-800 dark:text-slate-500 dark:ring-slate-700 dark:hover:bg-slate-700 dark:hover:text-white"
          >
            <X className="size-5 transition-transform group-hover:rotate-90" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="custom-scrollbar max-h-[calc(94vh-140px)] overflow-y-auto p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-3">
            
            {/* Left Column - Main Info */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Personal Section */}
              <Section title="Personal Details" icon={User}>
                <Grid>
                  <Item icon={Mail} label="Email Address" value={employee.email} />
                  <Item icon={Phone} label="Mobile" value={employee.mobileNumber} />
                  <Item icon={Phone} label="Alternate" value={employee.alternateNumber || "—"} />
                  <Item icon={Calendar} label="Date of Birth" value={employee.dob} />
                  <Item icon={Heart} label="Marital Status" value={employee.maritalStatus} />
                  <Item icon={Droplets} label="Blood Group" value={employee.bloodGroup || "—"} />
                  <Item icon={Users} label="Relation" value={`${employee.relationType}: ${employee.relativeName}`} span="full" />
                </Grid>
              </Section>

              {/* Employment Section */}
              <Section title="Employment Info" icon={Briefcase}>
                <Grid>
                  <Item icon={DollarSign} label="Offered Salary" value={employee.offeredSalary ? `₹${employee.offeredSalary.toLocaleString()}` : "—"} />
                  <Item icon={Calendar} label="Joining Date" value={employee.joiningDate} />
                  <Item icon={Clock} label="Interview Date" value={employee.interviewDate || "—"} />
                  <Item icon={Globe} label="Working Type" value={employee.workingType} />
                  <Item icon={Home} label="Working Mode" value={employee.workingMode} />
                  {employee.workingMode === "Office" && (
                    <Item icon={MapPin} label="Office Location" value={employee.officeLocation || "—"} />
                  )}
                  {employee.reportingTL && (
                    <Item 
                      icon={Users} 
                      label="Reporting To" 
                      value={employee.reportingTL.employeeName} 
                      subValue={employee.reportingTL.email}
                      span="full" 
                    />
                  )}
                </Grid>
              </Section>

              {/* Bank Section */}
              <Section title="Financial Details" icon={Landmark}>
                <Grid>
                  <Item icon={User} label="Account Holder" value={employee.accountDetails.accountHolderName} />
                  <Item icon={CreditCard} label="Account Number" value={employee.accountDetails.accountNumber} />
                  <Item icon={Building} label="Bank Name" value={employee.accountDetails.bankName} />
                  <Item icon={Shield} label="IFSC Code" value={employee.accountDetails.ifscCode} />
                  <Item icon={Globe} label="UPI ID" value={employee.accountDetails.upiId || "—"} />
                  <Item icon={User} label="UPI Holder" value={employee.accountDetails.upiHolderName || "—"} />
                </Grid>
              </Section>

              {/* Address Section */}
              <Section title="Address Information" icon={MapPin}>
                <div className="space-y-4">
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Current Address</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{employee.address.currentAddress}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4 dark:bg-slate-800/50">
                    <p className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">Permanent Address</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300 leading-relaxed">{employee.address.permanentAddress}</p>
                  </div>

                </div>
              </Section>
            </div>

            {/* Right Column - Documents */}
            <div className="space-y-6">
              <Section title="Documents" icon={FileText}>
                <div className="space-y-4">
                  <div className="rounded-2xl border border-slate-100 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-950/30">
                    <p className="text-xs font-bold uppercase text-slate-400 mb-3">IDs</p>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">Aadhar</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{employee.documents.aadharNumber}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-slate-500">PAN</span>
                        <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{employee.documents.panNumber || "—"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <DocCard label="Aadhar Card" file={employee.documents.aadharFile} />
                    <DocCard label="PAN Card" file={employee.documents.panCardFile} />
                    <DocCard label="Experience Letter" file={employee.documents.experienceLetter} />
                    <DocCard label="Passbook" file={employee.documents.passbookFile} />
                    <DocCard label="Passport Photo" file={employee.documents.passportPhoto} isImage />
                  </div>

                  {employee.documents.academicDocuments && employee.documents.academicDocuments.length > 0 && (
                    <div className="pt-2">
                      <p className="text-xs font-bold uppercase text-slate-400 mb-3">Academic Docs</p>
                      <div className="space-y-2">
                        {employee.documents.academicDocuments.map((doc, i) => (
                          <DocCard key={i} label={`Academic Doc ${i + 1}`} file={doc} />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </Section>

              {/* Record Metadata */}
              <div className="rounded-3xl border border-slate-100 bg-slate-50/30 p-5 dark:border-slate-800 dark:bg-slate-950/20">
                <p className="text-xs font-bold uppercase text-slate-400 mb-4 flex items-center gap-2">
                  <CheckCircle2 className="size-3" />
                  System Record
                </p>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Created</span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{formatDate(employee.createdAt)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Last Update</span>
                    <span className="text-xs font-medium text-slate-600 dark:text-slate-400">{formatDate(employee.updatedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end border-t border-slate-100 bg-white px-6 py-4 dark:border-slate-800 dark:bg-slate-900">
          <button
            onClick={handleClose}
            className="rounded-xl bg-slate-900 px-8 py-2.5 text-sm font-bold text-white transition-all hover:bg-slate-800 active:scale-95 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
          >
            Dismiss
          </button>
        </div>
      </motion.div>
    </>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <div className="relative">
      <div className="flex items-center gap-2 mb-4">
        <div className="flex size-8 items-center justify-center rounded-lg bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
          <Icon className="size-4" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function Grid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-x-6 gap-y-4 sm:grid-cols-2">{children}</div>;
}

function Item({ icon: Icon, label, value, subValue, span = "half" }: any) {
  return (
    <div className={`${span === "full" ? "sm:col-span-2" : ""} group`}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500 mb-1 group-hover:text-cyan-500 transition-colors">
        {label}
      </p>
      <div className="flex items-center gap-2">
        {Icon && <Icon className="size-3.5 text-slate-300 dark:text-slate-600" />}
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate">
          {value}
        </p>
      </div>
      {subValue && <p className="text-[10px] text-slate-400 ml-5">{subValue}</p>}
    </div>
  );
}

function DocCard({ label, file, isImage }: { label: string; file: any; isImage?: boolean }) {
  if (!file) return null;
  return (
    <div className="group flex items-center justify-between gap-3 rounded-2xl border border-slate-100 bg-white p-3 shadow-sm transition-all hover:border-cyan-200 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-cyan-900/50">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex size-10 flex-shrink-0 items-center justify-center rounded-xl bg-slate-50 text-slate-400 dark:bg-slate-800 dark:text-slate-500">
          {isImage ? <Globe className="size-5" /> : <FileText className="size-5" />}
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-bold uppercase text-slate-400">{label}</p>
          <p className="truncate text-xs font-semibold text-slate-700 dark:text-slate-300">
            {file.originalName}
          </p>
        </div>
      </div>
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex size-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-600 transition-colors hover:bg-cyan-100 dark:bg-cyan-950/30 dark:text-cyan-400 dark:hover:bg-cyan-950/50"
      >
        <Download className="size-4" />
      </a>
    </div>
  );
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { Employee } from "@/types/employee";

type EmployeeResponse = { item?: Employee; error?: string };

export default function EmployeeViewPage() {
  const params = useParams();
  const employeeId = params.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEmployee = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/employees/${employeeId}`, {
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error("Failed to load employee");
        }

        const data = (await res.json()) as EmployeeResponse;
        setEmployee(data.item || null);
        setError(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error loading employee");
      } finally {
        setLoading(false);
      }
    };

    fetchEmployee();
  }, [employeeId]);

  if (loading) {
    return (
      <div className="min-h-screen p-3 flex items-center justify-center sm:p-4">
        <div className="text-center">
          <p className="text-sm text-slate-600 dark:text-slate-300">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !employee) {
    return (
      <div className="min-h-screen p-3 sm:p-4">
        <div className="max-w-4xl mx-auto rounded-xl sm:rounded-2xl border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950 sm:p-6">
          <p className="text-sm text-red-700 dark:text-red-300 break-words sm:text-base">{error || "Employee not found"}</p>
          <Link
            href="/employees"
            className="mt-4 inline-block rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500 sm:px-4 sm:py-2 sm:text-sm"
          >
            Back to Employees
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50 p-2 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 sm:p-3 md:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl space-y-3 sm:space-y-4 md:space-y-6">
        {/* Header Card */}
        <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900 sm:shadow-sm overflow-hidden">
          {/* Header Content */}
          <div className="p-3 sm:p-4 md:p-6">
            {/* Name and Actions */}
            <div className="flex flex-col gap-3 mb-4 sm:mb-5">
              <div className="flex-1 min-w-0">
                <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 dark:text-white line-clamp-2">
                  {employee.employeeName}
                </h1>
                <div className="mt-1 sm:mt-2 space-y-1">
                  <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 line-clamp-1">
                    {employee.designation}
                  </p>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-500 line-clamp-1">
                    {employee.email}
                  </p>
                </div>
              </div>
            </div>

            {/* Buttons */}
            <div className="mb-4 grid grid-cols-1 gap-2 min-[420px]:grid-cols-2 sm:mb-5 sm:flex sm:flex-wrap sm:gap-3">
              <Link
                href={`/employees/${employeeId}/edit`}
                className="rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-blue-500 active:bg-blue-700 sm:px-4 sm:py-2 sm:text-sm"
              >
                ✏️ Edit
              </Link>
              <Link
                href="/employees"
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-center text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 active:bg-slate-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700 sm:px-4 sm:py-2 sm:text-sm"
              >
                ← Back
              </Link>
            </div>

            {/* Quick Stats - Grid */}
            <div className="grid grid-cols-1 gap-2 border-t border-slate-200 pt-4 min-[420px]:grid-cols-2 sm:grid-cols-3 sm:gap-3 sm:pt-5 dark:border-slate-700">
              <StatCard
                label="Role"
                value={employee.role}
              />
              <StatCard
                label="Access"
                value={employee.accessRole}
                badge
              />
              <StatCard
                label="Mobile"
                value={employee.mobileNumber}
              />
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <DetailSection title="📱 Contact">
          <DetailGrid>
            <DetailField label="Email" value={employee.email} span="full" />
            <DetailField label="Mobile" value={employee.mobileNumber} />
            <DetailField label="Alternate" value={employee.alternateNumber || "—"} />
          </DetailGrid>
        </DetailSection>

        {/* Employment Information */}
        <DetailSection title="💼 Employment">
          <DetailGrid>
            <DetailField label="Designation" value={employee.designation} />
            <DetailField label="Working Type" value={employee.workingType} />
          </DetailGrid>
        </DetailSection>

        {employee.reportingTL ? (
          <DetailSection title="👥 Reporting">
            <DetailGrid>
              <DetailField label="Team Leader" value={employee.reportingTL.employeeName} />
              <DetailField label="TL Email" value={employee.reportingTL.email} />
            </DetailGrid>
          </DetailSection>
        ) : null}

        {/* Address Information */}
        <DetailSection title="📍 Address">
          <DetailGrid>
            <DetailField
              label="Current Address"
              value={employee.address.currentAddress}
              span="full"
            />
            <DetailField
              label="Permanent Address"
              value={employee.address.permanentAddress}
              span="full"
            />
            <DetailField
              label="Working Location"
              value={employee.address.workingLocation}
              span="full"
            />
          </DetailGrid>
        </DetailSection>

        {/* Bank Details */}
        <DetailSection title="🏦 Bank Account">
          <DetailGrid>
            <DetailField
              label="Account Holder"
              value={employee.accountDetails.accountHolderName}
              span="full"
            />
            <DetailField
              label="Account Number"
              value={maskAccountNumber(employee.accountDetails.accountNumber)}
              span="full"
            />
            <DetailField label="IFSC Code" value={employee.accountDetails.ifscCode} />
            <DetailField label="Bank Name" value={employee.accountDetails.bankName} />
            <DetailField
              label="UPI ID"
              value={employee.accountDetails.upiId || "—"}
              span="full"
            />
            <DetailField
              label="UPI Holder"
              value={employee.accountDetails.upiHolderName || "—"}
            />
          </DetailGrid>
        </DetailSection>

        {/* Documents */}
        <DetailSection title="📄 Documents">
          <DetailGrid>
            <DetailField
              label="Aadhar Number"
              value={maskAadhar(employee.documents.aadharNumber)}
            />
            {employee.documents.aadharFile && (
              <DocLink
                label="Aadhar File"
                file={employee.documents.aadharFile}
              />
            )}

            <DetailField
              label="PAN Number"
              value={employee.documents.panNumber
                ? maskPAN(employee.documents.panNumber)
                : "—"}
            />
            {employee.documents.panCardFile && (
              <DocLink
                label="PAN Card"
                file={employee.documents.panCardFile}
              />
            )}

            {employee.documents.passportPhoto && (
              <DocLink
                label="Passport Photo"
                file={employee.documents.passportPhoto}
              />
            )}

            {employee.documents.passbookFile && (
              <DocLink
                label="Passbook"
                file={employee.documents.passbookFile}
              />
            )}

            {employee.documents.experienceLetter && (
              <DocLink
                label="Experience Letter"
                file={employee.documents.experienceLetter}
              />
            )}
          </DetailGrid>

          {/* Academic Documents */}
          {employee.documents.academicDocuments &&
            employee.documents.academicDocuments.length > 0 && (
              <div className="mt-4 sm:mt-5 pt-4 sm:pt-5 border-t border-slate-200 dark:border-slate-700">
                <h4 className="mb-3 text-sm sm:text-base font-semibold text-slate-900 dark:text-white">
                  📚 Academic ({employee.documents.academicDocuments.length})
                </h4>
                <div className="space-y-2">
                  {employee.documents.academicDocuments.map((doc, idx) => (
                    <AcademicDocRow key={idx} file={doc} />
                  ))}
                </div>
              </div>
            )}
        </DetailSection>

        {/* Metadata */}
        <DetailSection title="ℹ️ Records">
          <DetailGrid>
            <DetailField label="Created" value={formatDate(employee.createdAt)} span="full" />
            <DetailField label="Updated" value={formatDate(employee.updatedAt)} span="full" />
          </DetailGrid>
        </DetailSection>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  badge = false,
}: {
  label: string;
  value: string;
  badge?: boolean;
}) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 truncate">
        {label}
      </p>
      {badge ? (
        <span className="mt-1 inline-block rounded-full bg-cyan-100 px-2 py-1 text-xs font-semibold text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 truncate max-w-full">
          {value}
        </span>
      ) : (
        <p className="mt-1 text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
          {value}
        </p>
      )}
    </div>
  );
}

function DetailSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl sm:rounded-2xl border border-slate-200 bg-white shadow-xs dark:border-slate-700 dark:bg-slate-900 sm:shadow-sm p-3 sm:p-4 md:p-6">
      <h2 className="mb-3 sm:mb-4 md:mb-6 text-sm sm:text-base md:text-lg font-semibold text-slate-900 dark:text-white">
        {title}
      </h2>
      {children}
    </div>
  );
}

function DetailGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:gap-4">{children}</div>;
}

type DetailFieldProps = {
  label: string;
  value: string;
  span?: "half" | "full";
};

function DetailField({ label, value, span = "half" }: DetailFieldProps) {
  const colSpan = span === "full" ? "sm:col-span-2" : "";
  return (
    <div className={colSpan}>
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest">
        {label}
      </p>
      <p className="mt-1 sm:mt-2 text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 break-words">
        {value}
      </p>
    </div>
  );
}

type DocLinkProps = {
  label: string;
  file: {
    originalName: string;
    url: string;
    size: number;
  };
};

function DocLink({ label, file }: DocLinkProps) {
  return (
    <div className="sm:col-span-2">
      <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 sm:mb-2">
        {label}
      </p>
      <a
        href={file.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex w-full items-center gap-2 rounded-lg bg-cyan-50 px-2 py-2 text-xs font-medium text-cyan-700 transition-colors hover:bg-cyan-100 dark:bg-cyan-950/30 dark:text-cyan-300 dark:hover:bg-cyan-950/50 sm:w-auto sm:px-3 sm:text-sm"
      >
        <span className="flex-shrink-0">📥</span>
        <span className="min-w-0 break-all">{file.originalName}</span>
        <span className="text-xs text-cyan-600 dark:text-cyan-400 flex-shrink-0">
          {formatFileSize(file.size)}
        </span>
      </a>
    </div>
  );
}

function AcademicDocRow({
  file,
}: {
  file: {
    originalName: string;
    url: string;
    size: number;
    uploadedAt: string | Date;
  };
}) {
  return (
    <a
      href={file.url}
      target="_blank"
      rel="noopener noreferrer"
      className="flex flex-col gap-2 rounded-lg border border-slate-200 bg-slate-50 p-2 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700/50 transition-colors sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs sm:text-sm font-medium text-slate-900 dark:text-white">
          📄 {file.originalName}
        </p>
        <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">
          {formatFileSize(file.size)} • {formatDate(file.uploadedAt)}
        </p>
      </div>
      <span className="flex-shrink-0 text-lg sm:ml-2">⬇️</span>
    </a>
  );
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function maskAadhar(aadhar: string): string {
  return aadhar.slice(-4).padStart(12, "*");
}

function maskPAN(pan: string): string {
  return pan.slice(-4).padStart(10, "*");
}

function maskAccountNumber(account: string): string {
  return account.slice(-4).padStart(account.length, "*");
}

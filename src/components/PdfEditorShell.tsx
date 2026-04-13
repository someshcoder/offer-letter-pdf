"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FormPanel } from "@/components/FormPanel";
import PdfPreview from "@/components/PdfPreview";
import {
  EMPTY_FORM,
  type DocumentKind,
  type FormFields,
} from "@/lib/formTypes";
import type { AccessRole, Employee } from "@/types/employee";
import {
  buildEditedPdf,
  downloadPdfBytes,
  pdfUint8ToBlob,
} from "@/lib/pdfEditor";
import { savePdfLocally } from "@/lib/localSavedPdfs";

const TEMPLATE_PATH = "/sample.pdf";

type Props = {
  userRole?: AccessRole | null;
};

export function PdfEditorShell({ userRole }: Props) {
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  const offsetX = 0;
  const offsetY = 0;
  const [livePreview, setLivePreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string>(TEMPLATE_PATH);
  const blobUrlRef = useRef<string | null>(null);

  const [documentKind, setDocumentKind] = useState<DocumentKind>("offer");
  const [serverSaving, setServerSaving] = useState(false);
  const [serverMessage, setServerMessage] = useState<string | null>(null);

  const revokeBlob = useCallback(() => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current);
      blobUrlRef.current = null;
    }
  }, []);

  useEffect(() => () => revokeBlob(), [revokeBlob]);

  useEffect(() => {
    const canReadEmployees = userRole === "Admin" || userRole === "HR" || userRole === "TL";
    if (!canReadEmployees) {
      setEmployees([]);
      return;
    }

    async function loadEmployees() {
      try {
        const res = await fetch("/api/employees", { cache: "no-store" });
        if (!res.ok) return;
        const data = (await res.json()) as { items?: Employee[] };
        setEmployees(data.items || []);
      } catch {
        setEmployees([]);
      }
    }

    loadEmployees();
  }, [userRole]);

  useEffect(() => {
    if (!selectedEmployeeId) return;
    const emp = employees.find((item) => item._id === selectedEmployeeId);
    if (!emp) return;

    setForm((prev) => ({
      ...prev,
      name: emp.employeeName,
      address: emp.address.currentAddress,
      subject: `Appointment for ${emp.designation}`,
      email: emp.email,
      mobile: emp.mobileNumber,
    }));
  }, [employees, selectedEmployeeId]);

  useEffect(() => {
    if (!livePreview) {
      revokeBlob();
      setPreviewUrl(TEMPLATE_PATH);
      return;
    }

    const handle = window.setTimeout(async () => {
      try {
        const bytes = await buildEditedPdf(TEMPLATE_PATH, form, {
          offsetX,
          offsetY,
        });
        const blob = pdfUint8ToBlob(bytes);
        revokeBlob();
        const nextUrl = URL.createObjectURL(blob);
        blobUrlRef.current = nextUrl;
        setPreviewUrl(nextUrl);
      } catch {
        setPreviewUrl(TEMPLATE_PATH);
      }
    }, 420);

    return () => window.clearTimeout(handle);
  }, [livePreview, form, offsetX, offsetY, revokeBlob]);

  const onFieldChange = useCallback((field: keyof FormFields, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  }, []);

  const onClear = useCallback(() => {
    setForm(EMPTY_FORM);
    setServerMessage(null);
  }, []);

  const onGenerate = useCallback(async () => {
    setLoading(true);
    try {
      const bytes = await buildEditedPdf(TEMPLATE_PATH, form, {
        offsetX,
        offsetY,
      });
      downloadPdfBytes(bytes, "edited-document.pdf");
    } catch (e) {
      console.error(e);
      window.alert(e instanceof Error ? e.message : "Failed to generate PDF");
    } finally {
      setLoading(false);
    }
  }, [form, offsetX, offsetY]);

  const persist = useCallback(async () => {
    setServerSaving(true);
    setServerMessage(null);
    try {
      const res = await fetch("/api/pdfs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          form,
          documentKind,
          offsetX,
          offsetY,
          sendMail: false,
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        id?: string;
      };
      if (!res.ok) {
        if (res.status < 500) {
          throw new Error(data.error || "Request failed");
        }

        const bytes = await buildEditedPdf(TEMPLATE_PATH, form, {
          offsetX,
          offsetY,
        });
        const localItem = savePdfLocally({
          form,
          documentKind,
          pdfBytes: bytes,
        });
        setServerMessage(
          `Server save unavailable. Saved locally in this browser as ${localItem.id}.`,
        );
        return;
      }
      setServerMessage(`Saved to database. Record: ${data.id}`);
    } catch (e) {
      if (e instanceof Error) {
        try {
          const bytes = await buildEditedPdf(TEMPLATE_PATH, form, {
            offsetX,
            offsetY,
          });
          const localItem = savePdfLocally({
            form,
            documentKind,
            pdfBytes: bytes,
          });
          setServerMessage(
            `Database unavailable (${e.message}). Saved locally in this browser as ${localItem.id}.`,
          );
        } catch {
          setServerMessage(e.message);
        }
      } else {
        setServerMessage("Save failed");
      }
    } finally {
      setServerSaving(false);
    }
  }, [form, documentKind, offsetX, offsetY]);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <main className="mx-auto flex w-full max-w-[1800px] flex-1 flex-col gap-4 px-3 py-4 sm:gap-5 sm:px-5 sm:py-5 md:px-6 lg:flex-row lg:items-start lg:gap-6 lg:px-7 lg:py-6 xl:px-8">
        <section className="w-full shrink-0 self-start lg:sticky lg:top-6 lg:w-[380px] xl:w-[420px]">
          <FormPanel
            documentKind={documentKind}
            onDocumentKindChange={setDocumentKind}
            employees={employees}
            selectedEmployeeId={selectedEmployeeId}
            onSelectEmployee={setSelectedEmployeeId}
            form={form}
            onChange={onFieldChange}
            livePreview={livePreview}
            onLivePreviewChange={setLivePreview}
            onGenerate={onGenerate}
            onClear={onClear}
            loading={loading}
            onSaveToDatabase={persist}
            serverBusy={serverSaving}
            serverMessage={serverMessage}
          />
        </section>
        <section className="flex min-h-[60vh] flex-1 flex-col lg:min-h-[76vh] lg:min-w-0">
          <PdfPreview fileUrl={previewUrl} />
        </section>
      </main>
    </div>
  );
}

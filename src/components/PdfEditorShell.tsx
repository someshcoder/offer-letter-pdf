"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { FormPanel } from "@/components/FormPanel";
import PdfPreview from "@/components/PdfPreview";
import {
  EMPTY_FORM,
  type DocumentKind,
  type FormFields,
} from "@/lib/formTypes";
import {
  buildEditedPdf,
  downloadPdfBytes,
  pdfUint8ToBlob,
} from "@/lib/pdfEditor";

const TEMPLATE_PATH = "/sample.pdf";

export function PdfEditorShell() {
  const [form, setForm] = useState<FormFields>(EMPTY_FORM);
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
        throw new Error(data.error || "Request failed");
      }
      setServerMessage(`Saved to database. Record: ${data.id}`);
    } catch (e) {
      setServerMessage(e instanceof Error ? e.message : "Save failed");
    } finally {
      setServerSaving(false);
    }
  }, [form, documentKind, offsetX, offsetY]);

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <main className="mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 px-4 py-6 sm:px-6 lg:flex-row lg:px-8 lg:py-8">
        <section className="w-full shrink-0 self-start lg:w-[min(100%,420px)] xl:w-[460px]">
          <FormPanel
            documentKind={documentKind}
            onDocumentKindChange={setDocumentKind}
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
        <section className="flex min-h-[min(76vh,52rem)] flex-1 flex-col lg:min-w-0">
          <PdfPreview fileUrl={previewUrl} />
        </section>
      </main>
    </div>
  );
}

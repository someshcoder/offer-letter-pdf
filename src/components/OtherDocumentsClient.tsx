"use client";

import dynamic from "next/dynamic";
import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
  useDeferredValue,
} from "react";
import {
  Upload,
  Download,
  FileText,
  Trash2,
  Image as ImageIcon,
  Plus,
  ChevronLeft,
  Eye,
  Hash,
  Calendar,
  User,
  Mail,
  Loader2,
  AlertCircle,
  Save,
  CheckCircle,
} from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { TableSkeleton } from "@/components/SkeletonLoader";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { documentBreadcrumbs } from "@/lib/navigation";

const Editor = dynamic(() => import("./editor/Editor"), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-[400px] items-center justify-center rounded-xl border border-slate-200 bg-white text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400">
      Loading editor...
    </div>
  ),
});

type SavedItem = {
  id: string;
  refNo: string;
  title: string;
  issuedToName: string;
  issuedToEmail: string;
  createdAt: string;
};

export default function OtherDocumentsClient() {
  const [items, setItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"list" | "create">("list");

  // Editor states
  const [content, setContent] = useState<string>("");
  const [letterheadImage, setLetterheadImage] = useState<string | null>(null);
  const [docTitle, setDocTitle] = useState<string>("");
  const [issuedToName, setIssuedToName] = useState<string>("");
  const [issuedToEmail, setIssuedToEmail] = useState<string>("");
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const documentRef = useRef<HTMLDivElement>(null);
  const deferredContent = useDeferredValue(content);

  const dateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }),
    [],
  );

  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/other-documents", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed to load documents");
      const data = (await res.json()) as { items?: SavedItem[] };
      setItems(data.items || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  const renderDocumentToPdf = useCallback(async () => {
    if (!documentRef.current) return null;
    const element = documentRef.current;
    const canvas = await html2canvas(element, {
      scale: 2,
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
    });
    const imgData = canvas.toDataURL("image/jpeg", 0.95);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, "JPEG", 0, 0, pdfWidth, pdfHeight);
    return pdf;
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLetterheadImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const removeLetterhead = useCallback(() => {
    setLetterheadImage(null);
  }, []);

  const generatePDFBlob = async (): Promise<string | null> => {
    const pdf = await renderDocumentToPdf();
    if (!pdf) return null;

    const arrayBuffer = pdf.output("arraybuffer");
    const bytes = new Uint8Array(arrayBuffer);
    let binary = "";
    bytes.forEach((b) => (binary += String.fromCharCode(b)));
    return btoa(binary);
  };

  const downloadPDF = useCallback(async () => {
    setIsGenerating(true);
    try {
      const pdf = await renderDocumentToPdf();
      if (!pdf) return;
      pdf.save(`${docTitle || "Document"}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsGenerating(false);
    }
  }, [docTitle, renderDocumentToPdf]);

  const saveToDatabase = useCallback(async () => {
    setIsSaving(true);
    setSaveMsg(null);
    try {
      const pdfBase64 = await generatePDFBlob();
      const res = await fetch("/api/other-documents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: docTitle,
          issuedToName,
          issuedToEmail,
          content,
          letterheadImage,
          pdfBase64,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Save failed");
      setSaveMsg(`Saved! Ref: ${json.refNo}`);
      setTimeout(() => {
        setView("list");
        fetchItems();
      }, 1500);
    } catch (e) {
      setSaveMsg(e instanceof Error ? e.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  }, [content, docTitle, fetchItems, issuedToEmail, issuedToName, letterheadImage, renderDocumentToPdf]);

  const handleCreate = useCallback(() => {
    setContent("");
    setLetterheadImage(null);
    setDocTitle("");
    setIssuedToName("");
    setIssuedToEmail("");
    setSaveMsg(null);
    setView("create");
  }, []);

  const handleViewPdf = useCallback((id: string) => {
    window.open(`/api/other-documents/${id}/file`, "_blank");
  }, []);

  const formatDate = useCallback((dateStr: string) => {
    try {
      return dateFormatter.format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  }, [dateFormatter]);

  const formattedItems = useMemo(
    () =>
      items.map((item) => ({
        ...item,
        createdAtLabel: formatDate(item.createdAt),
      })),
    [formatDate, items],
  );

  // Tiptap handles modules internally in Editor.tsx

  if (view === "create") {
    return (
      <div className="min-h-screen flex-1 px-3 py-4 sm:px-5 sm:py-6 md:px-6 lg:px-7 xl:px-8">
        <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
          <button
            onClick={() => setView("list")}
            className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-white"
          >
            <ChevronLeft className="size-4" />
            Back to Documents
          </button>

          <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70 sm:p-8">
            <div
              className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_15%_10%,rgba(45,212,191,0.16),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.14),transparent_38%)]"
              aria-hidden
            />
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
                  Documents
                </p>
                <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                  Other Documents
                </h1>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                <label className="relative inline-flex cursor-pointer items-center justify-center rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm transition-colors hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700">
                  <Upload className="mr-2 size-4" />
                  Upload Letterhead
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                </label>

                <button
                  onClick={saveToDatabase}
                  disabled={isSaving || !content}
                  className="inline-flex items-center justify-center rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <Save className="mr-2 size-4" />
                  )}
                  Save to Database
                </button>

                <button
                  onClick={downloadPDF}
                  disabled={isGenerating || !content}
                  className="inline-flex items-center justify-center rounded-xl bg-teal-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <div className="mr-2 size-4 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                  ) : (
                    <Download className="mr-2 size-4" />
                  )}
                  Download PDF
                </button>
              </div>
            </div>
            {saveMsg && (
              <div className={`mt-4 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ${saveMsg.startsWith("Saved") ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" : "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400"}`}>
                {saveMsg.startsWith("Saved") && <CheckCircle className="size-3.5" />}
                {saveMsg}
              </div>
            )}
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              {/* Info Form */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                  <User className="mr-2 size-5 text-indigo-500" />
                  Document Information
                </h3>
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">Document Title</label>
                    <input 
                      type="text" 
                      value={docTitle} 
                      onChange={(e) => setDocTitle(e.target.value)} 
                      placeholder="e.g. Appointment Letter"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Issued To (Name)</label>
                      <input 
                        type="text" 
                        value={issuedToName} 
                        onChange={(e) => setIssuedToName(e.target.value)} 
                        placeholder="Employee Name"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-500 mb-1">Issued To (Email)</label>
                      <input 
                        type="email" 
                        value={issuedToEmail} 
                        onChange={(e) => setIssuedToEmail(e.target.value)} 
                        placeholder="email@example.com"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-900 focus:border-indigo-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:focus:border-indigo-400"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Editor Section */}
              <div className="flex flex-col space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                    <FileText className="mr-2 size-5 text-teal-500" />
                    Word Editor
                  </h3>
                </div>

                <div className="flex-1 flex flex-col min-h-[400px]">
                  <Editor
                    content={content}
                    onChange={setContent}
                    placeholder="Type your document content here..."
                  />
                </div>
              </div>
            </div>

            {/* Preview Section */}
            <div className="flex flex-col space-y-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 shadow-sm dark:border-slate-700 dark:bg-slate-950">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white flex items-center">
                  <ImageIcon className="mr-2 size-5 text-indigo-500" />
                  A4 Preview
                </h3>
                {letterheadImage && (
                  <button
                    onClick={removeLetterhead}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg dark:hover:bg-red-950/30 transition-colors"
                    title="Remove Letterhead"
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>

              <div className="flex-1 overflow-auto rounded-xl border border-slate-200 bg-slate-200/50 p-4 dark:border-slate-800 dark:bg-slate-900/50 flex justify-center items-start">
                <div
                  ref={documentRef}
                  className="relative w-full max-w-[794px] aspect-[210/297] shadow-xl overflow-hidden"
                  style={{
                    backgroundColor: "#ffffff",
                    backgroundImage: letterheadImage
                      ? `url(${letterheadImage})`
                      : "none",
                    backgroundSize: "100% 100%",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                >
                  <div
                    className="absolute inset-0 p-12 sm:p-16 ql-editor"
                    style={{ 
                      wordBreak: "break-word",
                      color: "#000000"
                    }}
                    dangerouslySetInnerHTML={{ __html: deferredContent }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // List view
  return (
    <div className="min-h-screen flex-1 px-3 py-4 sm:px-5 sm:py-6 md:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
        <Breadcrumb items={documentBreadcrumbs("other")} />
        <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70 sm:p-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_15%_10%,rgba(45,212,191,0.16),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.14),transparent_38%)]"
            aria-hidden
          />
          <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">
                Documents
              </p>
              <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
                Other Documents
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
                Manage and create miscellaneous documents on your letterhead.
              </p>
            </div>
            <button
              onClick={handleCreate}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md active:scale-[0.97]"
            >
              <Plus className="size-4" />
              Create Document
            </button>
          </div>
        </header>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-900">
          {loading ? (
            <TableSkeleton columns={5} rows={5} />
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-12 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                <AlertCircle className="size-6" />
              </div>
              <p className="mt-4 text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
              <button
                onClick={fetchItems}
                className="mt-3 text-sm text-teal-600 underline hover:text-teal-700 dark:text-teal-400"
              >
                Try again
              </button>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-teal-500/10 text-teal-600 dark:bg-teal-500/20 dark:text-teal-400">
                <FileText className="size-7" />
              </div>
              <h3 className="mt-4 text-base font-semibold text-slate-900 dark:text-white">
                No documents yet
              </h3>
              <p className="mt-2 max-w-sm text-sm text-slate-500 dark:text-slate-400">
                Get started by creating your first custom document.
              </p>
              <button
                onClick={handleCreate}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-teal-700"
              >
                <Plus className="size-4" />
                Create Document
              </button>
            </div>
          ) : (
            <>
              <div className="hidden md:block">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 bg-slate-50/80 dark:border-slate-800 dark:bg-slate-950/50">
                      <th className="px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Hash className="size-3.5" />
                          Ref No.
                        </span>
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="size-3.5" />
                          Issue Date
                        </span>
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400">
                        <span className="inline-flex items-center gap-1.5">
                          <User className="size-3.5" />
                          Issued To
                        </span>
                      </th>
                      <th className="px-5 py-3.5 font-semibold text-slate-500 dark:text-slate-400">
                        Title
                      </th>
                      <th className="px-5 py-3.5 text-right font-semibold text-slate-500 dark:text-slate-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {formattedItems.map((item) => (
                      <tr
                        key={item.id}
                        className="transition-colors hover:bg-slate-50/60 dark:hover:bg-slate-800/40"
                      >
                        <td className="px-5 py-4">
                          <span className="inline-flex items-center rounded-md bg-teal-50 px-2.5 py-1 text-xs font-bold text-teal-700 ring-1 ring-teal-600/10 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-400/20">
                            {item.refNo}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-700 dark:text-slate-300">
                          {item.createdAtLabel}
                        </td>
                        <td className="px-5 py-4">
                          <div>
                            <p className="font-medium text-slate-900 dark:text-white">
                              {item.issuedToName || "—"}
                            </p>
                            {item.issuedToEmail && (
                              <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                                <Mail className="size-3" />
                                {item.issuedToEmail}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-4 text-slate-600 dark:text-slate-400 font-medium">
                          {item.title}
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewPdf(item.id)}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-teal-700 hover:shadow-md"
                              title="View PDF"
                            >
                              <Eye className="size-3.5" />
                              View PDF
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards view (omitted for brevity but recommended for responsive design) */}
              <div className="md:hidden space-y-3 p-4">
                {formattedItems.map((item) => (
                    <div key={item.id} className="p-4 border rounded-xl dark:border-slate-800">
                        <div className="flex justify-between items-start mb-2">
                            <span className="text-xs font-bold text-teal-600">{item.refNo}</span>
                            <span className="text-[10px] text-slate-400">{item.createdAtLabel}</span>
                        </div>
                        <p className="font-semibold text-sm mb-1">{item.issuedToName || "—"}</p>
                        <p className="text-xs text-slate-500 mb-3">{item.title}</p>
                        <button
                            onClick={() => handleViewPdf(item.id)}
                            className="w-full py-2 bg-teal-600 text-white rounded-lg text-xs font-medium"
                        >
                            View PDF
                        </button>
                    </div>
                ))}
              </div>

              <div className="border-t border-slate-100 px-5 py-3 dark:border-slate-800">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Showing {items.length} document{items.length !== 1 ? "s" : ""}
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

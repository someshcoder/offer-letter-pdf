"use client";

import { useMemo } from "react";

type PdfPreviewProps = {
  fileUrl: string;
};

/**
 * Chrome/Edge usually render PDFs reliably in an iframe. object/embed can show
 * a blank panel on some Windows setups.
 */
export default function PdfPreview({ fileUrl }: PdfPreviewProps) {
  const src = useMemo(() => {
    if (fileUrl.startsWith("blob:")) return fileUrl;
    const hash = "#view=FitH&toolbar=1";
    return fileUrl.includes("#") ? fileUrl : `${fileUrl}${hash}`;
  }, [fileUrl]);

  return (
    <div className="flex h-full min-h-[320px] flex-col rounded-2xl border border-slate-200/80 bg-slate-100/80 p-3 shadow-inner dark:border-slate-800 dark:bg-slate-950/60 sm:min-h-[480px] sm:p-4">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 sm:text-sm">
            PDF preview
          </h2>
          <p className="text-[11px] text-slate-500 dark:text-slate-500">
            Blank here? Use &quot;Open&quot; — some browsers block inline PDF.
          </p>
        </div>
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-indigo-500"
        >
          Open PDF
        </a>
      </div>

      <div className="relative min-h-[52vh] w-full flex-1 overflow-hidden rounded-xl bg-slate-300/30 dark:bg-slate-800/60 sm:min-h-[60vh] lg:min-h-[72vh]">
        <iframe
          key={src}
          title="PDF preview"
          src={src}
          className="absolute inset-0 h-full w-full rounded-lg border-0 bg-white"
        />
      </div>
    </div>
  );
}

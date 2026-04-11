import connectDB from "@/lib/mongodb";
import SavedPdf from "@/lib/models/SavedPdf";
import type { DashboardItem } from "@/lib/dashboardTypes";
import { normalizeDocumentKind } from "@/lib/formTypes";
import { DashboardClient } from "@/components/DashboardClient";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let items: DashboardItem[] = [];
  let error: string | null = null;

  if (!process.env.MONGODB_URI) {
    error = "Add MONGODB_URI to .env.local to enable the dashboard.";
  } else {
    try {
      await connectDB();
      const rows = await SavedPdf.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .select("-pdfBuffer")
        .lean();

      items = rows.map((r) => ({
        id: String(r._id),
        title: r.title,
        documentKind: normalizeDocumentKind(r.documentKind),
        refNo: r.form?.refNo,
        name: r.form?.name,
        createdAt:
          r.createdAt instanceof Date
            ? r.createdAt.toISOString()
            : String(r.createdAt),
        mailSentAt:
          r.mailSentAt instanceof Date
            ? r.mailSentAt.toISOString()
            : r.mailSentAt
              ? String(r.mailSentAt)
              : undefined,
        mailError: r.mailError || undefined,
        lastMailTo: r.lastMailTo || undefined,
      }));
    } catch {
      error = "Could not connect to MongoDB. Check MONGODB_URI and network.";
    }
  }

  return (
    <div className="min-h-screen flex-1 bg-gradient-to-b from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-8">
        <h1 className="mb-8 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Saved letters
        </h1>
        {error ? (
          <div className="rounded-xl border-2 border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
            {error}
          </div>
        ) : (
          <DashboardClient initialItems={items} />
        )}
      </div>
    </div>
  );
}

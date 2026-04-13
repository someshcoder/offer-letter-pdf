import connectDB, { getMongoIssue } from "@/lib/mongodb";
import SavedPdf from "@/lib/models/SavedPdf";
import type { DashboardItem } from "@/lib/dashboardTypes";
import { normalizeDocumentKind } from "@/lib/formTypes";
import { DashboardClient } from "@/components/DashboardClient";
import Employee from "@/models/Employee";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  let items: DashboardItem[] = [];
  let error: string | null = null;
  let employeeTotal = 0;
  const roleCounts = { Admin: 0, Employee: 0, TL: 0, HR: 0 };
  let recentEmployees: { id: string; name: string; role: string; designation: string }[] = [];

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
        storage: "remote",
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

      employeeTotal = await Employee.countDocuments();
      const roleRaw = await Employee.aggregate([
        { $group: { _id: "$accessRole", count: { $sum: 1 } } },
      ]);
      for (const row of roleRaw) {
        if (row._id in roleCounts) {
          roleCounts[row._id as keyof typeof roleCounts] = row.count;
        }
      }

      const recentRows = await Employee.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .lean();

      recentEmployees = recentRows.map((emp) => ({
        id: String(emp._id),
        name: emp.employeeName,
        role: emp.accessRole,
        designation: emp.designation,
      }));
    } catch (cause) {
      error = getMongoIssue(cause).message;
    }
  }

  return (
    <div className="min-h-screen flex-1 px-3 py-4 sm:px-5 sm:py-6 md:px-6 lg:px-7 xl:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5 sm:space-y-6">
        <header className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-white/80 p-6 shadow-sm backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/70 sm:p-8">
          <div
            className="pointer-events-none absolute inset-0 opacity-70 bg-[radial-gradient(circle_at_15%_10%,rgba(14,165,233,0.16),transparent_42%),radial-gradient(circle_at_80%_0%,rgba(99,102,241,0.14),transparent_38%)]"
            aria-hidden
          />
          <div className="relative z-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-700 dark:text-cyan-300">
              Performance Center
            </p>
            <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-white sm:text-3xl">
              Dashboard Overview
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
              Track letter generation, employee distribution, and recent activity from one place.
            </p>
          </div>
        </header>
        <DashboardClient
          initialItems={items}
          serverError={error}
          employeeTotal={employeeTotal}
          roleCounts={roleCounts}
          recentEmployees={recentEmployees}
        />
      </div>
    </div>
  );
}

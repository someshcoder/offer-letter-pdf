"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Calendar, CreditCard, Globe, Server, UserCircle } from "lucide-react";
import { Breadcrumb } from "@/components/modules/Breadcrumb";
import { StatusBadge } from "@/components/modules/ModuleCrudPage";
import { btnSecondary } from "@/components/ui/FormUi";

type ProjectDetail = {
  item: {
    _id: string;
    name: string;
    description?: string;
    budget?: number;
    status: string;
    completionPercent?: number;
  };
  client: {
    _id: string;
    name: string;
    email?: string;
    mobileNumber?: string;
    status?: string;
  } | null;
  domains: Array<{ _id: string; domainName: string; registrar?: string; expiryDate?: string; status?: string }>;
  payments: Array<{ _id: string; invoiceNumber?: string; paymentType?: string; totalAmount: number; paidAmount: number; dueAmount: number; status: string }>;
  maintenance: Array<{ _id: string; title: string; serviceType?: string; status: string; renewalDate?: string }>;
  milestones: Array<{ _id: string; title: string; status: string; deadline?: string }>;
  staff: Array<{ _id: string; employeeName?: string; role?: string }>;
  activities: Array<{ _id: string; action: string; details?: string; createdAt?: string }>;
};

function money(value?: number) {
  return `₹${(value || 0).toLocaleString()}`;
}

function date(value?: string) {
  return value ? new Date(value).toLocaleDateString() : "—";
}

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const [data, setData] = useState<ProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    fetch(`/api/projects/${params.id}`, { cache: "no-store" })
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Project load failed");
        return json as ProjectDetail;
      })
      .then((json) => {
        if (active) setData(json);
      })
      .catch((err) => {
        if (active) setError(err instanceof Error ? err.message : "Project load failed");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [params.id]);

  const paymentTotals = useMemo(() => {
    const payments = data?.payments || [];
    return payments.reduce(
      (acc, p) => ({
        total: acc.total + (p.totalAmount || 0),
        paid: acc.paid + (p.paidAmount || 0),
        due: acc.due + (p.dueAmount || 0),
      }),
      { total: 0, paid: 0, due: 0 },
    );
  }, [data]);

  if (loading) {
    return <div className="p-8 text-sm text-slate-500">Loading project...</div>;
  }

  if (error || !data) {
    return <div className="p-8 text-sm text-rose-600">{error || "Project not found"}</div>;
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/dashboard" },
            { label: "Projects & Delivery" },
            { label: "Projects", href: "/projects" },
            { label: data.item.name },
          ]}
        />

        <header className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Link href="/projects" className={btnSecondary}>
            <ArrowLeft className="size-4" />
            Back to Projects
          </Link>
          <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-cyan-600 dark:text-cyan-400">
                Connected Project
              </p>
              <h1 className="mt-1 text-3xl font-bold text-slate-900 dark:text-white">{data.item.name}</h1>
              <p className="mt-2 max-w-3xl text-sm text-slate-500 dark:text-slate-400">
                {data.item.description || "No project description added."}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status={data.item.status} />
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                Budget {money(data.item.budget)}
              </span>
            </div>
          </div>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <StatCard icon={<UserCircle className="size-5" />} label="Customer" value={data.client?.name || "—"} />
          <StatCard icon={<Globe className="size-5" />} label="Domains" value={String(data.domains.length)} />
          <StatCard icon={<CreditCard className="size-5" />} label="Due Amount" value={money(paymentTotals.due)} />
          <StatCard icon={<Server className="size-5" />} label="Maintenance" value={String(data.maintenance.length)} />
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Section title="Customer Details">
            <Detail label="Name" value={data.client?.name} />
            <Detail label="Mobile" value={data.client?.mobileNumber} />
            <Detail label="Email" value={data.client?.email} />
            <Detail label="Status" value={data.client?.status} />
          </Section>

          <Section title="Payment Summary">
            <Detail label="Total" value={money(paymentTotals.total)} />
            <Detail label="Paid" value={money(paymentTotals.paid)} positive />
            <Detail label="Due" value={money(paymentTotals.due)} negative={paymentTotals.due > 0} />
            <div className="mt-3 space-y-2">
              {data.payments.map((payment) => (
                <div key={payment._id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-semibold">{payment.invoiceNumber || payment.paymentType || "Payment"}</span>
                    <StatusBadge status={payment.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Total {money(payment.totalAmount)} · Paid {money(payment.paidAmount)} · Due {money(payment.dueAmount)}
                  </p>
                </div>
              ))}
              {data.payments.length === 0 && <Empty text="No payment linked yet." />}
            </div>
          </Section>

          <Section title="Domain Details">
            <div className="space-y-2">
              {data.domains.map((domain) => (
                <div key={domain._id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900 dark:text-white">{domain.domainName}</span>
                    {domain.status && <StatusBadge status={domain.status} />}
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    Registrar {domain.registrar || "—"} · Expiry {date(domain.expiryDate)}
                  </p>
                </div>
              ))}
              {data.domains.length === 0 && <Empty text="No domain linked yet." />}
            </div>
          </Section>

          <Section title="Maintenance">
            <div className="space-y-2">
              {data.maintenance.map((service) => (
                <div key={service._id} className="rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-semibold text-slate-900 dark:text-white">{service.title}</span>
                    <StatusBadge status={service.status} />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {service.serviceType || "Service"} · Renewal {date(service.renewalDate)}
                  </p>
                </div>
              ))}
              {data.maintenance.length === 0 && <Empty text="No maintenance linked yet." />}
            </div>
          </Section>
        </div>

        <Section title="Recent Customer Timeline">
          <div className="space-y-2">
            {data.activities.map((activity) => (
              <div key={activity._id} className="flex gap-3 rounded-xl border border-slate-100 p-3 dark:border-slate-800">
                <Calendar className="mt-0.5 size-4 text-cyan-500" />
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-white">{activity.details || activity.action}</p>
                  <p className="text-xs text-slate-500">{date(activity.createdAt)}</p>
                </div>
              </div>
            ))}
            {data.activities.length === 0 && <Empty text="No customer activity yet." />}
          </div>
        </Section>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-cyan-50 p-2 text-cyan-600 dark:bg-cyan-950/40 dark:text-cyan-300">{icon}</div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-1 text-lg font-bold text-slate-900 dark:text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
      <h2 className="mb-4 text-base font-bold text-slate-900 dark:text-white">{title}</h2>
      {children}
    </section>
  );
}

function Detail({
  label,
  value,
  positive,
  negative,
}: {
  label: string;
  value?: string;
  positive?: boolean;
  negative?: boolean;
}) {
  return (
    <div className="mb-2 flex items-center justify-between gap-4 rounded-xl bg-slate-50 px-3 py-2 dark:bg-slate-950/50">
      <span className="text-xs font-semibold text-slate-500">{label}</span>
      <span
        className={`text-sm font-bold ${
          positive
            ? "text-emerald-600 dark:text-emerald-400"
            : negative
              ? "text-rose-600 dark:text-rose-400"
              : "text-slate-900 dark:text-white"
        }`}
      >
        {value || "—"}
      </span>
    </div>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-xl bg-slate-50 p-4 text-center text-sm text-slate-500 dark:bg-slate-950/50">{text}</p>;
}

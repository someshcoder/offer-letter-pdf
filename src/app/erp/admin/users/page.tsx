import React from "react";
import { PageHeader, Card } from "@/components/erp/ui/Shared";
import { Users } from "lucide-react";
import connectDB from "@/lib/mongodb";
import ErpUser from "@/models/erp/ErpUser";

async function getErpUsers() {
  await connectDB();
  return await ErpUser.find({}).select("-passwordHash").sort({ createdAt: -1 });
}

export default async function AdminUsersPage() {
  const users = await getErpUsers();
  return (
    <div>
      <PageHeader title="System IAM" subtitle="Security accounts and cross-panel authorization governance." />
      <div className="grid gap-4">
        {users.map((u: any) => (
          <Card key={u._id.toString()} className="p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500"><Users size={16}/></div>
            <div className="flex-1">
              <p className="font-bold dark:text-white">{u.name}</p>
              <p className="text-xs text-slate-500">{u.email}</p>
            </div>
            <span className={`text-xs font-black px-3 py-1 rounded-full uppercase ${u.role === 'ADMIN' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.role}</span>
          </Card>
        ))}
      </div>
    </div>
  );
}

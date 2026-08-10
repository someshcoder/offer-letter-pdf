import { NextResponse } from "next/server";
import connectDB from "@/lib/mongodb";
import { handleApiError } from "@/lib/apiResponse";
import { requireModuleAuth } from "@/lib/modules/apiHelpers";
import Client from "@/models/Client";
import Employee from "@/models/Employee";
import Project from "@/models/modules/Project";
import MarketingPayment, { PaymentHistory } from "@/models/modules/MarketingPayment";
import SalaryRecord from "@/models/modules/SalaryRecord";
import StaffExpense from "@/models/modules/StaffExpense";
import OfficeExpense from "@/models/modules/OfficeExpense";

type IdMap = Record<string, string>;

function key(id: unknown) {
  return String(id || "");
}

function dateValue(row: { paidAt?: Date; paymentDate?: Date; expenseDate?: Date; createdAt?: Date }) {
  return row.paidAt || row.paymentDate || row.expenseDate || row.createdAt || null;
}

export async function GET(request: Request) {
  const auth = await requireModuleAuth("payment");
  if ("error" in auth) return auth.error;

  try {
    await connectDB();
    const url = new URL(request.url);
    const clientId = url.searchParams.get("clientId");
    const projectId = url.searchParams.get("projectId");
    const employeeId = url.searchParams.get("employeeId");

    const paymentFilter: Record<string, unknown> = { deletedAt: null };
    if (clientId) paymentFilter.clientId = clientId;
    if (projectId) paymentFilter.projectId = projectId;

    const salaryFilter: Record<string, unknown> = { deletedAt: null };
    const expenseFilter: Record<string, unknown> = { deletedAt: null };
    if (employeeId) {
      salaryFilter.employeeId = employeeId;
      expenseFilter.employeeId = employeeId;
    }

    const [payments, salaries, staffExpenses, officeExpenses, clients, projects, employees] = await Promise.all([
      MarketingPayment.find(paymentFilter).sort({ createdAt: -1 }).lean(),
      SalaryRecord.find(salaryFilter).sort({ createdAt: -1 }).lean(),
      StaffExpense.find(expenseFilter).sort({ expenseDate: -1 }).lean(),
      OfficeExpense.find({ deletedAt: null }).sort({ expenseDate: -1 }).lean(),
      Client.find({ deletedAt: null }).select("name mobileNumber email").lean(),
      Project.find({ deletedAt: null }).select("name clientId").lean(),
      Employee.find({}).select("employeeName email designation").lean(),
    ]);

    const clientNames: IdMap = Object.fromEntries(clients.map((c) => [key(c._id), c.name]));
    const projectNames: IdMap = Object.fromEntries(projects.map((p) => [key(p._id), p.name]));
    const employeeNames: IdMap = Object.fromEntries(employees.map((e) => [key(e._id), e.employeeName]));

    const paymentIds = payments.map((p) => p._id);
    const histories = await PaymentHistory.find({ paymentId: { $in: paymentIds } })
      .sort({ paidAt: -1 })
      .lean();

    const historyByPayment = histories.reduce<Record<string, typeof histories>>((acc, history) => {
      const id = key(history.paymentId);
      if (!acc[id]) acc[id] = [];
      acc[id].push(history);
      return acc;
    }, {});

    const invoices = payments.map((payment) => {
      const historiesForPayment = historyByPayment[key(payment._id)] || [];
      const paymentCount = historiesForPayment.length || (payment.paidAmount > 0 ? 1 : 0);
      return {
        id: key(payment._id),
        clientId: key(payment.clientId),
        clientName: clientNames[key(payment.clientId)] || "Unknown customer",
        projectId: key(payment.projectId),
        projectName: projectNames[key(payment.projectId)] || "No project",
        invoiceNumber: payment.invoiceNumber || "",
        paymentType: payment.paymentType,
        totalAmount: payment.totalAmount || 0,
        paidAmount: payment.paidAmount || 0,
        dueAmount: payment.dueAmount || 0,
        status: payment.status,
        dueDate: payment.dueDate,
        paymentCount,
        createdAt: payment.createdAt,
      };
    });

    const incomingTransactions = histories.map((history) => {
      const payment = payments.find((p) => key(p._id) === key(history.paymentId));
      return {
        id: key(history._id),
        paymentId: key(history.paymentId),
        clientName: payment ? clientNames[key(payment.clientId)] || "Unknown customer" : "Unknown customer",
        projectName: payment ? projectNames[key(payment.projectId)] || "No project" : "No project",
        invoiceNumber: payment?.invoiceNumber || "",
        amount: history.amount || 0,
        mode: history.paymentMode,
        transactionRef: history.transactionRef,
        paidAt: history.paidAt,
        notes: history.notes,
      };
    });

    for (const payment of payments) {
      if ((historyByPayment[key(payment._id)] || []).length === 0 && payment.paidAmount > 0) {
        incomingTransactions.push({
          id: `${key(payment._id)}-initial`,
          paymentId: key(payment._id),
          clientName: clientNames[key(payment.clientId)] || "Unknown customer",
          projectName: projectNames[key(payment.projectId)] || "No project",
          invoiceNumber: payment.invoiceNumber || "",
          amount: payment.paidAmount || 0,
          mode: "Recorded",
          transactionRef: "",
          paidAt: payment.createdAt,
          notes: "Initial paid amount",
        });
      }
    }

    incomingTransactions.sort((a, b) => {
      const ad = new Date(a.paidAt || 0).getTime();
      const bd = new Date(b.paidAt || 0).getTime();
      return bd - ad;
    });

    const outgoingTransactions = [
      ...salaries.map((salary) => ({
        id: key(salary._id),
        type: "Salary",
        employeeId: key(salary.employeeId),
        employeeName: salary.employeeName || employeeNames[key(salary.employeeId)] || "Unknown employee",
        amount: salary.netSalary || 0,
        status: salary.status,
        date: dateValue(salary),
        description: `${salary.month}/${salary.year} salary`,
      })),
      ...staffExpenses.map((expense) => ({
        id: key(expense._id),
        type: "Staff Expense",
        employeeId: key(expense.employeeId),
        employeeName: expense.employeeName || employeeNames[key(expense.employeeId)] || "Unknown employee",
        amount: expense.amount || 0,
        status: expense.status,
        date: dateValue(expense),
        description: `${expense.category} expense`,
      })),
      ...officeExpenses.map((expense) => ({
        id: key(expense._id),
        type: "Office Expense",
        employeeId: "",
        employeeName: expense.title || expense.category || "Office",
        amount: expense.amount || 0,
        status: "Paid",
        date: dateValue(expense),
        description: `${expense.category}${expense.vendor ? ` · ${expense.vendor}` : ""}`,
      })),
    ].sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

    const totalExpected = invoices.reduce((sum, row) => sum + row.totalAmount, 0);
    const totalReceived = invoices.reduce((sum, row) => sum + row.paidAmount, 0);
    const totalDue = invoices.reduce((sum, row) => sum + row.dueAmount, 0);
    const outgoingPaid = outgoingTransactions
      .filter((row) => row.status === "Paid")
      .reduce((sum, row) => sum + row.amount, 0);
    const outgoingPending = outgoingTransactions
      .filter((row) => row.status !== "Paid" && row.status !== "Rejected" && row.status !== "Cancelled")
      .reduce((sum, row) => sum + row.amount, 0);

    return NextResponse.json({
      stats: {
        totalExpected,
        totalReceived,
        totalDue,
        incomingCount: incomingTransactions.length,
        outgoingPaid,
        outgoingPending,
        netCash: totalReceived - outgoingPaid,
      },
      invoices,
      incomingTransactions,
      outgoingTransactions,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

import Client from "@/models/Client";

/** Customer IDs assigned to this sales employee */
export async function getEmployeeClientIds(userId: string): Promise<string[]> {
  const clients = await Client.find({
    assignedStaffId: userId,
    deletedAt: null,
  })
    .select("_id")
    .lean();
  return clients.map((c) => String(c._id));
}

export async function employeeOwnsClient(
  userId: string,
  clientId: string,
): Promise<boolean> {
  if (!clientId) return false;
  const client = await Client.findOne({
    _id: clientId,
    assignedStaffId: userId,
    deletedAt: null,
  })
    .select("_id")
    .lean();
  return Boolean(client);
}

import { fetchJsonCached } from "@/lib/clientDataCache";

export type CustomerProject = { _id: string; name: string };

export async function loadCustomerProject(clientId: string): Promise<CustomerProject | null> {
  const data = await fetchJsonCached<{ items?: CustomerProject[] }>(
    `/api/projects?clientId=${clientId}&limit=1&sortBy=createdAt&sortOrder=desc`,
  );
  return data.items?.[0] ?? null;
}

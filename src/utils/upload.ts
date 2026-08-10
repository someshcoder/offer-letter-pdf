import { randomUUID } from "crypto";
import type { UploadedFileMeta } from "@/types/employee";
import connectDB from "@/lib/mongodb";
import Upload from "@/models/Upload";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function saveUploadedFile(
  file: File,
  employeeId: string,
  field: string,
): Promise<UploadedFileMeta> {
  await connectDB();

  const safeName = sanitizeFileName(file.name || "document.bin");
  const storedName = `${field}-${Date.now()}-${randomUUID()}-${safeName}`;

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const newUpload = await Upload.create({
    fileName: storedName,
    originalName: file.name || "document.bin",
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    data: buffer,
  });

  return {
    fileName: storedName,
    originalName: file.name,
    mimeType: file.type || "application/octet-stream",
    size: file.size,
    url: `/api/files/${newUpload._id}`,
    uploadedAt: new Date().toISOString(),
  };
}

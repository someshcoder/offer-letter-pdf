import type { DashboardItem, LocalDashboardItem } from "./dashboardTypes";
import {
  normalizeDocumentKind,
  type DocumentKind,
  type FormFields,
} from "./formTypes";

const STORAGE_KEY = "offer-letter-local-pdfs:v1";
const MAX_LOCAL_RECORDS = 25;

type SaveLocalPdfInput = {
  form: FormFields;
  documentKind: DocumentKind;
  pdfBytes: Uint8Array;
};

function canUseLocalStorage(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function buildTitle(form: FormFields): string {
  return (
    [form.refNo, form.name].filter(Boolean).join(" · ") ||
    `PDF ${new Date().toISOString().slice(0, 10)}`
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function base64ToBytes(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function sanitizeStoredItem(value: unknown): LocalDashboardItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  if (
    typeof candidate.id !== "string" ||
    typeof candidate.title !== "string" ||
    typeof candidate.createdAt !== "string" ||
    typeof candidate.pdfBase64 !== "string"
  ) {
    return null;
  }

  return {
    id: candidate.id,
    title: candidate.title,
    documentKind: normalizeDocumentKind(candidate.documentKind),
    storage: "local",
    refNo: typeof candidate.refNo === "string" ? candidate.refNo : undefined,
    name: typeof candidate.name === "string" ? candidate.name : undefined,
    createdAt: candidate.createdAt,
    mailSentAt:
      typeof candidate.mailSentAt === "string" ? candidate.mailSentAt : undefined,
    mailError: typeof candidate.mailError === "string" ? candidate.mailError : undefined,
    lastMailTo:
      typeof candidate.lastMailTo === "string" ? candidate.lastMailTo : undefined,
    pdfBase64: candidate.pdfBase64,
  };
}

function readStoredItems(): LocalDashboardItem[] {
  if (!canUseLocalStorage()) {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map(sanitizeStoredItem)
      .filter((item): item is LocalDashboardItem => item !== null)
      .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt));
  } catch {
    return [];
  }
}

function writeStoredItems(items: LocalDashboardItem[]): void {
  if (!canUseLocalStorage()) {
    return;
  }

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items.slice(0, MAX_LOCAL_RECORDS)),
  );
}

function makeBlobUrl(item: LocalDashboardItem): string {
  const bytes = base64ToBytes(item.pdfBase64);
  const blobBuffer = new Uint8Array(bytes.byteLength);
  blobBuffer.set(bytes);
  const blob = new Blob([blobBuffer.buffer], { type: "application/pdf" });
  return URL.createObjectURL(blob);
}

export function readLocalSavedPdfs(): LocalDashboardItem[] {
  return readStoredItems();
}

export function savePdfLocally({
  form,
  documentKind,
  pdfBytes,
}: SaveLocalPdfInput): LocalDashboardItem {
  const item: LocalDashboardItem = {
    id:
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `local-${crypto.randomUUID()}`
        : `local-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    title: buildTitle(form).slice(0, 200),
    documentKind,
    storage: "local",
    refNo: form.refNo.trim() || undefined,
    name: form.name.trim() || undefined,
    createdAt: new Date().toISOString(),
    pdfBase64: bytesToBase64(pdfBytes),
  };

  const nextItems = [item, ...readStoredItems()];
  writeStoredItems(nextItems);
  return item;
}

export function downloadLocalSavedPdf(item: LocalDashboardItem): void {
  const url = makeBlobUrl(item);
  const anchor = document.createElement("a");

  anchor.href = url;
  anchor.download = `${item.title.replace(/[^\w\s.-]+/g, "_").slice(0, 80) || "document"}.pdf`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function openLocalSavedPdf(item: LocalDashboardItem): void {
  const url = makeBlobUrl(item);
  window.open(url, "_blank", "noopener,noreferrer");
  window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function mergeDashboardItems(
  remoteItems: DashboardItem[],
  localItems: LocalDashboardItem[],
): DashboardItem[] {
  return [...localItems, ...remoteItems].sort(
    (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
  );
}
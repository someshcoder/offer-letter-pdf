export type DocumentKind = "offer" | "internship" | "other";

export const DOCUMENT_KIND_LABELS: Record<DocumentKind, string> = {
  offer: "Offer letter",
  internship: "Internship letter",
  other: "Other",
};

export type FormFields = {
  refNo: string;
  offerAsOn: string;
  month: string;
  name: string;
  address: string;
  subject: string;
  salary: string;
  email: string;
  mobile: string;
};

export const EMPTY_FORM: FormFields = {
  refNo: "",
  offerAsOn: "",
  month: "",
  name: "",
  address: "",
  subject: "",
  salary: "",
  email: "",
  mobile: "",
};

export type OverlayOptions = {
  offsetX: number;
  offsetY: number;
};

export function normalizeDocumentKind(v: unknown): DocumentKind {
  if (v === "internship" || v === "other" || v === "offer") return v;
  return "offer";
}

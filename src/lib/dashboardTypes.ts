import type { DocumentKind } from "./formTypes";

export type DashboardItem = {
  id: string;
  title: string;
  documentKind: DocumentKind;
  refNo?: string;
  name?: string;
  createdAt: string;
  mailSentAt?: string;
  mailError?: string;
  lastMailTo?: string;
};

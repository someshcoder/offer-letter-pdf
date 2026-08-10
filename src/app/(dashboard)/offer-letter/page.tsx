"use client";

import { OfferLetterClient } from "@/components/OfferLetterClient";
import { useAuth } from "@/components/AuthProvider";

export default function OfferLetterPage() {
  const { user } = useAuth();
  return <OfferLetterClient userRole={user?.role ?? null} />;
}

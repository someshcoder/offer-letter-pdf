/**
 * Normalize Mongoose / BSON stored PDF bytes to a Node Buffer for nodemailer.
 */
export function documentPdfToBuffer(raw: unknown): Buffer {
  if (Buffer.isBuffer(raw)) return raw;
  if (raw instanceof Uint8Array) return Buffer.from(raw);

  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    if (o.buffer instanceof ArrayBuffer) {
      return Buffer.from(o.buffer);
    }
    if (typeof o.value === "function") {
      try {
        const v = (o.value as () => unknown)();
        if (Buffer.isBuffer(v)) return v;
      } catch {
        /* ignore */
      }
    }
  }

  throw new Error("Stored PDF buffer could not be read. Try saving the document again.");
}

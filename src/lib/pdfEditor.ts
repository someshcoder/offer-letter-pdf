import {
  PDFDocument,
  StandardFonts,
  rgb,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type { FormFields, OverlayOptions } from "./formTypes";

const BODY = 11;
const NARROW = 10;
const PAGE3_SAFE_Y = 643;

function whiteout(
  page: PDFPage,
  x: number,
  yBaseline: number,
  width: number,
  fontSize: number,
): void {
  const descenderPad = 2.5;
  const ascender = fontSize * 0.85;
  page.drawRectangle({
    x: x - 2,
    y: yBaseline - descenderPad,
    width,
    height: ascender + descenderPad,
    color: rgb(1, 1, 1),
    borderWidth: 0,
  });
}

function drawLine(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  yBaseline: number,
  size: number,
  coverWidth: number,
): void {
  whiteout(page, x, yBaseline, coverWidth, size);
  page.drawText(text, { x, y: yBaseline, size, font, color: rgb(0, 0, 0) });
}

function wrapToWidth(
  font: PDFFont,
  text: string,
  size: number,
  maxWidth: number,
  maxLines: number,
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let idx = 0;

  while (idx < words.length && lines.length < maxLines) {
    let line = words[idx] as string;
    idx += 1;
    while (idx < words.length) {
      const next = `${line} ${words[idx]}`;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        line = next;
        idx += 1;
      } else break;
    }
    lines.push(line);
  }

  if (idx < words.length && lines.length > 0) {
    let last = lines[lines.length - 1] ?? "";
    const ell = "…";
    while (
      last.length > 0 &&
      font.widthOfTextAtSize(last + ell, size) > maxWidth
    ) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = last + ell;
  }

  return lines.length > 0 ? lines : [text];
}

/** Keep `prefix` on line 1; only `suffix` may continue on further lines. */
function wrapAfterFixedPrefix(
  font: PDFFont,
  prefix: string,
  suffix: string,
  size: number,
  maxWidth: number,
  maxLines: number,
): string[] {
  const suffixNorm = suffix.replace(/\s+/g, " ").trim();
  const words = suffixNorm ? suffixNorm.split(/\s+/).filter(Boolean) : [];
  const wPrefix = font.widthOfTextAtSize(prefix, size);

  if (wPrefix > maxWidth) {
    return wrapToWidth(font, `${prefix}${suffixNorm}`, size, maxWidth, maxLines);
  }

  if (words.length === 0) {
    return [prefix];
  }

  const lines: string[] = [];
  let line = prefix;
  let wi = 0;

  while (wi < words.length) {
    const cand =
      line === prefix ? `${prefix}${words[wi]}` : `${line} ${words[wi]}`;
    if (font.widthOfTextAtSize(cand, size) <= maxWidth) {
      line = cand;
      wi += 1;
    } else {
      break;
    }
  }

  if (wi === 0) {
    lines.push(prefix);
  } else {
    lines.push(line);
  }

  while (wi < words.length && lines.length < maxLines) {
    let ln2 = words[wi] as string;
    wi += 1;
    while (wi < words.length) {
      const next = `${ln2} ${words[wi]}`;
      if (font.widthOfTextAtSize(next, size) <= maxWidth) {
        ln2 = next;
        wi += 1;
      } else {
        break;
      }
    }
    lines.push(ln2);
  }

  if (wi < words.length && lines.length > 0) {
    let last = lines[lines.length - 1] ?? "";
    const ell = "…";
    while (
      last.length > 0 &&
      font.widthOfTextAtSize(last + ell, size) > maxWidth
    ) {
      last = last.slice(0, -1);
    }
    lines[lines.length - 1] = last + ell;
  }

  return lines.length > 0 ? lines : [prefix];
}

const OFFER_SALARY_MIN_PTS = 7;

type OfferDrawLine = { text: string; size: number };

/** Always append salary on the same line as the offer-as-on tail (never a new line below). */
function appendSalarySameLine(
  font: PDFFont,
  lines: string[],
  salaryLine: string,
  maxWidth: number,
  bodySize: number,
): OfferDrawLine[] {
  const tailNorm = salaryLine.replace(/\s+/g, " ").trim();
  const out: OfferDrawLine[] = lines.map((text) => ({ text, size: bodySize }));

  if (!tailNorm) {
    return out;
  }
  if (out.length === 0) {
    return wrapToWidth(font, tailNorm, bodySize, maxWidth, 6).map((text) => ({
      text,
      size: bodySize,
    }));
  }

  const last = out[out.length - 1]?.text ?? "";
  const glue = last.endsWith(" ") ? "" : " ";
  const merged = `${last}${glue}${tailNorm}`;

  let size = bodySize;
  while (
    size > OFFER_SALARY_MIN_PTS &&
    font.widthOfTextAtSize(merged, size) > maxWidth
  ) {
    size -= 0.25;
  }

  if (font.widthOfTextAtSize(merged, size) <= maxWidth) {
    out[out.length - 1] = { text: merged, size };
    return out;
  }

  let trimmed = merged;
  const ell = "…";
  while (
    trimmed.length > 0 &&
    font.widthOfTextAtSize(trimmed + ell, OFFER_SALARY_MIN_PTS) > maxWidth
  ) {
    trimmed = trimmed.slice(0, -1);
  }
  out[out.length - 1] = {
    text: trimmed + ell,
    size: OFFER_SALARY_MIN_PTS,
  };
  return out;
}

function drawAddressSafe(
  page: PDFPage,
  font: PDFFont,
  address: string,
  x: number,
  yFirstBaseline: number,
  size: number,
  maxWidth: number,
): void {
  const oneLine = `Address – ${address.replace(/\r\n/g, " ").replace(/\s+/g, " ").trim()}`;
  const lineHeight = size * 1.12;
  let lines = wrapToWidth(font, oneLine, size, maxWidth, 2);
  let lastBaseline = yFirstBaseline - (lines.length - 1) * lineHeight;
  if (lastBaseline < PAGE3_SAFE_Y) {
    lines = wrapToWidth(font, oneLine, size, maxWidth, 1);
    lastBaseline = yFirstBaseline;
  }

  const desc = 2.5;
  const asc = size * 0.85;
  const yBottom = Math.max(PAGE3_SAFE_Y - 1, lastBaseline - desc);
  const yTopUncapped = yFirstBaseline + asc + 3;
  const yTop = Math.min(yTopUncapped, 676.5);
  page.drawRectangle({
    x: x - 2,
    y: yBottom,
    width: maxWidth + 4,
    height: yTop - yBottom,
    color: rgb(1, 1, 1),
    borderWidth: 0,
  });

  let yy = yFirstBaseline;
  for (const ln of lines) {
    page.drawText(ln, { x, y: yy, size, font, color: rgb(0, 0, 0) });
    yy -= lineHeight;
  }
}

function drawInline(
  page: PDFPage,
  font: PDFFont,
  text: string,
  x: number,
  yBaseline: number,
  size: number,
  coverWidth: number,
): void {
  whiteout(page, x, yBaseline, coverWidth, size);
  page.drawText(text, { x, y: yBaseline, size, font, color: rgb(0, 0, 0) });
}

async function applyFormToPdf(
  doc: PDFDocument,
  data: FormFields,
  options: OverlayOptions,
): Promise<void> {
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const pages = doc.getPages();
  const ox = options.offsetX;
  const oy = options.offsetY;

  const page2 = pages[1];
  const page3 = pages[2];
  const page5 = pages[4];

  if (!page2 || !page3 || !page5) {
    throw new Error("Template must have at least 5 pages (offer letter format).");
  }

  const ref = data.refNo?.trim();
  if (ref) {
    drawLine(page2, font, `REF NO: ${ref}`, 26.4 + ox, 693.2 + oy, BODY, 520);
  }

  const name = data.name?.trim();
  if (name) {
    drawLine(page3, font, `Name – ${name}`, 49.6 + ox, 678.1 + oy, BODY, 520);
    drawLine(page3, font, `Dear, ${name}`, 49.6 + ox, 622.9 + oy, BODY, 520);
    drawInline(page5, font, name, 90.5 + ox, 324.4 + oy, BODY, 220);
  }

  const address = data.address?.trim();
  if (address) {
    drawAddressSafe(page3, font, address, 49.6 + ox, 664.3 + oy, BODY, 500);
  }

  const subject = data.subject?.trim();
  if (subject) {
    drawLine(page3, font, `SUB: ${subject}`, 49.6 + ox, 595.3 + oy, BODY, 520);
  }

  const offerAsOn = data.offerAsOn?.trim() || "";
  const salary = data.salary?.trim() || "";
  const month = data.month?.trim() || "";

  const offerX = 49.6 + ox;
  const offerTopBaseline = 568.4 + oy;
  const offerMaxWidth = 500;
  const offerLineHeight = BODY * 1.12;
  const offerPrefix =
    "This has reference to your application for employment, the Company is pleased to offer you as on ";
  const offerLines = wrapAfterFixedPrefix(
    font,
    offerPrefix,
    offerAsOn,
    BODY,
    offerMaxWidth,
    6,
  );
  const salaryLine = `On Salary of Rs – ${salary}/- for ${month} month and there after depend on Performance with effect.`;
  const blockLines = appendSalarySameLine(
    font,
    offerLines,
    salaryLine,
    offerMaxWidth,
    BODY,
  );

  const desc = 3;
  const asc = BODY * 0.85;
  const lastBaseline =
    offerTopBaseline - (blockLines.length - 1) * offerLineHeight;
  const blockTop = offerTopBaseline + asc + 2;
  const blockBottom = lastBaseline - desc;
  page3.drawRectangle({
    x: 40 + ox,
    y: blockBottom,
    width: 550,
    height: blockTop - blockBottom,
    color: rgb(1, 1, 1),
    borderWidth: 0,
  });

  let offerY = offerTopBaseline;
  for (const { text, size } of blockLines) {
    page3.drawText(text, {
      x: offerX,
      y: offerY,
      size,
      font,
      color: rgb(0, 0, 0),
    });
    offerY -= offerLineHeight;
  }

  const email = data.email?.trim();
  if (email) {
    drawInline(page5, font, email, 89.1 + ox, 311.9 + oy, NARROW, 340);
  }

  const mobile = data.mobile?.trim();
  if (mobile) {
    const line =
      mobile.startsWith("+") || mobile.startsWith("91")
        ? mobile
        : `+91-${mobile}`;
    drawInline(page5, font, line, 91.9 + ox, 299.5 + oy, NARROW, 260);
  }
}

/** Server / Node: pass raw template bytes (no fetch). */
export async function buildEditedPdfFromBytes(
  templateBytes: ArrayBuffer | Uint8Array,
  data: FormFields,
  options: OverlayOptions,
): Promise<Uint8Array> {
  const bytes =
    templateBytes instanceof Uint8Array
      ? templateBytes
      : new Uint8Array(templateBytes);
  const doc = await PDFDocument.load(bytes);
  await applyFormToPdf(doc, data, options);
  return doc.save();
}

/** Browser: load template from public URL. */
export async function buildEditedPdf(
  templateUrl: string,
  data: FormFields,
  options: OverlayOptions,
): Promise<Uint8Array> {
  const response = await fetch(templateUrl);
  if (!response.ok) {
    throw new Error(`Failed to load PDF template (${response.status})`);
  }
  const buf = await response.arrayBuffer();
  return buildEditedPdfFromBytes(buf, data, options);
}

export function pdfUint8ToBlob(bytes: Uint8Array): Blob {
  const copy = new Uint8Array(bytes.byteLength);
  copy.set(bytes);
  return new Blob([copy], { type: "application/pdf" });
}

export function downloadPdfBytes(bytes: Uint8Array, filename: string): void {
  const blob = pdfUint8ToBlob(bytes);
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.rel = "noopener";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

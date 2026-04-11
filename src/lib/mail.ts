export function isMailConfigured(): boolean {
  return false;
}

export function getSmtpSetupHint(): string {
  return "Server-side SMTP/Nodemailer email sending is disabled in this project.";
}

export async function sendPdfAttachment(opts: {
  to: string;
  subject: string;
  pdfBuffer: Buffer;
  filename: string;
}): Promise<void> {
  void opts;
  throw new Error(getSmtpSetupHint());
}

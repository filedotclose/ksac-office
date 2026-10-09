import nodemailer from "nodemailer";

export interface SendDepartmentEmailInput {
  recipientEmail: string;
  ccEmails?: string[];
  subject: string;
  bodyText: string;
  bodyHtml: string;
  /**
   * Display name shown in email clients (defaults to "Office of the Dean, KSAC")
   */
  senderDisplayName?: string;
  /**
   * Institutional address representing the authority (defaults to KSAC_OFFICIAL_SMTP_EMAIL or "ksac.office@kiit.ac.in")
   */
  officialSenderEmail?: string;
  /**
   * Direct reply-to destination for department responses (defaults to Dean's institutional address)
   */
  replyToEmail?: string;
}

export interface ResolvedMailerHeaders {
  from: string;
  replyTo: string;
  to: string;
  cc: string[];
  subject: string;
}

/**
 * Normalizes, strips CRLF injection attempts (CWE-93), and resolves authoritative
 * institutional headers for Dean KSAC communications.
 */
export function resolveMailerHeaders(input: SendDepartmentEmailInput): ResolvedMailerHeaders {
  const sanitizeHeaderVal = (val: string, stripChars = /[\r\n]/g): string =>
    (val || "").replace(stripChars, " ").replace(/\s+/g, " ").trim();

  // Strip CRLF and angle brackets from display name to prevent boundary breakage
  const rawDisplayName =
    input.senderDisplayName ||
    process.env.KSAC_SMTP_DISPLAY_NAME ||
    "Office of the Dean, KSAC";
  const safeDisplayName = rawDisplayName.replace(/[\r\n"<>]/g, " ").replace(/\s+/g, " ").trim();

  // Strip CRLF and angle brackets from email addresses
  const rawOfficialSender =
    input.officialSenderEmail ||
    process.env.KSAC_OFFICIAL_SMTP_EMAIL ||
    "ksac.office@kiit.ac.in";
  const safeOfficialSender = rawOfficialSender.replace(/[\r\n"<>]/g, "").trim();

  const rawReplyTo =
    input.replyToEmail ||
    process.env.DEAN_REPLYTO_EMAIL ||
    "deanksac@kiit.ac.in";
  const safeReplyTo = rawReplyTo.replace(/[\r\n"<>]/g, "").trim();

  const safeRecipient = (input.recipientEmail || "").replace(/[\r\n]/g, "").trim();
  const safeSubject = sanitizeHeaderVal(input.subject);
  const safeCc = (input.ccEmails || [])
    .map((e) => e.replace(/[\r\n]/g, "").trim())
    .filter(Boolean);

  return {
    from: `"${safeDisplayName}" <${safeOfficialSender}>`,
    replyTo: safeReplyTo,
    to: safeRecipient,
    cc: safeCc,
    subject: safeSubject,
  };
}

/**
 * Dispatches a department requirement email via SMTP (Nodemailer) representing
 * the institutional authority of the Office of the Dean, KSAC.
 *
 * SMTP transport authentication is completely decoupled from the visible From/Reply-To
 * headers:
 * - Transport Auth: KSAC_SMTP_USER || SMTP_EMAIL
 * - Transport Pass: KSAC_SMTP_PASSWORD || SMTP_PASSWORD
 * - Header From: "Office of the Dean, KSAC" <ksac.office@kiit.ac.in> (or configured)
 * - Header Reply-To: deanksac@kiit.ac.in (or active Dean session email)
 */
export async function sendDepartmentRequirementEmail(
  input: SendDepartmentEmailInput
): Promise<{
  sent: boolean;
  simulated?: boolean;
  from?: string;
  replyTo?: string;
  error?: string;
}> {
  const headers = resolveMailerHeaders(input);

  if (!headers.to || !headers.to.includes("@")) {
    return {
      sent: false,
      from: headers.from,
      replyTo: headers.replyTo,
      error: "Invalid recipient email address.",
    };
  }

  // Decoupled SMTP authentication credentials
  const smtpUser = process.env.KSAC_SMTP_USER || process.env.SMTP_EMAIL;
  const smtpPass = process.env.KSAC_SMTP_PASSWORD || process.env.SMTP_PASSWORD;

  // If SMTP credentials are not configured in local environment, simulate gracefully
  if (!smtpUser || !smtpPass) {
    console.warn(
      `[KSAC Mailer] SMTP credentials not configured; simulated email dispatch from ${headers.from} (Reply-To: ${headers.replyTo}) to ${headers.to}`
    );
    return {
      sent: true,
      simulated: true,
      from: headers.from,
      replyTo: headers.replyTo,
    };
  }

  try {
    const transporter = process.env.SMTP_HOST
      ? nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: process.env.SMTP_SECURE === "true",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        })
      : nodemailer.createTransport({
          service: "gmail",
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });

    await transporter.sendMail({
      from: headers.from,
      replyTo: headers.replyTo,
      to: headers.to,
      cc: headers.cc.length > 0 ? headers.cc.join(", ") : undefined,
      subject: headers.subject,
      text: input.bodyText,
      html: input.bodyHtml,
    });

    return {
      sent: true,
      simulated: false,
      from: headers.from,
      replyTo: headers.replyTo,
    };
  } catch (err: any) {
    console.error("[KSAC Mailer] Error sending department email:", err);
    return {
      sent: false,
      from: headers.from,
      replyTo: headers.replyTo,
      error: err?.message || "SMTP delivery failed",
    };
  }
}

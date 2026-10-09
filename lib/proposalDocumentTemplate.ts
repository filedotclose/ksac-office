import {
  formatIndianCurrency,
  numberToIndianRupeeWords,
} from "@/lib/eventProposalPresets";
import {
  KIIT_LOGO_BASE64,
  KSAC_LOGO_BASE64,
  KSAC_BANNER_WIDE_BASE64,
} from "@/lib/documentAssets";

export interface ProposalDocumentOptions {
  useWideBannerHeader?: boolean;
  autoPrint?: boolean;
}

/**
 * Generates an official, publication-quality A4 HTML document string matching
 * the official KIIT DU and KSAC reference documents.
 *
 * Designed for 100% Vercel serverless and client-side compatibility:
 * - Uses inline base64 logos (zero network dependency, zero broken images).
 * - Supports custom Society Logo embedded directly in letterhead headers.
 * - Exact formal typography: Arial uppercase letterhead headers, Times New Roman body.
 * - Clean 1px solid black bordered tables with proper column widths.
 * - Dedicated Independent Budget Page with Signatories strictly on the same page.
 */
export function generateProposalDocumentHtml(
  proposal: any,
  options: ProposalDocumentOptions = {}
): string {
  if (!proposal) return "";

  const useWideBannerHeader = Boolean(options.useWideBannerHeader);
  const autoPrint = Boolean(options.autoPrint);

  const enabled: string[] = Array.isArray(proposal.enabledSections)
    ? proposal.enabledSections
    : ["SUB_EVENTS", "GUIDELINES", "BUDGET", "VENUE", "TECHNICAL", "MARKETING", "SECURITY", "FELICITATION", "SPONSORS"];

  const signatories: any[] = Array.isArray(proposal.signatories) ? proposal.signatories : [];
  const notesheetSignatories = signatories.filter(
    (s) => s.location === "NOTESHEET" || s.location === "BOTH"
  );
  const footerSignatories = signatories.filter(
    (s) => s.location === "FOOTER" || s.location === "BOTH"
  );

  const budgetTotal = Number(proposal.budgetTotal) || 0;
  const budgetWords = proposal.budgetInWords || numberToIndianRupeeWords(budgetTotal);
  const revenueTotal = Number(proposal.revenueTotal) || 0;

  const recipientLines = String(
    proposal.notesheetRecipient || "The Pro-Vice Chancellor (Admin)-cum-Registrar\nKIIT-DU"
  )
    .split(/\r?\n|,/)
    .map((s: string) => s.trim())
    .filter(Boolean);

  let sectionCounter = 1;

  const societyLogoUrl = proposal.societyLogo?.dataUrl || "";

  // Header HTML generator supporting Society Logo
  const renderHeader = () => {
    if (useWideBannerHeader) {
      return `
      <div class="ksac-banner-header">
        <img src="${KSAC_BANNER_WIDE_BASE64}" alt="KIIT Student Activity Centre" class="ksac-banner-img" />
      </div>
      <div class="ksac-header-rule"></div>`;
    }

    return `
    <div class="ksac-letterhead-header">
      <div class="ksac-emblem-box left">
        <img src="${KIIT_LOGO_BASE64}" alt="KIIT Deemed to be University" class="ksac-emblem kiit" />
      </div>
      <div class="ksac-title-box">
        <div class="ksac-title-line-1">KIIT STUDENT ACTIVITY CENTRE</div>
        <div class="ksac-title-line-2">KALINGA INSTITUTE OF INDUSTRIAL TECHNOLOGY (KIIT)</div>
        <div class="ksac-title-line-3">DEEMED TO BE UNIVERSITY, BHUBANESWAR</div>
      </div>
      <div class="ksac-emblem-box right">
        <img src="${KSAC_LOGO_BASE64}" alt="KSAC" class="ksac-emblem ksac" />
        ${
          societyLogoUrl
            ? `<img src="${societyLogoUrl}" alt="${proposal.society || 'Society'} Logo" class="ksac-emblem society" />`
            : ""
        }
      </div>
    </div>
    <div class="ksac-header-rule"></div>`;
  };

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Official Approval Copy - ${proposal.eventName || "KSAC Event"} (${proposal.society || "KSAC"})</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    html, body {
      margin: 0;
      padding: 0;
      background: #ffffff;
      color: #000000;
      font-family: "Times New Roman", Times, Georgia, "Liberation Serif", serif;
      font-size: 11pt;
      line-height: 1.38;
      -webkit-font-smoothing: antialiased;
    }
    body {
      padding: 0;
    }
    @media screen {
      body {
        padding: 24px;
        background: #f8fafc;
      }
      .ksac-doc-container {
        max-width: 820px;
        margin: 0 auto;
        background: #ffffff;
        padding: 40px 48px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        border: 1px solid #e2e8f0;
        border-radius: 6px;
      }
      .ksac-screen-page-divider {
        margin: 36px -48px;
        border: 0;
        border-top: 1px dashed #cbd5e1;
      }
    }
    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
      }
      .ksac-doc-container {
        max-width: 100% !important;
        margin: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        border: none !important;
        border-radius: 0 !important;
      }
      .ksac-screen-page-divider {
        display: none !important;
      }
    }

    .ksac-doc-page {
      background: #ffffff;
      color: #000000;
      position: relative;
    }
    .ksac-page-break {
      page-break-before: always;
      break-before: page;
      padding-top: 8px;
    }

    /* Formal Letterhead Header */
    .ksac-letterhead-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .ksac-banner-header {
      text-align: center;
      margin-bottom: 6px;
    }
    .ksac-banner-img {
      max-width: 440px;
      width: 100%;
      height: auto;
      margin: 0 auto;
      display: block;
    }
    .ksac-emblem-box {
      min-width: 65px;
      flex-shrink: 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .ksac-emblem-box.left {
      justify-content: flex-start;
    }
    .ksac-emblem-box.right {
      justify-content: flex-end;
    }
    .ksac-emblem.kiit {
      width: 58px;
      height: 46px;
      object-fit: contain;
      display: block;
    }
    .ksac-emblem.ksac {
      width: 52px;
      height: 46px;
      object-fit: contain;
      display: block;
    }
    .ksac-emblem.society {
      width: 48px;
      height: 46px;
      object-fit: contain;
      display: block;
      border-radius: 4px;
    }
    .ksac-title-box {
      flex: 1;
      text-align: center;
      padding: 0 8px;
    }
    .ksac-title-line-1 {
      font-family: Arial, Helvetica, "Nimbus Sans L", sans-serif;
      font-size: 13.5pt;
      font-weight: 800;
      letter-spacing: 0.4px;
      color: #000000;
      line-height: 1.15;
      text-transform: uppercase;
      margin: 0;
    }
    .ksac-title-line-2 {
      font-family: Arial, Helvetica, "Nimbus Sans L", sans-serif;
      font-size: 11.5pt;
      font-weight: 800;
      color: #000000;
      line-height: 1.15;
      text-transform: uppercase;
      margin: 2px 0 0 0;
    }
    .ksac-title-line-3 {
      font-family: Arial, Helvetica, "Nimbus Sans L", sans-serif;
      font-size: 9pt;
      font-weight: 700;
      letter-spacing: 0.3px;
      color: #000000;
      line-height: 1.15;
      text-transform: uppercase;
      margin: 2px 0 0 0;
    }
    .ksac-header-rule {
      border-bottom: 2px solid #000000;
      margin-bottom: 12px;
    }

    /* Notesheet Styles */
    .ksac-notesheet-heading {
      text-align: center;
      font-family: "Times New Roman", Times, Georgia, serif;
      font-size: 13.5pt;
      font-weight: bold;
      text-decoration: underline;
      text-underline-offset: 3px;
      margin: 12px 0 10px 0;
      letter-spacing: 0.5px;
    }
    .ksac-notesheet-date {
      text-align: right;
      font-weight: 600;
      font-size: 11pt;
      margin-bottom: 12px;
    }
    .ksac-recipient-block {
      margin-bottom: 12px;
      line-height: 1.32;
    }
    .ksac-recipient-to {
      font-weight: 600;
    }
    .ksac-recipient-line {
      font-weight: 600;
    }
    .ksac-subject-line {
      margin: 12px 0 10px 0;
      font-weight: bold;
      line-height: 1.35;
    }
    .ksac-subject-underline {
      text-decoration: underline;
    }
    .ksac-salutation {
      font-weight: bold;
      margin-bottom: 8px;
    }
    .ksac-body-p {
      margin: 0 0 8px 0;
      text-align: justify;
      text-justify: inter-word;
    }
    .ksac-thanks-regards {
      margin-top: 10px;
      margin-bottom: 16px;
    }

    /* Notesheet Dual Signatory Block */
    .ksac-notesheet-sig-row {
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      margin-top: 36px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .ksac-notesheet-sig-cell {
      min-width: 220px;
    }
    .ksac-sig-space {
      height: 38px;
    }
    .ksac-approved-by-label {
      font-weight: bold;
      font-size: 11pt;
      margin-bottom: 2px;
    }
    .ksac-sig-underline {
      border-top: 1.5px solid #000000;
      padding-top: 4px;
      font-weight: bold;
      font-size: 10.5pt;
      line-height: 1.3;
    }
    .ksac-sig-name {
      font-size: 10.5pt;
      font-weight: bold;
    }
    .ksac-sig-desig {
      font-size: 10pt;
      font-weight: bold;
      white-space: pre-line;
    }

    /* Proposal Heading */
    .ksac-proposal-header-block {
      text-align: center;
      margin-bottom: 14px;
      page-break-after: avoid;
      break-after: avoid;
    }
    .ksac-proposal-title {
      font-size: 13pt;
      font-weight: bold;
      text-decoration: underline;
      text-underline-offset: 3px;
      margin-bottom: 3px;
    }
    .ksac-proposal-society {
      font-size: 11pt;
      font-weight: bold;
      text-decoration: underline;
      text-underline-offset: 2px;
      margin-bottom: 3px;
    }
    .ksac-proposal-meta {
      font-size: 10.5pt;
      font-weight: bold;
    }

    /* Headings */
    .ksac-sec-title {
      font-family: "Times New Roman", Times, Georgia, serif;
      font-size: 11.5pt;
      font-weight: bold;
      margin: 12px 0 5px 0;
      color: #000000;
      page-break-after: avoid;
      break-after: avoid;
    }
    .ksac-subsec-title {
      font-family: "Times New Roman", Times, Georgia, serif;
      font-size: 10.5pt;
      font-weight: bold;
      margin: 9px 0 4px 0;
      color: #000000;
      page-break-after: avoid;
      break-after: avoid;
    }
    .ksac-list {
      margin: 3px 0 8px 22px;
      padding: 0;
    }
    .ksac-list li {
      margin-bottom: 3px;
    }

    /* Tables */
    .ksac-table {
      width: 100%;
      border-collapse: collapse;
      margin: 5px 0 10px 0;
      font-size: 9.5pt;
      line-height: 1.25;
      page-break-inside: auto;
      break-inside: auto;
    }
    .ksac-table th, .ksac-table td {
      border: 1px solid #000000;
      padding: 4px 7px;
      vertical-align: top;
      color: #000000;
    }
    .ksac-table th {
      font-weight: bold;
      background-color: #f1f5f9;
      text-align: center;
      font-size: 9.5pt;
    }
    thead {
      display: table-header-group;
    }
    tr {
      page-break-inside: avoid;
      break-inside: avoid;
    }

    /* Budget highlight */
    .ksac-budget-highlight {
      margin-top: 6px;
      margin-bottom: 12px;
      font-size: 10.5pt;
      line-height: 1.35;
      page-break-inside: avoid;
      break-inside: avoid;
      border: 1px solid #000000;
      padding: 8px 12px;
      background-color: #fafafa;
    }

    /* Standalone Budget Page */
    .ksac-budget-standalone-page {
      page-break-before: always;
      break-before: page;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .ksac-budget-title-block {
      text-align: center;
      margin-bottom: 12px;
    }
    .ksac-budget-title {
      font-size: 13pt;
      font-weight: bold;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .ksac-budget-subtitle {
      font-size: 10pt;
      font-weight: 600;
      color: #334155;
      margin-top: 2px;
    }

    /* Summary & Multi-Signatory Footer */
    .ksac-summary-and-signatures {
      page-break-inside: avoid;
      break-inside: avoid;
      margin-top: 14px;
    }
    .ksac-footer-sig-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px 24px;
      margin-top: 20px;
      page-break-inside: avoid;
      break-inside: avoid;
    }
    .ksac-footer-sig-cell {
      min-width: 190px;
    }
    .ksac-footer-sig-cell.center {
      grid-column: span 2;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="ksac-doc-container">

    <!-- ==================== PAGE 1: OFFICIAL NOTESHEET ==================== -->
    <div class="ksac-doc-page">
      ${renderHeader()}

      <div class="ksac-notesheet-heading">NOTESHEET</div>

      <div class="ksac-notesheet-date">
        Date: ${proposal.submissionDate || proposal.startDate || "10th October 2026"}
      </div>

      <div class="ksac-recipient-block">
        <div class="ksac-recipient-to">To</div>
        ${recipientLines
          .map((line: string) => `<div class="ksac-recipient-line">${line}</div>`)
          .join("")}
      </div>

      <div class="ksac-subject-line">
        Sub: Proposal &amp; Budget approval for <span class="ksac-subject-underline">&ldquo;${
          proposal.eventName || "Event"
        }&rdquo;</span>${proposal.tagline ? ` (${proposal.tagline})` : ""} event on <span>${
    proposal.dateDisplay || proposal.startDate || "Upcoming"
  }</span> (${proposal.society || "KSAC"} Society under KSAC).
      </div>

      <div class="ksac-salutation">Respected Sir,</div>

      <p class="ksac-body-p">
        ${
          proposal.notesheetIntro ||
          `The <strong>KIIT ${
            proposal.society || "KSAC"
          } Society</strong> under the <strong>KIIT Student Activity Centre (KSAC)</strong> has planned to organize an <strong>${(
            proposal.eventMode || "OFFLINE"
          ).toLowerCase()}</strong> event titled <strong>&ldquo;${
            proposal.eventName || "Event"
          }&rdquo;</strong> on <strong>${
            proposal.dateDisplay || proposal.startDate || "Upcoming"
          }</strong> at <strong>${
            proposal.venueCampus || "KIIT Deemed to be University Campus"
          }</strong>. The detailed event proposal, security requisitions, promotional flex specs, and itemized budget split are attached in the following annexures for kind perusal.`
        }
      </p>

      ${
        proposal.ocHeadcount
          ? `<p class="ksac-body-p">The event will be managed and coordinated under the direct supervision of the <strong>${proposal.ocHeadcount}-member Organising Committee of ${proposal.society}</strong>.</p>`
          : ""
      }

      ${
        enabled.includes("BUDGET") && budgetTotal > 0
          ? `<p class="ksac-body-p">A total budget of <strong>Rs. ${formatIndianCurrency(
              budgetTotal
            )}/- (${budgetWords})</strong> is submitted for your kind review and approval.</p>`
          : ""
      }

      ${
        enabled.includes("REVENUE") && revenueTotal > 0
          ? `<p class="ksac-body-p">${
              proposal.revenueSummaryLine ||
              `The projected revenue generation from participant registration fees and sponsorship is estimated at <strong>Rs. ${formatIndianCurrency(
                revenueTotal
              )}/-</strong> for this event.`
            }</p>`
          : ""
      }

      <p class="ksac-body-p">
        Your kind consideration and approval are solicited to proceed with the above event.
      </p>

      <div class="ksac-thanks-regards">Thanks &amp; Regards,</div>

      <!-- Notesheet Signatories -->
      <div class="ksac-notesheet-sig-row">
        <!-- Associate Dean KSAC (Left) -->
        <div class="ksac-notesheet-sig-cell">
          <div class="ksac-sig-space"></div>
          <div class="ksac-sig-underline">
            <div class="ksac-sig-name">${
              notesheetSignatories[0]?.name || "Dr. Ajit Kumar Pasayat"
            }</div>
            <div class="ksac-sig-desig">${
              notesheetSignatories[0]?.designation || "Associate Dean, KSAC (Tech)"
            }</div>
          </div>
        </div>

        <!-- Pro-VC / Registrar Approval (Right) -->
        <div class="ksac-notesheet-sig-cell">
          <div class="ksac-approved-by-label">Approved By:</div>
          <div class="ksac-sig-space" style="height: 20px;"></div>
          <div class="ksac-sig-underline">
            ${
              notesheetSignatories[1]?.name
                ? `<div class="ksac-sig-name">${notesheetSignatories[1].name}</div>`
                : ""
            }
            <div class="ksac-sig-desig">${
              notesheetSignatories[1]?.designation ||
              "Pro-Vice Chancellor (Admin)-cum-Registrar\nKIIT-DU"
            }</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Screen-only divider (hidden during print) -->
    <hr class="ksac-screen-page-divider" />

    <!-- ==================== PAGE 2: DETAILED PROPOSAL & REQUIREMENTS ==================== -->
    <div class="ksac-doc-page ksac-page-break">
      ${renderHeader()}

      <div class="ksac-proposal-header-block">
        <div class="ksac-proposal-title">
          Proposal for ${proposal.eventName || "Event"}
          ${proposal.tagline ? ` - ${proposal.tagline}` : ""}
        </div>
        <div class="ksac-proposal-society">
          Society Name : ${proposal.societyFullName || proposal.society || "KSAC"} under KSAC
        </div>
        <div class="ksac-proposal-meta">
          Event Date : ${proposal.dateDisplay || proposal.startDate || "Upcoming"} &nbsp;|&nbsp; Venue : ${
    proposal.venueCampus || "KIIT Campus"
  }
        </div>
      </div>

      <!-- 1. Background -->
      ${
        proposal.background
          ? `
      <h3 class="ksac-sec-title">${sectionCounter++}. Background :-</h3>
      <p class="ksac-body-p" style="white-space: pre-line;">${proposal.background}</p>`
          : ""
      }

      <!-- Target Audience & Guidelines -->
      ${
        enabled.includes("GUIDELINES") && proposal.guidelines
          ? `
      <div style="margin: 8px 0 12px 0;">
        <h4 class="ksac-subsec-title">Target Audience &amp; Eligibility:</h4>
        <ul class="ksac-list">
          ${
            proposal.guidelines.participantsYear
              ? `<li><strong>Participants:</strong> ${proposal.guidelines.participantsYear}</li>`
              : ""
          }
          ${
            proposal.guidelines.eligibility
              ? `<li><strong>Eligibility:</strong> ${proposal.guidelines.eligibility}</li>`
              : ""
          }
          ${
            proposal.guidelines.teamSize
              ? `<li><strong>Team formation:</strong> ${proposal.guidelines.teamSize}</li>`
              : ""
          }
          ${
            proposal.guidelines.advancementRules
              ? `<li><strong>Advancement / Selection:</strong> ${proposal.guidelines.advancementRules}</li>`
              : ""
          }
          ${
            proposal.guidelines.extraNotes
              ? `<li>${proposal.guidelines.extraNotes}</li>`
              : ""
          }
        </ul>
      </div>`
          : ""
      }

      <!-- 2. Objective -->
      ${
        Array.isArray(proposal.objectives) && proposal.objectives.length > 0
          ? `
      <div style="margin-bottom: 12px;">
        <h3 class="ksac-sec-title">${sectionCounter++}. Objective :-</h3>
        <ul class="ksac-list">
          ${proposal.objectives
            .map((obj: string) => `<li>${obj}</li>`)
            .join("")}
        </ul>
      </div>`
          : ""
      }

      <!-- 3. Event Format / Sub-Events -->
      ${
        enabled.includes("SUB_EVENTS") &&
        (proposal.eventFormatSummary ||
          (Array.isArray(proposal.subEvents) && proposal.subEvents.length > 0))
          ? `
      <div style="margin-bottom: 14px;">
        <h3 class="ksac-sec-title">${sectionCounter++}. Event Format &amp; Structure :-</h3>
        ${
          proposal.eventFormatSummary
            ? `<p class="ksac-body-p">${proposal.eventFormatSummary}</p>`
            : ""
        }
        ${
          Array.isArray(proposal.subEvents)
            ? proposal.subEvents
                .map(
                  (se: any, idx: number) => `
          <div style="margin-bottom: 8px;">
            <div style="font-weight: bold;">
              Event ${idx + 1} - ${se.name || "Session"}
              ${se.dayLabel ? ` - ${se.dayLabel}` : ""}
              ${se.date ? ` - ${se.date}` : ""}
              ${se.timings ? ` [${se.timings}]` : ""}
            </div>
            ${se.description ? `<p class="ksac-body-p" style="margin-top: 2px;">${se.description}</p>` : ""}
          </div>`
                )
                .join("")
            : ""
        }
      </div>`
          : ""
      }

      <!-- 4. Departmental & Venue Requirements -->
      ${
        (enabled.includes("VENUE") && Array.isArray(proposal.venueRequirements) && proposal.venueRequirements.length > 0) ||
        (enabled.includes("TECHNICAL") && Array.isArray(proposal.technicalRequirements) && proposal.technicalRequirements.length > 0) ||
        (enabled.includes("FOOD") && Array.isArray(proposal.foodRequirements) && proposal.foodRequirements.length > 0) ||
        (enabled.includes("MARKETING") && Array.isArray(proposal.marketingRequirements) && proposal.marketingRequirements.length > 0) ||
        (enabled.includes("SECURITY") && Array.isArray(proposal.securityRequirements) && proposal.securityRequirements.length > 0) ||
        (enabled.includes("FELICITATION") && Array.isArray(proposal.felicitationRequirements) && proposal.felicitationRequirements.length > 0)
          ? `
      <div style="margin-bottom: 14px;">
        <h3 class="ksac-sec-title">${sectionCounter++}. Operational &amp; Campus Requirements</h3>

        <!-- A. Venue Requirements -->
        ${
          enabled.includes("VENUE") && Array.isArray(proposal.venueRequirements) && proposal.venueRequirements.length > 0
            ? `
        <div style="margin-bottom: 10px;">
          <h4 class="ksac-subsec-title">A. Venue Requirements</h4>
          <table class="ksac-table">
            <thead>
              <tr>
                <th style="width: 45px;">Sl. No.</th>
                <th style="width: 105px;">Date</th>
                <th style="width: 90px;">Campus</th>
                <th style="width: 110px;">Timings</th>
                <th style="width: 110px;">Venue</th>
                <th style="width: 60px;">Quantity</th>
                <th>Details / Purpose</th>
              </tr>
            </thead>
            <tbody>
              ${proposal.venueRequirements
                .map(
                  (v: any, idx: number) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>${v.date || "-"}</td>
                <td>${v.campus || "-"}</td>
                <td>${v.timings || "-"}</td>
                <td>${v.venueType || "-"}</td>
                <td style="text-align: center;">${v.quantity || "-"}</td>
                <td>${v.details || "-"}</td>
              </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`
            : ""
        }

        <!-- B. Technical Requirements -->
        ${
          enabled.includes("TECHNICAL") && Array.isArray(proposal.technicalRequirements) && proposal.technicalRequirements.length > 0
            ? `
        <div style="margin-bottom: 10px;">
          <h4 class="ksac-subsec-title">B. Technical &amp; Electrical Requirements</h4>
          <table class="ksac-table">
            <thead>
              <tr>
                <th style="width: 45px;">Sl. No.</th>
                <th style="width: 115px;">Dates</th>
                <th style="width: 110px;">Timings</th>
                <th style="width: 110px;">Venue</th>
                <th style="width: 160px;">Requirements</th>
                <th style="width: 60px;">Quantity</th>
                <th>Details / Purpose</th>
              </tr>
            </thead>
            <tbody>
              ${proposal.technicalRequirements
                .map(
                  (t: any, idx: number) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>${t.date || "-"}</td>
                <td>${t.timings || "-"}</td>
                <td>${t.venue || "-"}</td>
                <td>${t.item || "-"}</td>
                <td style="text-align: center;">${t.quantity || "-"}</td>
                <td>${t.details || "-"}</td>
              </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`
            : ""
        }

        <!-- C. Food Requirements -->
        ${
          enabled.includes("FOOD") && Array.isArray(proposal.foodRequirements) && proposal.foodRequirements.length > 0
            ? `
        <div style="margin-bottom: 10px;">
          <h4 class="ksac-subsec-title">C. Accommodation &amp; Food Requirements</h4>
          <table class="ksac-table">
            <thead>
              <tr>
                <th style="width: 45px;">Sl. No.</th>
                <th style="width: 130px;">Dates</th>
                <th style="width: 180px;">Requirements</th>
                <th style="width: 75px;">Quantity</th>
                <th>Details / Purpose</th>
              </tr>
            </thead>
            <tbody>
              ${proposal.foodRequirements
                .map(
                  (f: any, idx: number) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>${f.date || "-"}</td>
                <td>${f.item || "-"}</td>
                <td style="text-align: center;">${f.quantity || "-"}</td>
                <td>${f.details || "-"}</td>
              </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`
            : ""
        }

        <!-- D. Marketing Requirements -->
        ${
          enabled.includes("MARKETING") && Array.isArray(proposal.marketingRequirements) && proposal.marketingRequirements.length > 0
            ? `
        <div style="margin-bottom: 10px;">
          <h4 class="ksac-subsec-title">D. Marketing &amp; Logistics Requirements</h4>
          <table class="ksac-table">
            <thead>
              <tr>
                <th style="width: 45px;">Sl. No.</th>
                <th style="width: 130px;">Date / Interval</th>
                <th style="width: 180px;">Items / Requirements</th>
                <th style="width: 110px;">Campus</th>
                <th>Details / Purpose</th>
              </tr>
            </thead>
            <tbody>
              ${proposal.marketingRequirements
                .map(
                  (m: any, idx: number) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>${
                  m.startDate && m.endDate && m.startDate !== m.endDate
                    ? `${m.startDate} - ${m.endDate}`
                    : m.startDate || proposal.dateDisplay || "-"
                }</td>
                <td>${m.item || "-"}</td>
                <td>${m.campus || "-"}</td>
                <td>${m.details || "-"}</td>
              </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`
            : ""
        }

        <!-- E. Security & Crowd Management Requirements -->
        ${
          enabled.includes("SECURITY") && Array.isArray(proposal.securityRequirements) && proposal.securityRequirements.length > 0
            ? `
        <div style="margin-bottom: 10px;">
          <h4 class="ksac-subsec-title">E. Security &amp; Crowd Management Requirements</h4>
          <table class="ksac-table">
            <thead>
              <tr>
                <th style="width: 45px;">Sl. No.</th>
                <th style="width: 110px;">Date</th>
                <th style="width: 100px;">Timings</th>
                <th style="width: 100px;">Campus / Gate</th>
                <th style="width: 180px;">Security Requisition</th>
                <th style="width: 65px;">Guards</th>
                <th>Access &amp; Crowd Details</th>
              </tr>
            </thead>
            <tbody>
              ${proposal.securityRequirements
                .map(
                  (s: any, idx: number) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>${s.date || "-"}</td>
                <td>${s.timings || "-"}</td>
                <td>${s.campus || proposal.venueCampus || "-"}</td>
                <td>${s.securityType || s.item || "Security Guards"}</td>
                <td style="text-align: center;">${s.quantity || "1"}</td>
                <td>${s.details || "-"}</td>
              </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`
            : ""
        }

        <!-- F. Felicitation Material Requirements -->
        ${
          enabled.includes("FELICITATION") && Array.isArray(proposal.felicitationRequirements) && proposal.felicitationRequirements.length > 0
            ? `
        <div style="margin-bottom: 10px;">
          <h4 class="ksac-subsec-title">F. Dignitary Felicitation &amp; Hospitality Protocol Material</h4>
          <table class="ksac-table">
            <thead>
              <tr>
                <th style="width: 45px;">Sl. No.</th>
                <th style="width: 110px;">Date</th>
                <th style="width: 200px;">Felicitation Item / Material</th>
                <th style="width: 65px;">Quantity</th>
                <th style="width: 180px;">Recipient Dignitary</th>
                <th>Specifications / Notes</th>
              </tr>
            </thead>
            <tbody>
              ${proposal.felicitationRequirements
                .map(
                  (f: any, idx: number) => `
              <tr>
                <td style="text-align: center;">${idx + 1}</td>
                <td>${f.date || "-"}</td>
                <td>${f.item || "-"}</td>
                <td style="text-align: center;">${f.quantity || "1"}</td>
                <td>${f.recipientDignitary || "Dignitary / Guest"}</td>
                <td>${f.details || "-"}</td>
              </tr>`
                )
                .join("")}
            </tbody>
          </table>
        </div>`
            : ""
        }
      </div>`
          : ""
      }

      <!-- 5. Sponsors & Memorandum of Understanding (MoU) -->
      ${
        enabled.includes("SPONSORS") && Array.isArray(proposal.sponsors) && proposal.sponsors.length > 0
          ? `
      <div style="margin-bottom: 14px;">
        <h3 class="ksac-sec-title">${sectionCounter++}. Event Sponsors &amp; Memorandum of Understanding (MoU) :-</h3>
        <table class="ksac-table">
          <thead>
            <tr>
              <th style="width: 45px;">Sl. No.</th>
              <th>Sponsor / Partner Name</th>
              <th style="width: 140px;">Partnership Tier</th>
              <th style="width: 130px;">Contribution (Rs.)</th>
              <th style="width: 140px;">MoU Document Status</th>
            </tr>
          </thead>
          <tbody>
            ${proposal.sponsors
              .map(
                (sp: any, idx: number) => `
            <tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td><strong>${sp.name || "-"}</strong>${sp.contactPerson ? `<br/><span style="font-size: 8.5pt; color: #475569;">Contact: ${sp.contactPerson}</span>` : ""}</td>
              <td>${sp.tier || "Associate Partner"}</td>
              <td style="text-align: right;">Rs. ${formatIndianCurrency(sp.contributionAmount || 0)}/-</td>
              <td style="text-align: center;">${sp.mouFileName ? `<span style="color: #047857; font-weight: bold;">MoU Attached (${sp.mouFileName})</span>` : "<span style=\"color: #64748b;\">Under Process</span>"}</td>
            </tr>`
              )
              .join("")}
          </tbody>
        </table>
      </div>`
          : ""
      }

      <!-- 6. Promotional Banners & Posters Specifications -->
      ${
        proposal.bannerDetails?.fileName || proposal.posterDetails?.fileName
          ? `
      <div style="margin-bottom: 14px;">
        <h3 class="ksac-sec-title">${sectionCounter++}. Promotional Branding &amp; Printing Specifications :-</h3>
        <table class="ksac-table">
          <thead>
            <tr>
              <th style="width: 130px;">Asset Type</th>
              <th style="width: 180px;">Format &amp; Sizing</th>
              <th style="width: 120px;">Material / Media</th>
              <th>Uploaded Artwork File</th>
            </tr>
          </thead>
          <tbody>
            ${
              proposal.bannerDetails?.fileName
                ? `
            <tr>
              <td><strong>Event Flex Banner</strong></td>
              <td>${proposal.bannerDetails.dimensions || proposal.bannerDetails.format || "12x8 ft"}</td>
              <td>${proposal.bannerDetails.material || "Star Flex"}</td>
              <td>${proposal.bannerDetails.fileName}</td>
            </tr>`
                : ""
            }
            ${
              proposal.posterDetails?.fileName
                ? `
            <tr>
              <td><strong>Official Poster</strong></td>
              <td>${proposal.posterDetails.format || "A3 Physical Print"}</td>
              <td>Glossy Paper / Digital</td>
              <td>${proposal.posterDetails.fileName}</td>
            </tr>`
                : ""
            }
          </tbody>
        </table>
      </div>`
          : ""
      }

      <!-- 7. Proposal Operational Summary -->
      <div style="margin-top: 14px;">
        <h3 class="ksac-sec-title">${sectionCounter++}. Operational Summary</h3>
        <p class="ksac-body-p">
          ${
            proposal.summary ||
            `These arrangements are essential to ensure <strong>${
              proposal.eventName || "the event"
            }</strong> runs smoothly and reflects well on <strong>${
              proposal.society || "KSAC"
            }</strong>, <strong>KSAC</strong>, and <strong>KIIT Deemed to be University</strong>. The complete financial breakdown and statutory approval signatures follow on the next dedicated budget page.`
          }
        </p>
      </div>

    </div>

    <!-- Screen-only divider (hidden during print) -->
    <hr class="ksac-screen-page-divider" />

    <!-- ==================== PAGE 3: INDEPENDENT BUDGET & SIGNATORIES PAGE ==================== -->
    <div class="ksac-doc-page ksac-budget-standalone-page">
      ${renderHeader()}

      <div class="ksac-budget-title-block">
        <div class="ksac-budget-title">
          OFFICIAL EVENT BUDGET &amp; EXPENDITURE STATEMENT
        </div>
        <div class="ksac-budget-subtitle">
          Annexure: Itemized Financial Sanction &amp; Signatories Matrix
        </div>
        <div style="font-size: 10pt; font-weight: bold; margin-top: 4px;">
          Event: ${proposal.eventName || "Event"} &nbsp;|&nbsp; Society: ${proposal.society || "KSAC"} &nbsp;|&nbsp; Dates: ${proposal.dateDisplay || proposal.startDate || "Upcoming"}
        </div>
      </div>

      <!-- Itemized Budget Table -->
      ${
        enabled.includes("BUDGET") && Array.isArray(proposal.budgetItems) && proposal.budgetItems.length > 0
          ? `
      <div style="margin-bottom: 10px;">
        ${
          proposal.includeGstNote !== false
            ? `<p style="font-size: 9pt; font-style: italic; margin: 0 0 5px 0;">(N.B. The budget distribution provided below is calculated prior to the inclusion of Goods and Services Tax (GST). Applicable GST, in accordance with prevailing Government Regulations, will be added, and the final cost may vary.)</p>`
            : ""
        }
        <table class="ksac-table">
          <thead>
            <tr>
              <th style="width: 45px;">Sl No.</th>
              <th>Particulars</th>
              <th style="width: 65px;">Quantity</th>
              <th style="width: 95px;">Pricing</th>
              <th style="width: 125px;">Tentative Cost (in Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${proposal.budgetItems
              .map(
                (b: any, idx: number) => `
            <tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td>${b.particulars || "-"}</td>
              <td style="text-align: center;">${b.quantity || "-"}</td>
              <td style="text-align: right;">${b.unitPrice || "-"}</td>
              <td style="text-align: right;">${formatIndianCurrency(b.totalCost || 0)}</td>
            </tr>`
              )
              .join("")}
            <tr>
              <td colspan="4" style="text-align: right; font-weight: bold;">Total Amount</td>
              <td style="text-align: right; font-weight: bold;">Rs. ${formatIndianCurrency(
                budgetTotal
              )}</td>
            </tr>
          </tbody>
        </table>

        <div class="ksac-budget-highlight">
          <strong>Grand Total Approved Budget: Rs. ${formatIndianCurrency(budgetTotal)}/-</strong><br />
          <strong>In words:</strong> ${budgetWords}
        </div>
      </div>`
          : `
      <div style="border: 1px dashed #94a3b8; padding: 16px; text-align: center; margin-bottom: 12px; font-style: italic;">
        No separate monetary expenditure requested from KSAC university funds for this event.
      </div>`
      }

      <!-- Revenue Model (if enabled) -->
      ${
        enabled.includes("REVENUE") && Array.isArray(proposal.revenueItems) && proposal.revenueItems.length > 0
          ? `
      <div style="margin-bottom: 10px;">
        <h4 class="ksac-subsec-title">Revenue Projections &amp; Self-Sponsorship:</h4>
        <table class="ksac-table">
          <thead>
            <tr>
              <th style="width: 45px;">Sl No.</th>
              <th>Revenue Source</th>
              <th style="width: 130px;">Amount Projection</th>
              <th style="width: 130px;">Total (in Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${proposal.revenueItems
              .map(
                (r: any, idx: number) => `
            <tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td>${r.source || "-"}</td>
              <td style="text-align: right;">${r.amountFormula || "-"}</td>
              <td style="text-align: right;">${formatIndianCurrency(r.total || 0)}</td>
            </tr>`
              )
              .join("")}
            <tr>
              <td colspan="3" style="text-align: right; font-weight: bold;">Total Projected Revenue</td>
              <td style="text-align: right; font-weight: bold;">Rs. ${formatIndianCurrency(revenueTotal)}</td>
            </tr>
          </tbody>
        </table>
      </div>`
          : ""
      }

      <!-- Speaker Fee Breakdown (if enabled) -->
      ${
        enabled.includes("SPEAKER") && proposal.speakerDetails?.name
          ? `
      <div style="margin-bottom: 10px;">
        <h4 class="ksac-subsec-title">Speaker / Dignitary Honorarium &amp; Logistics:</h4>
        <div style="font-weight: bold; font-size: 10pt;">${proposal.speakerDetails.name} ${proposal.speakerDetails.title ? `(${proposal.speakerDetails.title})` : ""}</div>
        ${
          Array.isArray(proposal.speakerDetails.feeItems) && proposal.speakerDetails.feeItems.length > 0
            ? `
        <table class="ksac-table" style="margin-top: 4px;">
          <thead>
            <tr>
              <th style="width: 45px;">Sl No.</th>
              <th>Particulars</th>
              <th style="width: 65px;">Quantity</th>
              <th style="width: 95px;">Pricing</th>
              <th style="width: 125px;">Cost (in Rs.)</th>
            </tr>
          </thead>
          <tbody>
            ${proposal.speakerDetails.feeItems
              .map(
                (f: any, idx: number) => `
            <tr>
              <td style="text-align: center;">${idx + 1}</td>
              <td>${f.particulars || "-"}</td>
              <td style="text-align: right;">${formatIndianCurrency(f.pricing || 0)}</td>
              <td style="text-align: right;">${formatIndianCurrency(f.total || 0)}</td>
            </tr>`
              )
              .join("")}
            <tr>
              <td colspan="4" style="text-align: right; font-weight: bold;">Speaker Total</td>
              <td style="text-align: right; font-weight: bold;">Rs. ${formatIndianCurrency(
                proposal.speakerDetails.speakerTotal || 0
              )}</td>
            </tr>
          </tbody>
        </table>`
            : ""
        }
      </div>`
          : ""
      }

      <!-- Official Multi-Signatory Footer Grid (STRICTLY ON THIS SAME BUDGET PAGE) -->
      <div class="ksac-summary-and-signatures" style="margin-top: 18px;">
        <div style="font-weight: bold; font-size: 10pt; text-transform: uppercase; letter-spacing: 0.3px; margin-bottom: 4px;">
          Official Requisition &amp; Budget Sanction Signatories:
        </div>
        <div class="ksac-footer-sig-grid">
          ${(footerSignatories.length > 0
            ? footerSignatories
            : [
                { roleTitle: "FIC", name: "", designation: `Faculty In-Charge (FIC)\n${proposal.society || "Society"}` },
                {
                  roleTitle: "Associate Dean, KSAC",
                  name: "Dr. Ajit Kumar Pasayat",
                  designation: "Associate Dean, KSAC (Tech)",
                },
                { roleTitle: "Associate Dean, KSAC", name: "", designation: "Associate Dean, KSAC" },
                { roleTitle: "Deputy Director, KSAC", name: "", designation: "Deputy Director, KSAC" },
                {
                  roleTitle: "Pro-Vice Chancellor - Cum - Registrar",
                  name: "",
                  designation: "Pro-Vice Chancellor (Admin)-cum-Registrar, KIIT-DU",
                },
              ]
          )
            .map(
              (sig: any, idx: number, arr: any[]) => `
            <div class="ksac-footer-sig-cell ${idx === 4 && arr.length === 5 ? "center" : ""}">
              <div class="ksac-sig-space"></div>
              <div class="ksac-sig-underline">
                ${sig.name ? `<div class="ksac-sig-name">${sig.name}</div>` : ""}
                <div class="ksac-sig-desig">${sig.designation || sig.roleTitle}</div>
              </div>
            </div>`
            )
            .join("")}
        </div>
      </div>

    </div>
  </div>

  ${
    autoPrint
      ? `<script>
    window.onload = function() {
      setTimeout(function() {
        window.focus();
        window.print();
      }, 350);
    };
  </script>`
      : ""
  }
</body>
</html>`;
}

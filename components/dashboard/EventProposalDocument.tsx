"use client";

import React, { useRef, useState } from "react";
import { formatIndianCurrency, numberToIndianRupeeWords } from "@/lib/eventProposalPresets";
import {
  KIIT_LOGO_BASE64,
  KSAC_LOGO_BASE64,
  KSAC_BANNER_WIDE_BASE64,
} from "@/lib/documentAssets";
import { generateProposalDocumentHtml } from "@/lib/proposalDocumentTemplate";

interface EventProposalDocumentProps {
  proposal: any;
  canPrint?: boolean;
  onClose?: () => void;
}

export default function EventProposalDocument({
  proposal,
  canPrint = true,
  onClose,
}: EventProposalDocumentProps) {
  const printContainerRef = useRef<HTMLDivElement>(null);
  const [useWideBannerHeader, setUseWideBannerHeader] = useState<boolean>(false);

  if (!proposal) return null;

  const enabled: string[] = Array.isArray(proposal.enabledSections)
    ? proposal.enabledSections
    : ["SUB_EVENTS", "GUIDELINES", "BUDGET", "VENUE", "TECHNICAL", "MARKETING"];

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

  let sectionCounter = 1;

  const recipientLines = String(
    proposal.notesheetRecipient || "The Pro-Vice Chancellor (Admin)-cum-Registrar\nKIIT-DU"
  )
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);

  // Generate self-contained official HTML string with inline base64 logos
  const generateStandaloneHtml = (autoPrint = false): string => {
    return generateProposalDocumentHtml(proposal, {
      useWideBannerHeader,
      autoPrint,
    });
  };

  const handlePrintOfficialCopy = () => {
    const fullHtml = generateStandaloneHtml(true);
    if (!fullHtml) return;

    // 1. Try modern popup window
    const printWin = window.open("", "_blank", "width=960,height=920");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(fullHtml);
      printWin.document.close();
      return;
    }

    // 2. Fallback: Invisible iframe (works when popup blocker blocks window.open)
    try {
      const existingIframe = document.getElementById("ksac-print-iframe");
      if (existingIframe) {
        existingIframe.remove();
      }
      const iframe = document.createElement("iframe");
      iframe.id = "ksac-print-iframe";
      iframe.style.position = "fixed";
      iframe.style.right = "0";
      iframe.style.bottom = "0";
      iframe.style.width = "0";
      iframe.style.height = "0";
      iframe.style.border = "0";
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow?.document;
      if (doc) {
        doc.open();
        doc.write(fullHtml);
        doc.close();
        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
        }, 400);
        return;
      }
    } catch (e) {
      console.warn("Iframe print fallback encountered exception, falling back to window.print():", e);
    }

    // 3. Final Fallback: Direct print
    window.print();
  };

  const handleDownloadStandaloneHtml = () => {
    const fullHtml = generateStandaloneHtml(false);
    if (!fullHtml) return;

    const blob = new Blob([fullHtml], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const cleanEventName = (proposal.eventName || "KSAC_Proposal").replace(/[^a-zA-Z0-9_-]/g, "_");
    link.href = url;
    link.download = `${cleanEventName}_Official_Approval_Document.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Official Standard Formal Header Component (KIIT Logo + 3-line official text + KSAC Logo)
  const FormalHeader = () => (
    <div
      className="ksac-header"
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        borderBottom: "2px solid #000000",
        paddingBottom: "8px",
        marginBottom: "16px",
      }}
    >
      {/* KIIT Emblem */}
      <div style={{ width: "65px", textAlign: "left", flexShrink: 0 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={KIIT_LOGO_BASE64}
          alt="KIIT Deemed to be University"
          style={{ width: "58px", height: "46px", objectFit: "contain", display: "block" }}
        />
      </div>

      {/* Center Official Title Block */}
      <div className="ksac-header-center" style={{ textAlign: "center", flex: 1, padding: "0 8px" }}>
        <div
          className="ksac-header-title-1"
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "14pt",
            fontWeight: 800,
            letterSpacing: "0.4px",
            color: "#000000",
            lineHeight: 1.15,
            textTransform: "uppercase",
          }}
        >
          KIIT STUDENT ACTIVITY CENTRE
        </div>
        <div
          className="ksac-header-title-2"
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "12pt",
            fontWeight: 800,
            color: "#000000",
            marginTop: "2px",
            lineHeight: 1.15,
            textTransform: "uppercase",
          }}
        >
          KALINGA INSTITUTE OF INDUSTRIAL TECHNOLOGY (KIIT)
        </div>
        <div
          className="ksac-header-title-3"
          style={{
            fontFamily: "Arial, Helvetica, sans-serif",
            fontSize: "9.5pt",
            fontWeight: 700,
            color: "#000000",
            marginTop: "2px",
            lineHeight: 1.15,
            letterSpacing: "0.3px",
            textTransform: "uppercase",
          }}
        >
          DEEMED TO BE UNIVERSITY, BHUBANESWAR
        </div>
      </div>

      {/* KSAC Emblem */}
      <div
        style={{
          width: "65px",
          textAlign: "right",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={KSAC_LOGO_BASE64}
          alt="KSAC"
          style={{ width: "56px", height: "46px", objectFit: "contain", display: "block" }}
        />
      </div>
    </div>
  );

  // Alternative Wide Banner Header (from media_1790829277012.webp)
  const WideBannerHeader = () => (
    <div
      style={{
        textAlign: "center",
        borderBottom: "2px solid #000000",
        paddingBottom: "10px",
        marginBottom: "16px",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={KSAC_BANNER_WIDE_BASE64}
        alt="KIIT Student Activity Center Banner"
        style={{
          maxWidth: "380px",
          width: "100%",
          height: "auto",
          margin: "0 auto 4px",
          display: "block",
        }}
      />
    </div>
  );

  return (
    <div className="w-full">
      {/* Action Toolbar (Hidden in print) */}
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <div>
          <span className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-800">
            🏛️ Official KSAC Document Preview (A4 Portrait)
          </span>
          <p className="text-xs text-slate-500">
            Formatted identically to official KIIT &amp; KSAC Notesheets &amp; Approval Annexures.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setUseWideBannerHeader((prev) => !prev)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            title="Toggle between standard letterhead emblem header and wide combined banner header"
          >
            {useWideBannerHeader ? "🖼️ Header: Wide Banner" : "🏛️ Header: Standard Letterhead"}
          </button>

          {canPrint ? (
            <button
              type="button"
              onClick={handlePrintOfficialCopy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
            >
              🖨️ Print / Save PDF (A4)
            </button>
          ) : (
            <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              🔒 Printout unlocks upon Dean KSAC approval
            </span>
          )}

          <button
            type="button"
            onClick={handleDownloadStandaloneHtml}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            title="Download self-contained offline HTML copy"
          >
            📥 Download HTML
          </button>

          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
            >
              Close
            </button>
          )}
        </div>
      </div>

      {/* Printable Formal A4 Document Surface */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        .ksac-doc-surface {
          font-family: "Times New Roman", Times, Georgia, "Liberation Serif", serif;
          font-size: 11pt;
          line-height: 1.38;
          color: #000000;
          background-color: #ffffff;
        }
        .ksac-doc-surface table.ksac-table {
          width: 100%;
          border-collapse: collapse !important;
          margin: 8px 0 14px;
          font-size: 10pt;
        }
        .ksac-doc-surface table.ksac-table th,
        .ksac-doc-surface table.ksac-table td {
          border: 1px solid #000000 !important;
          padding: 4px 7px !important;
          vertical-align: top;
          color: #000000;
        }
        .ksac-doc-surface table.ksac-table th {
          background-color: #f1f5f9 !important;
          font-weight: 700;
          text-align: center;
        }
        .ksac-doc-surface tr {
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .ksac-doc-surface thead {
          display: table-header-group;
        }
        .ksac-doc-surface .ksac-sec-title {
          font-size: 11.5pt;
          font-weight: 700;
          margin: 12px 0 5px;
          color: #000000;
          break-after: avoid;
          page-break-after: avoid;
        }
        .ksac-doc-surface .ksac-subsec-title {
          font-size: 10.5pt;
          font-weight: 700;
          margin: 10px 0 4px;
          color: #000000;
          break-after: avoid;
          page-break-after: avoid;
        }
        .ksac-doc-surface .ksac-summary-and-signatures {
          break-inside: avoid !important;
          page-break-inside: avoid !important;
        }
        .ksac-page-break {
          page-break-before: always;
          break-before: page;
        }
        @media print {
          @page {
            size: A4 portrait;
            margin: 12mm 15mm;
          }
          body * {
            visibility: hidden;
          }
          #ksac-printable-document,
          #ksac-printable-document * {
            visibility: visible;
          }
          #ksac-printable-document {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            background: #ffffff !important;
          }
          .ksac-page-break {
            page-break-before: always !important;
            break-before: page !important;
            margin-top: 0 !important;
            padding-top: 8px !important;
            border-top: none !important;
          }
        }
      `,
        }}
      />
      <div
        ref={printContainerRef}
        id="ksac-printable-document"
        className="ksac-doc-surface mx-auto max-w-[820px] rounded-lg border border-slate-300 bg-white p-8 text-black shadow-2xl sm:p-12"
      >
        {/* ==================== PAGE 1: OFFICIAL NOTESHEET ==================== */}
        <div className="ksac-doc-page">
          {useWideBannerHeader ? <WideBannerHeader /> : <FormalHeader />}

          <div
            className="ksac-notesheet-heading"
            style={{
              textAlign: "center",
              fontFamily: 'Arial, "Times New Roman", serif',
              fontSize: "14pt",
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              margin: "16px 0 14px",
              letterSpacing: "0.5px",
            }}
          >
            NOTESHEET
          </div>

          <div
            style={{
              textAlign: "right",
              fontWeight: 600,
              fontSize: "11.5pt",
              marginBottom: "14px",
            }}
          >
            Date: {proposal.submissionDate || proposal.startDate}
          </div>

          <div style={{ marginBottom: "16px", lineHeight: 1.35 }}>
            <div style={{ fontWeight: 600 }}>To</div>
            {recipientLines.map((line, idx) => (
              <div key={idx} style={{ fontWeight: 600 }}>
                {line}
              </div>
            ))}
          </div>

          <div style={{ margin: "16px 0 14px", fontWeight: 700, lineHeight: 1.35 }}>
            Sub: Proposal &amp; Budget approval for{" "}
            <span style={{ textDecoration: "underline" }}>&ldquo;{proposal.eventName}&rdquo;</span>
            {proposal.tagline ? ` (${proposal.tagline})` : ""} event on{" "}
            <span>{proposal.dateDisplay || proposal.startDate}</span> ({proposal.society} Society under KSAC)
          </div>

          <div style={{ fontWeight: 700, marginBottom: "10px" }}>Respected Sir,</div>

          <p style={{ margin: "0 0 12px", textAlign: "justify", textJustify: "inter-word" }}>
            {proposal.notesheetIntro ? (
              proposal.notesheetIntro
            ) : (
              <>
                The <strong>KIIT {proposal.society} Society</strong> under the{" "}
                <strong>KIIT Student Activity Centre (KSAC)</strong> has planned to organize an{" "}
                <strong>{(proposal.eventMode || "OFFLINE").toLowerCase()}</strong> event titled{" "}
                <strong>&ldquo;{proposal.eventName}&rdquo;</strong> on{" "}
                <strong>{proposal.dateDisplay || proposal.startDate}</strong> at{" "}
                <strong>{proposal.venueCampus || "KIIT Deemed to be University Campus"}</strong>.{" "}
                The Budget split and necessary requirements are attached in the next pages / annexures.
              </>
            )}
          </p>

          {proposal.ocHeadcount && (
            <p style={{ margin: "0 0 12px", textAlign: "justify", textJustify: "inter-word" }}>
              The event will be managed and coordinated under the direct supervision of the{" "}
              <strong>
                {proposal.ocHeadcount}-member Organising Committee of {proposal.society}
              </strong>
              .
            </p>
          )}

          {enabled.includes("BUDGET") && budgetTotal > 0 && (
            <p style={{ margin: "0 0 12px", textAlign: "justify", textJustify: "inter-word" }}>
              A total budget of{" "}
              <strong>
                Rs. {formatIndianCurrency(budgetTotal)}/- ({budgetWords})
              </strong>{" "}
              is submitted for your kind review and approval.
            </p>
          )}

          {enabled.includes("REVENUE") && revenueTotal > 0 && (
            <p style={{ margin: "0 0 12px", textAlign: "justify", textJustify: "inter-word" }}>
              {proposal.revenueSummaryLine ? (
                proposal.revenueSummaryLine
              ) : (
                <>
                  The projected revenue model generation from participant registration fees and
                  sponsorship is estimated at <strong>Rs. {formatIndianCurrency(revenueTotal)}/-</strong> for this event.
                </>
              )}
            </p>
          )}

          <p style={{ margin: "0 0 16px", textAlign: "justify", textJustify: "inter-word" }}>
            Your kind consideration and approval are solicited to proceed with the above events.
          </p>

          <div style={{ marginBottom: "24px" }}>Thanks &amp; Regards,</div>

          {/* Notesheet Signatories */}
          <div
            className="ksac-notesheet-sig-row"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: "44px",
              pageBreakInside: "avoid",
              breakInside: "avoid",
            }}
          >
            <div style={{ textAlign: "left" }}>
              <div style={{ height: "36px" }}></div>
              <div
                style={{
                  borderTop: "1.5px solid #000000",
                  display: "inline-block",
                  minWidth: "220px",
                  paddingTop: "4px",
                }}
              >
                <div style={{ fontWeight: 700 }}>Dr. Ajit Kumar Pasayat</div>
                <div style={{ fontSize: "10pt" }}>Associate Dean, KSAC (Tech)</div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontWeight: 700, fontSize: "10.5pt", marginBottom: "4px" }}>
                Approved By:
              </div>
              <div style={{ height: "36px" }}></div>
              <div
                style={{
                  borderTop: "1.5px solid #000000",
                  display: "inline-block",
                  minWidth: "240px",
                  paddingTop: "4px",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: "10pt", whiteSpace: "pre-line" }}>
                  Pro-Vice Chancellor (Admin)-cum-Registrar{"\n"}KIIT-DU
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Visual page break indicator in preview UI (hidden in print) */}
        <div className="my-8 flex items-center gap-3 print:hidden">
          <div className="flex-1 border-t border-dashed border-slate-300"></div>
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Page Break • Annexures &amp; Proposal Details
          </span>
          <div className="flex-1 border-t border-dashed border-slate-300"></div>
        </div>

        {/* ==================== PAGE 2+: DETAILED PROPOSAL & ANNEXURES ==================== */}
        <div className="ksac-doc-page ksac-page-break">
          {useWideBannerHeader ? <WideBannerHeader /> : <FormalHeader />}

          <div style={{ textAlign: "center", marginBottom: "18px" }}>
            <div
              style={{
                fontSize: "13pt",
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Proposal for {proposal.eventName}
              {proposal.tagline ? ` — ${proposal.tagline}` : ""}
            </div>
            <div
              style={{
                fontSize: "11.5pt",
                fontWeight: 700,
                textDecoration: "underline",
                textUnderlineOffset: "2px",
                marginTop: "4px",
              }}
            >
              Society Name : {proposal.societyFullName || proposal.society} under KSAC
            </div>
            <div style={{ fontSize: "11pt", fontWeight: 700, marginTop: "4px" }}>
              Event Date : {proposal.dateDisplay || proposal.startDate} &nbsp;|&nbsp; Venue :{" "}
              {proposal.venueCampus || "KIIT Campus"}
            </div>
          </div>

          {/* 1. Background */}
          <h3 className="ksac-sec-title" style={{ fontSize: "12pt", fontWeight: 700, margin: "14px 0 6px" }}>
            {sectionCounter++}. Background :-
          </h3>
          <p style={{ margin: "0 0 14px", textAlign: "justify", textJustify: "inter-word", whiteSpace: "pre-line" }}>
            {proposal.background}
          </p>

          {/* Target Audience & Guidelines */}
          {enabled.includes("GUIDELINES") && proposal.guidelines && (
            <div style={{ margin: "12px 0 16px" }}>
              <h4 style={{ fontSize: "11pt", fontWeight: 700, margin: "8px 0 6px" }}>
                Target Audience &amp; Eligibility:
              </h4>
              <ul className="ksac-list" style={{ margin: "4px 0 10px 22px" }}>
                {proposal.guidelines.participantsYear && (
                  <li>
                    <strong>Participants:</strong> {proposal.guidelines.participantsYear}
                  </li>
                )}
                {proposal.guidelines.eligibility && (
                  <li>
                    <strong>Eligibility:</strong> {proposal.guidelines.eligibility}
                  </li>
                )}
                {proposal.guidelines.teamSize && (
                  <li>
                    <strong>Team formation:</strong> {proposal.guidelines.teamSize}
                  </li>
                )}
                {proposal.guidelines.advancementRules && (
                  <li>
                    <strong>Advancement / Selection:</strong> {proposal.guidelines.advancementRules}
                  </li>
                )}
                {proposal.guidelines.extraNotes && <li>{proposal.guidelines.extraNotes}</li>}
              </ul>
            </div>
          )}

          {/* 2. Objective */}
          {Array.isArray(proposal.objectives) && proposal.objectives.length > 0 && (
            <div style={{ marginBottom: "16px" }}>
              <h3 className="ksac-sec-title" style={{ fontSize: "12pt", fontWeight: 700, margin: "14px 0 6px" }}>
                {sectionCounter++}. Objective :-
              </h3>
              <ul className="ksac-list" style={{ margin: "4px 0 10px 22px" }}>
                {proposal.objectives.map((obj: string, i: number) => (
                  <li key={i} style={{ marginBottom: "4px" }}>
                    {obj}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 3. Event Format / Sub-Events */}
          {enabled.includes("SUB_EVENTS") &&
            (proposal.eventFormatSummary ||
              (Array.isArray(proposal.subEvents) && proposal.subEvents.length > 0)) && (
              <div style={{ marginBottom: "16px" }}>
                <h3
                  className="ksac-sec-title"
                  style={{ fontSize: "12pt", fontWeight: 700, margin: "14px 0 6px" }}
                >
                  {sectionCounter++}. Event Format &amp; Structure :-
                </h3>
                {proposal.eventFormatSummary && (
                  <p style={{ margin: "0 0 10px", textAlign: "justify" }}>{proposal.eventFormatSummary}</p>
                )}
                {Array.isArray(proposal.subEvents) &&
                  proposal.subEvents.map((se: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: "10px" }}>
                      <div style={{ fontWeight: 700 }}>
                        Event {idx + 1} — {se.name}
                        {se.dayLabel ? ` - ${se.dayLabel}` : ""}
                        {se.date ? ` - ${se.date}` : ""}
                        {se.timings ? ` - ${se.timings}` : ""}
                      </div>
                      {se.description && (
                        <p style={{ margin: "3px 0 0", textAlign: "justify" }}>{se.description}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}

          {/* 4. Departmental Requirements */}
          {(enabled.includes("VENUE") ||
            enabled.includes("TECHNICAL") ||
            enabled.includes("FOOD") ||
            enabled.includes("MARKETING")) && (
            <div style={{ marginBottom: "18px" }}>
              <h3 className="ksac-sec-title" style={{ fontSize: "12pt", fontWeight: 700, margin: "16px 0 8px" }}>
                {sectionCounter++}. Requirements
              </h3>

              {/* Venue Requirements */}
              {enabled.includes("VENUE") &&
                Array.isArray(proposal.venueRequirements) &&
                proposal.venueRequirements.length > 0 && (
                  <div style={{ marginBottom: "14px" }}>
                    <h4 className="ksac-subsec-title" style={{ fontWeight: 700, margin: "8px 0 6px" }}>
                      A. Venue Requirements
                    </h4>
                    <table
                      className="ksac-table"
                      style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}
                    >
                      <thead>
                        <tr>
                          <th style={{ width: "50px" }}>Sl. No.</th>
                          <th style={{ width: "110px" }}>Date</th>
                          <th style={{ width: "95px" }}>Campus</th>
                          <th style={{ width: "120px" }}>Timings</th>
                          <th style={{ width: "110px" }}>Venue</th>
                          <th style={{ width: "65px" }}>Quantity</th>
                          <th>Details / Purpose</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposal.venueRequirements.map((v: any, idx: number) => (
                          <tr key={idx}>
                            <td style={{ textAlign: "center" }}>{idx + 1}</td>
                            <td>{v.date}</td>
                            <td>{v.campus}</td>
                            <td>{v.timings || "-"}</td>
                            <td>{v.venueType}</td>
                            <td style={{ textAlign: "center" }}>{v.quantity}</td>
                            <td>{v.details || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              {/* Technical Requirements */}
              {enabled.includes("TECHNICAL") &&
                Array.isArray(proposal.technicalRequirements) &&
                proposal.technicalRequirements.length > 0 && (
                  <div style={{ marginBottom: "14px" }}>
                    <h4 className="ksac-subsec-title" style={{ fontWeight: 700, margin: "8px 0 6px" }}>
                      B. Technical &amp; Electrical Requirements
                    </h4>
                    <table
                      className="ksac-table"
                      style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}
                    >
                      <thead>
                        <tr>
                          <th style={{ width: "50px" }}>Sl. No.</th>
                          <th style={{ width: "130px" }}>Dates</th>
                          <th style={{ width: "120px" }}>Timings</th>
                          <th style={{ width: "110px" }}>Venue</th>
                          <th style={{ width: "180px" }}>Requirements</th>
                          <th style={{ width: "65px" }}>Quantity</th>
                          <th>Details / Purpose</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposal.technicalRequirements.map((t: any, idx: number) => (
                          <tr key={idx}>
                            <td style={{ textAlign: "center" }}>{idx + 1}</td>
                            <td>{t.date}</td>
                            <td>{t.timings || "-"}</td>
                            <td>{t.venue || "-"}</td>
                            <td>{t.item}</td>
                            <td style={{ textAlign: "center" }}>{t.quantity}</td>
                            <td>{t.details || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              {/* Accommodation & Food Requirements */}
              {enabled.includes("FOOD") &&
                Array.isArray(proposal.foodRequirements) &&
                proposal.foodRequirements.length > 0 && (
                  <div style={{ marginBottom: "14px" }}>
                    <h4 className="ksac-subsec-title" style={{ fontWeight: 700, margin: "8px 0 6px" }}>
                      C. Accommodation &amp; Food
                    </h4>
                    <table
                      className="ksac-table"
                      style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}
                    >
                      <thead>
                        <tr>
                          <th style={{ width: "50px" }}>Sl. No.</th>
                          <th style={{ width: "140px" }}>Dates</th>
                          <th style={{ width: "200px" }}>Requirements</th>
                          <th style={{ width: "80px" }}>Quantity</th>
                          <th>Details / Purpose</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposal.foodRequirements.map((f: any, idx: number) => (
                          <tr key={idx}>
                            <td style={{ textAlign: "center" }}>{idx + 1}</td>
                            <td>{f.date}</td>
                            <td>{f.item}</td>
                            <td style={{ textAlign: "center" }}>{f.quantity || "-"}</td>
                            <td>{f.details || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

              {/* Marketing & Logistics Requirements */}
              {enabled.includes("MARKETING") &&
                Array.isArray(proposal.marketingRequirements) &&
                proposal.marketingRequirements.length > 0 && (
                  <div style={{ marginBottom: "14px" }}>
                    <h4 className="ksac-subsec-title" style={{ fontWeight: 700, margin: "8px 0 6px" }}>
                      D. Marketing &amp; Other Logistics Requirements
                    </h4>
                    <table
                      className="ksac-table"
                      style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}
                    >
                      <thead>
                        <tr>
                          <th style={{ width: "50px" }}>Sl. No.</th>
                          <th style={{ width: "140px" }}>Date / Interval</th>
                          <th style={{ width: "200px" }}>Items / Requirements</th>
                          <th style={{ width: "120px" }}>Campus</th>
                          <th>Details / Purpose</th>
                        </tr>
                      </thead>
                      <tbody>
                        {proposal.marketingRequirements.map((m: any, idx: number) => (
                          <tr key={idx}>
                            <td style={{ textAlign: "center" }}>{idx + 1}</td>
                            <td>
                              {m.startDate && m.endDate && m.startDate !== m.endDate
                                ? `${m.startDate} - ${m.endDate}`
                                : m.startDate || proposal.dateDisplay}
                            </td>
                            <td>{m.item}</td>
                            <td>{m.campus || "-"}</td>
                            <td>{m.details || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
            </div>
          )}

          {/* 5. Revenue Model */}
          {enabled.includes("REVENUE") &&
            Array.isArray(proposal.revenueItems) &&
            proposal.revenueItems.length > 0 && (
              <div style={{ marginBottom: "18px" }}>
                <h3
                  className="ksac-sec-title"
                  style={{ fontSize: "12pt", fontWeight: 700, margin: "16px 0 8px" }}
                >
                  {sectionCounter++}. Revenue Model
                </h3>
                <table className="ksac-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "60px" }}>Sl No.</th>
                      <th>Source</th>
                      <th style={{ width: "150px" }}>Amount</th>
                      <th style={{ width: "150px" }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.revenueItems.map((r: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ textAlign: "center" }}>{idx + 1}</td>
                        <td>{r.source}</td>
                        <td style={{ textAlign: "right" }}>{r.amountFormula}</td>
                        <td style={{ textAlign: "right" }}>
                          {formatIndianCurrency(r.total)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} style={{ textAlign: "right", fontWeight: 700 }}>
                        Total
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        {formatIndianCurrency(revenueTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

          {/* 6. Budget Breakdown */}
          {enabled.includes("BUDGET") &&
            Array.isArray(proposal.budgetItems) &&
            proposal.budgetItems.length > 0 && (
              <div style={{ marginBottom: "18px" }}>
                <h3
                  className="ksac-sec-title"
                  style={{ fontSize: "12pt", fontWeight: 700, margin: "16px 0 6px" }}
                >
                  {sectionCounter++}. Budget :-
                </h3>
                {proposal.includeGstNote !== false && (
                  <p style={{ fontSize: "10pt", fontStyle: "italic", margin: "0 0 8px" }}>
                    (N.B. The budget distribution provided below is calculated prior to the inclusion of Goods
                    and Services Tax (GST). Applicable GST, in accordance with prevailing Government
                    Regulations, will be added, and the final cost may vary.)
                  </p>
                )}
                <table className="ksac-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr>
                      <th style={{ width: "55px" }}>Sl No.</th>
                      <th>Particulars</th>
                      <th style={{ width: "75px" }}>Quantity</th>
                      <th style={{ width: "110px" }}>Pricing</th>
                      <th style={{ width: "140px" }}>Tentative Cost (in Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.budgetItems.map((b: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ textAlign: "center" }}>{idx + 1}</td>
                        <td>{b.particulars}</td>
                        <td style={{ textAlign: "center" }}>{b.quantity}</td>
                        <td style={{ textAlign: "right" }}>{b.unitPrice}</td>
                        <td style={{ textAlign: "right" }}>
                          {formatIndianCurrency(b.totalCost)}
                        </td>
                      </tr>
                    ))}
                    <tr>
                      <td
                        colSpan={4}
                        style={{
                          textAlign: "right",
                          fontWeight: 700,
                        }}
                      >
                        Total Amount
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        ₹ {formatIndianCurrency(budgetTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div style={{ marginTop: "6px", fontSize: "11pt" }}>
                  <strong>Grand Total: Rs. {formatIndianCurrency(budgetTotal)}/-</strong>
                  <br />
                  <strong>In words:</strong> {budgetWords}
                </div>
              </div>
            )}

          {/* 7. Speaker Details */}
          {enabled.includes("SPEAKER") && proposal.speakerDetails?.name && (
            <div style={{ marginBottom: "18px" }}>
              <h3
                className="ksac-sec-title"
                style={{ fontSize: "12pt", fontWeight: 700, margin: "16px 0 6px" }}
              >
                {sectionCounter++}. Speaker Details
              </h3>
              <div style={{ fontWeight: 700, fontSize: "11.5pt" }}>{proposal.speakerDetails.name}</div>
              {proposal.speakerDetails.title && (
                <div style={{ fontWeight: 700, marginBottom: "6px" }}>{proposal.speakerDetails.title}</div>
              )}
              {proposal.speakerDetails.bio && (
                <p style={{ margin: "4px 0 8px", textAlign: "justify" }}>{proposal.speakerDetails.bio}</p>
              )}
              {proposal.speakerDetails.managerContact && (
                <div style={{ marginBottom: "8px" }}>
                  <strong>Manager&apos;s Contact info :</strong> {proposal.speakerDetails.managerContact}
                </div>
              )}
              {Array.isArray(proposal.speakerDetails.feeItems) &&
                proposal.speakerDetails.feeItems.length > 0 && (
                  <table className="ksac-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "55px" }}>Sl No.</th>
                        <th>Particulars</th>
                        <th style={{ width: "75px" }}>Quantity</th>
                        <th style={{ width: "110px" }}>Pricing</th>
                        <th style={{ width: "140px" }}>Cost (in Rs.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.speakerDetails.feeItems.map((f: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ textAlign: "center" }}>{idx + 1}</td>
                          <td>{f.particulars}</td>
                          <td style={{ textAlign: "center" }}>{f.quantity}</td>
                          <td style={{ textAlign: "right" }}>
                            {formatIndianCurrency(f.pricing)}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            {formatIndianCurrency(f.total)}
                          </td>
                        </tr>
                      ))}
                      <tr>
                        <td
                          colSpan={4}
                          style={{
                            textAlign: "right",
                            fontWeight: 700,
                          }}
                        >
                          TOTAL
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          {formatIndianCurrency(proposal.speakerDetails.speakerTotal || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
            </div>
          )}

          {/* Bounded Summary and Signatories Block (Prevents orphaned signatures) */}
          <div className="ksac-summary-and-signatures" style={{ breakInside: "avoid", pageBreakInside: "avoid", marginTop: "16px" }}>
            {/* 8. Summary */}
            <div style={{ marginBottom: "20px" }}>
              <h3 className="ksac-sec-title" style={{ fontSize: "11.5pt", fontWeight: 700, margin: "14px 0 6px" }}>
                {sectionCounter++}. Summary
              </h3>
              <p style={{ margin: 0, textAlign: "justify", textJustify: "inter-word" }}>
                {proposal.summary ? (
                  proposal.summary
                ) : (
                  <>
                    These arrangements are essential to ensure <strong>{proposal.eventName}</strong> runs
                    smoothly and reflects well on <strong>{proposal.society}</strong>,{" "}
                    <strong>KSAC</strong>, and <strong>KIIT Deemed to be University</strong>. We seek KSAC&apos;s
                    kind approval and support in executing the above requirements.
                  </>
                )}
              </p>
            </div>

            {/* Official Multi-Signatory Footer Grid (FIC, Assoc Dean, Deputy Director, Registrar) */}
            <div
              className="ksac-footer-sig-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, 1fr)",
                gap: "28px 32px",
                marginTop: "36px",
                pageBreakInside: "avoid",
                breakInside: "avoid",
              }}
            >
              {(footerSignatories.length > 0
                ? footerSignatories
                : [
                    { roleTitle: `FIC`, name: "", designation: `FIC, ${proposal.society} KIIT` },
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
                      designation: "Pro-Vice Chancellor - Cum - Registrar, KIIT-DU",
                    },
                  ]
              ).map((sig: any, idx: number, arr: any[]) => (
                <div
                  key={idx}
                  className="ksac-sig-box"
                  style={{
                    paddingTop: "24px",
                    gridColumn: idx === 4 && arr.length === 5 ? "span 2" : "span 1",
                    textAlign: idx === 4 && arr.length === 5 ? "center" : "left",
                  }}
                >
                  <div
                    className="ksac-sig-line"
                    style={{
                      borderTop: "1.5px solid #000000",
                      display: "inline-block",
                      minWidth: "220px",
                      paddingTop: "4px",
                      fontWeight: 700,
                    }}
                  >
                    {sig.name && <div>{sig.name}</div>}
                    <div style={{ fontSize: "10pt" }}>{sig.designation || sig.roleTitle}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

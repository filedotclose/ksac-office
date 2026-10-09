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

  let sectionCounter = 1;

  const recipientLines = String(
    proposal.notesheetRecipient || "The Pro-Vice Chancellor (Admin)-cum-Registrar\nKIIT-DU"
  )
    .split(/\r?\n|,/)
    .map((s) => s.trim())
    .filter(Boolean);

  const societyLogoUrl = proposal.societyLogo?.dataUrl || "";

  const generateStandaloneHtml = (autoPrint = false): string => {
    return generateProposalDocumentHtml(proposal, {
      useWideBannerHeader,
      autoPrint,
    });
  };

  const handlePrintOfficialCopy = () => {
    const fullHtml = generateStandaloneHtml(true);
    if (!fullHtml) return;

    const printWin = window.open("", "_blank", "width=960,height=920");
    if (printWin) {
      printWin.document.open();
      printWin.document.write(fullHtml);
      printWin.document.close();
      return;
    }

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
      console.warn("Iframe print fallback encountered exception:", e);
    }

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
      <div style={{ minWidth: "65px", textAlign: "left", flexShrink: 0 }}>
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
            fontSize: "13.5pt",
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
            fontSize: "11.5pt",
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
            fontSize: "9pt",
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

      {/* KSAC & Society Emblem */}
      <div
        style={{
          minWidth: "65px",
          display: "flex",
          justifyContent: "flex-end",
          alignItems: "center",
          gap: "6px",
          flexShrink: 0,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={KSAC_LOGO_BASE64}
          alt="KSAC"
          style={{ width: "52px", height: "46px", objectFit: "contain", display: "block" }}
        />
        {societyLogoUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={societyLogoUrl}
            alt={`${proposal.society || "Society"} Logo`}
            style={{ width: "48px", height: "46px", objectFit: "contain", display: "block", borderRadius: "4px" }}
          />
        )}
      </div>
    </div>
  );

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
            Official KSAC Document Preview (A4 Portrait)
          </span>
          <p className="text-xs text-slate-500">
            Formatted with dedicated Independent Budget Page &amp; Signatories, Society Logo, Security &amp; Felicitation.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => setUseWideBannerHeader((prev) => !prev)}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            {useWideBannerHeader ? "Header: Wide Banner" : "Header: Standard Letterhead"}
          </button>

          {canPrint ? (
            <button
              type="button"
              onClick={handlePrintOfficialCopy}
              className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-emerald-700 active:scale-95"
            >
              Print / Save PDF (A4)
            </button>
          ) : (
            <span className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
              Printout unlocks upon Dean KSAC approval
            </span>
          )}

          <button
            type="button"
            onClick={handleDownloadStandaloneHtml}
            className="rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
          >
            Download HTML
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
        .ksac-budget-standalone-page {
          page-break-before: always;
          break-before: page;
          page-break-inside: avoid;
          break-inside: avoid;
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
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
          }
        }
      `,
        }}
      />

      <div
        id="ksac-printable-document"
        ref={printContainerRef}
        className="ksac-doc-surface mx-auto max-w-[820px] rounded-xl border border-slate-300 bg-white p-8 sm:p-12 shadow-md print:max-w-none print:border-none print:p-0 print:shadow-none"
      >
        {/* ==================== PAGE 1: NOTESHEET ==================== */}
        <div>
          {useWideBannerHeader ? <WideBannerHeader /> : <FormalHeader />}

          <div
            style={{
              textAlign: "center",
              fontSize: "13.5pt",
              fontWeight: 700,
              textDecoration: "underline",
              textUnderlineOffset: "3px",
              margin: "12px 0 10px",
              letterSpacing: "0.5px",
            }}
          >
            NOTESHEET
          </div>

          <div style={{ textAlign: "right", fontWeight: 600, fontSize: "11pt", marginBottom: "12px" }}>
            Date: {proposal.submissionDate || proposal.startDate || "10th October 2026"}
          </div>

          <div style={{ marginBottom: "12px", lineHeight: "1.32" }}>
            <div style={{ fontWeight: 600 }}>To</div>
            {recipientLines.map((line, idx) => (
              <div key={idx} style={{ fontWeight: 600 }}>
                {line}
              </div>
            ))}
          </div>

          <div style={{ margin: "12px 0 10px", fontWeight: 700, lineHeight: "1.35" }}>
            Sub: Proposal &amp; Budget approval for{" "}
            <span style={{ textDecoration: "underline" }}>&ldquo;{proposal.eventName || "Event"}&rdquo;</span>
            {proposal.tagline ? ` (${proposal.tagline})` : ""} event on{" "}
            <span>{proposal.dateDisplay || proposal.startDate || "Upcoming"}</span> ({proposal.society || "KSAC"}{" "}
            Society under KSAC).
          </div>

          <div style={{ fontWeight: 700, marginBottom: "8px" }}>Respected Sir,</div>

          <p style={{ margin: "0 0 8px 0", textAlign: "justify" }}>
            {proposal.notesheetIntro ||
              `The KIIT ${
                proposal.society || "KSAC"
              } Society under the KIIT Student Activity Centre (KSAC) has planned to organize an ${(
                proposal.eventMode || "OFFLINE"
              ).toLowerCase()} event titled “${proposal.eventName || "Event"}” on ${
                proposal.dateDisplay || proposal.startDate || "Upcoming"
              } at ${
                proposal.venueCampus || "KIIT Deemed to be University Campus"
              }. The detailed event proposal, security requisitions, promotional flex specs, and itemized budget split are attached in the following annexures for kind perusal.`}
          </p>

          {proposal.ocHeadcount && (
            <p style={{ margin: "0 0 8px 0", textAlign: "justify" }}>
              The event will be managed and coordinated under the direct supervision of the{" "}
              <strong>{proposal.ocHeadcount}-member Organising Committee of {proposal.society}</strong>.
            </p>
          )}

          {enabled.includes("BUDGET") && budgetTotal > 0 && (
            <p style={{ margin: "0 0 8px 0", textAlign: "justify" }}>
              A total budget of{" "}
              <strong>
                Rs. {formatIndianCurrency(budgetTotal)}/- ({budgetWords})
              </strong>{" "}
              is submitted for your kind review and approval.
            </p>
          )}

          {enabled.includes("REVENUE") && revenueTotal > 0 && (
            <p style={{ margin: "0 0 8px 0", textAlign: "justify" }}>
              {proposal.revenueSummaryLine ||
                `The projected revenue generation from participant registration fees and sponsorship is estimated at Rs. ${formatIndianCurrency(
                  revenueTotal
                )}/- for this event.`}
            </p>
          )}

          <p style={{ margin: "0 0 8px 0", textAlign: "justify" }}>
            Your kind consideration and approval are solicited to proceed with the above event.
          </p>

          <div style={{ marginTop: "10px", marginBottom: "16px" }}>Thanks &amp; Regards,</div>

          {/* Notesheet Signatories */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-end",
              marginTop: "36px",
              breakInside: "avoid",
            }}
          >
            <div style={{ minWidth: "220px" }}>
              <div style={{ height: "38px" }} />
              <div style={{ borderTop: "1.5px solid #000000", paddingTop: "4px", fontWeight: 700, fontSize: "10.5pt" }}>
                <div>{notesheetSignatories[0]?.name || "Dr. Ajit Kumar Pasayat"}</div>
                <div style={{ fontSize: "10pt", whiteSpace: "pre-line" }}>
                  {notesheetSignatories[0]?.designation || "Associate Dean, KSAC (Tech)"}
                </div>
              </div>
            </div>

            <div style={{ minWidth: "220px" }}>
              <div style={{ fontWeight: 700, fontSize: "11pt", marginBottom: "2px" }}>Approved By:</div>
              <div style={{ height: "20px" }} />
              <div style={{ borderTop: "1.5px solid #000000", paddingTop: "4px", fontWeight: 700, fontSize: "10.5pt" }}>
                {notesheetSignatories[1]?.name && <div>{notesheetSignatories[1].name}</div>}
                <div style={{ fontSize: "10pt", whiteSpace: "pre-line" }}>
                  {notesheetSignatories[1]?.designation || "Pro-Vice Chancellor (Admin)-cum-Registrar\nKIIT-DU"}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== PAGE 2: PROPOSAL & REQUIREMENTS ==================== */}
        <div className="ksac-page-break" style={{ paddingTop: "18px" }}>
          {useWideBannerHeader ? <WideBannerHeader /> : <FormalHeader />}

          <div style={{ textAlign: "center", marginBottom: "14px", breakAfter: "avoid" }}>
            <div style={{ fontSize: "13pt", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "3px" }}>
              Proposal for {proposal.eventName || "Event"}
              {proposal.tagline ? ` - ${proposal.tagline}` : ""}
            </div>
            <div style={{ fontSize: "11pt", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "2px", marginTop: "3px" }}>
              Society Name : {proposal.societyFullName || proposal.society || "KSAC"} under KSAC
            </div>
            <div style={{ fontSize: "10.5pt", fontWeight: 700, marginTop: "3px" }}>
              Event Date : {proposal.dateDisplay || proposal.startDate || "Upcoming"} &nbsp;|&nbsp; Venue :{" "}
              {proposal.venueCampus || "KIIT Campus"}
            </div>
          </div>

          {/* Background */}
          {proposal.background && (
            <div style={{ marginBottom: "12px" }}>
              <h3 className="ksac-sec-title">{sectionCounter++}. Background :-</h3>
              <p style={{ margin: "0 0 8px 0", textAlign: "justify", whiteSpace: "pre-line" }}>
                {proposal.background}
              </p>
            </div>
          )}

          {/* Guidelines */}
          {enabled.includes("GUIDELINES") && proposal.guidelines && (
            <div style={{ margin: "8px 0 12px 0" }}>
              <h4 className="ksac-subsec-title">Target Audience &amp; Eligibility:</h4>
              <ul style={{ margin: "3px 0 8px 22px", padding: 0 }}>
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

          {/* Objectives */}
          {Array.isArray(proposal.objectives) && proposal.objectives.length > 0 && (
            <div style={{ marginBottom: "12px" }}>
              <h3 className="ksac-sec-title">{sectionCounter++}. Objective :-</h3>
              <ul style={{ margin: "3px 0 8px 22px", padding: 0 }}>
                {proposal.objectives.map((obj: string, i: number) => (
                  <li key={i}>{obj}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sub-Events */}
          {enabled.includes("SUB_EVENTS") &&
            (proposal.eventFormatSummary ||
              (Array.isArray(proposal.subEvents) && proposal.subEvents.length > 0)) && (
              <div style={{ marginBottom: "14px" }}>
                <h3 className="ksac-sec-title">{sectionCounter++}. Event Format &amp; Structure :-</h3>
                {proposal.eventFormatSummary && (
                  <p style={{ margin: "0 0 6px 0", textAlign: "justify" }}>{proposal.eventFormatSummary}</p>
                )}
                {Array.isArray(proposal.subEvents) &&
                  proposal.subEvents.map((se: any, idx: number) => (
                    <div key={idx} style={{ marginBottom: "8px" }}>
                      <div style={{ fontWeight: 700 }}>
                        Event {idx + 1} - {se.name || "Session"}
                        {se.dayLabel ? ` - ${se.dayLabel}` : ""}
                        {se.date ? ` - ${se.date}` : ""}
                        {se.timings ? ` [${se.timings}]` : ""}
                      </div>
                      {se.description && (
                        <p style={{ margin: "2px 0 0 0", textAlign: "justify" }}>{se.description}</p>
                      )}
                    </div>
                  ))}
              </div>
            )}

          {/* Operational Requirements Section */}
          <div style={{ marginBottom: "14px" }}>
            <h3 className="ksac-sec-title">{sectionCounter++}. Operational &amp; Campus Requirements</h3>

            {/* Venue Requirements */}
            {enabled.includes("VENUE") &&
              Array.isArray(proposal.venueRequirements) &&
              proposal.venueRequirements.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <h4 className="ksac-subsec-title">A. Venue Requirements</h4>
                  <table className="ksac-table">
                    <thead>
                      <tr>
                        <th style={{ width: "45px" }}>Sl. No.</th>
                        <th style={{ width: "105px" }}>Date</th>
                        <th style={{ width: "90px" }}>Campus</th>
                        <th style={{ width: "110px" }}>Timings</th>
                        <th style={{ width: "110px" }}>Venue</th>
                        <th style={{ width: "60px" }}>Quantity</th>
                        <th>Details / Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.venueRequirements.map((v: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ textAlign: "center" }}>{idx + 1}</td>
                          <td>{v.date || "-"}</td>
                          <td>{v.campus || "-"}</td>
                          <td>{v.timings || "-"}</td>
                          <td>{v.venueType || "-"}</td>
                          <td style={{ textAlign: "center" }}>{v.quantity || "-"}</td>
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
                <div style={{ marginBottom: "10px" }}>
                  <h4 className="ksac-subsec-title">B. Technical &amp; Electrical Requirements</h4>
                  <table className="ksac-table">
                    <thead>
                      <tr>
                        <th style={{ width: "45px" }}>Sl. No.</th>
                        <th style={{ width: "115px" }}>Dates</th>
                        <th style={{ width: "110px" }}>Timings</th>
                        <th style={{ width: "110px" }}>Venue</th>
                        <th style={{ width: "160px" }}>Requirements</th>
                        <th style={{ width: "60px" }}>Quantity</th>
                        <th>Details / Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.technicalRequirements.map((t: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ textAlign: "center" }}>{idx + 1}</td>
                          <td>{t.date || "-"}</td>
                          <td>{t.timings || "-"}</td>
                          <td>{t.venue || "-"}</td>
                          <td>{t.item || "-"}</td>
                          <td style={{ textAlign: "center" }}>{t.quantity || "-"}</td>
                          <td>{t.details || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {/* Food Requirements */}
            {enabled.includes("FOOD") &&
              Array.isArray(proposal.foodRequirements) &&
              proposal.foodRequirements.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <h4 className="ksac-subsec-title">C. Accommodation &amp; Food Requirements</h4>
                  <table className="ksac-table">
                    <thead>
                      <tr>
                        <th style={{ width: "45px" }}>Sl. No.</th>
                        <th style={{ width: "130px" }}>Dates</th>
                        <th style={{ width: "180px" }}>Requirements</th>
                        <th style={{ width: "75px" }}>Quantity</th>
                        <th>Details / Purpose</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.foodRequirements.map((f: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ textAlign: "center" }}>{idx + 1}</td>
                          <td>{f.date || "-"}</td>
                          <td>{f.item || "-"}</td>
                          <td style={{ textAlign: "center" }}>{f.quantity || "-"}</td>
                          <td>{f.details || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {/* Marketing Requirements */}
            {enabled.includes("MARKETING") &&
              Array.isArray(proposal.marketingRequirements) &&
              proposal.marketingRequirements.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <h4 className="ksac-subsec-title">D. Marketing &amp; Logistics Requirements</h4>
                  <table className="ksac-table">
                    <thead>
                      <tr>
                        <th style={{ width: "45px" }}>Sl. No.</th>
                        <th style={{ width: "130px" }}>Date / Interval</th>
                        <th style={{ width: "180px" }}>Items / Requirements</th>
                        <th style={{ width: "110px" }}>Campus</th>
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
                              : m.startDate || proposal.dateDisplay || "-"}
                          </td>
                          <td>{m.item || "-"}</td>
                          <td>{m.campus || "-"}</td>
                          <td>{m.details || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {/* Security Requirements */}
            {enabled.includes("SECURITY") &&
              Array.isArray(proposal.securityRequirements) &&
              proposal.securityRequirements.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <h4 className="ksac-subsec-title">E. Security &amp; Crowd Management Requirements</h4>
                  <table className="ksac-table">
                    <thead>
                      <tr>
                        <th style={{ width: "45px" }}>Sl. No.</th>
                        <th style={{ width: "110px" }}>Date</th>
                        <th style={{ width: "100px" }}>Timings</th>
                        <th style={{ width: "100px" }}>Campus / Gate</th>
                        <th style={{ width: "180px" }}>Security Requisition</th>
                        <th style={{ width: "65px" }}>Guards</th>
                        <th>Access &amp; Crowd Details</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.securityRequirements.map((s: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ textAlign: "center" }}>{idx + 1}</td>
                          <td>{s.date || "-"}</td>
                          <td>{s.timings || "-"}</td>
                          <td>{s.campus || proposal.venueCampus || "-"}</td>
                          <td>{s.securityType || s.item || "Security Guards"}</td>
                          <td style={{ textAlign: "center" }}>{s.quantity || "1"}</td>
                          <td>{s.details || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

            {/* Felicitation Requirements */}
            {enabled.includes("FELICITATION") &&
              Array.isArray(proposal.felicitationRequirements) &&
              proposal.felicitationRequirements.length > 0 && (
                <div style={{ marginBottom: "10px" }}>
                  <h4 className="ksac-subsec-title">F. Dignitary Felicitation &amp; Hospitality Protocol Material</h4>
                  <table className="ksac-table">
                    <thead>
                      <tr>
                        <th style={{ width: "45px" }}>Sl. No.</th>
                        <th style={{ width: "110px" }}>Date</th>
                        <th style={{ width: "200px" }}>Felicitation Item / Material</th>
                        <th style={{ width: "65px" }}>Quantity</th>
                        <th style={{ width: "180px" }}>Recipient Dignitary</th>
                        <th>Specifications / Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.felicitationRequirements.map((f: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ textAlign: "center" }}>{idx + 1}</td>
                          <td>{f.date || "-"}</td>
                          <td>{f.item || "-"}</td>
                          <td style={{ textAlign: "center" }}>{f.quantity || "1"}</td>
                          <td>{f.recipientDignitary || "Dignitary / Guest"}</td>
                          <td>{f.details || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
          </div>

          {/* Sponsors & MoU */}
          {enabled.includes("SPONSORS") &&
            Array.isArray(proposal.sponsors) &&
            proposal.sponsors.length > 0 && (
              <div style={{ marginBottom: "14px" }}>
                <h3 className="ksac-sec-title">{sectionCounter++}. Event Sponsors &amp; Memorandum of Understanding (MoU) :-</h3>
                <table className="ksac-table">
                  <thead>
                    <tr>
                      <th style={{ width: "45px" }}>Sl. No.</th>
                      <th>Sponsor / Partner Name</th>
                      <th style={{ width: "140px" }}>Partnership Tier</th>
                      <th style={{ width: "130px" }}>Contribution (Rs.)</th>
                      <th style={{ width: "140px" }}>MoU Document Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.sponsors.map((sp: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ textAlign: "center" }}>{idx + 1}</td>
                        <td>
                          <strong>{sp.name || "-"}</strong>
                          {sp.contactPerson && (
                            <div style={{ fontSize: "8.5pt", color: "#475569" }}>Contact: {sp.contactPerson}</div>
                          )}
                        </td>
                        <td>{sp.tier || "Associate Partner"}</td>
                        <td style={{ textAlign: "right" }}>Rs. {formatIndianCurrency(sp.contributionAmount || 0)}/-</td>
                        <td style={{ textAlign: "center" }}>
                          {sp.mouFileName ? (
                            <span style={{ color: "#047857", fontWeight: 700 }}>MoU Attached ({sp.mouFileName})</span>
                          ) : (
                            <span style={{ color: "#64748b" }}>Under Process</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

          {/* Promotional Banners & Posters Specifications */}
          {(proposal.bannerDetails?.fileName || proposal.posterDetails?.fileName) && (
            <div style={{ marginBottom: "14px" }}>
              <h3 className="ksac-sec-title">{sectionCounter++}. Promotional Branding &amp; Printing Specifications :-</h3>
              <table className="ksac-table">
                <thead>
                  <tr>
                    <th style={{ width: "130px" }}>Asset Type</th>
                    <th style={{ width: "180px" }}>Format &amp; Sizing</th>
                    <th style={{ width: "120px" }}>Material / Media</th>
                    <th>Uploaded Artwork File</th>
                  </tr>
                </thead>
                <tbody>
                  {proposal.bannerDetails?.fileName && (
                    <tr>
                      <td><strong>Event Flex Banner</strong></td>
                      <td>{proposal.bannerDetails.dimensions || proposal.bannerDetails.format || "12x8 ft"}</td>
                      <td>{proposal.bannerDetails.material || "Star Flex"}</td>
                      <td>{proposal.bannerDetails.fileName}</td>
                    </tr>
                  )}
                  {proposal.posterDetails?.fileName && (
                    <tr>
                      <td><strong>Official Poster</strong></td>
                      <td>{proposal.posterDetails.format || "A3 Physical Print"}</td>
                      <td>Glossy Paper / Digital</td>
                      <td>{proposal.posterDetails.fileName}</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Operational Summary */}
          <div style={{ marginTop: "14px" }}>
            <h3 className="ksac-sec-title">{sectionCounter++}. Operational Summary</h3>
            <p style={{ margin: "0 0 8px 0", textAlign: "justify" }}>
              {proposal.summary ||
                `These arrangements are essential to ensure “${
                  proposal.eventName || "the event"
                }” runs smoothly and reflects well on ${
                  proposal.society || "KSAC"
                }, KSAC, and KIIT Deemed to be University. The complete financial breakdown and statutory approval signatures follow on the next dedicated budget page.`}
            </p>
          </div>
        </div>

        {/* ==================== PAGE 3: INDEPENDENT BUDGET PAGE ==================== */}
        <div className="ksac-budget-standalone-page" style={{ paddingTop: "20px" }}>
          {useWideBannerHeader ? <WideBannerHeader /> : <FormalHeader />}

          <div style={{ textAlign: "center", marginBottom: "12px" }}>
            <div style={{ fontSize: "13pt", fontWeight: 700, textDecoration: "underline", textUnderlineOffset: "3px" }}>
              OFFICIAL EVENT BUDGET &amp; EXPENDITURE STATEMENT
            </div>
            <div style={{ fontSize: "10pt", fontWeight: 600, color: "#334155", marginTop: "2px" }}>
              Annexure: Itemized Financial Sanction &amp; Signatories Matrix
            </div>
            <div style={{ fontSize: "10pt", fontWeight: 700, marginTop: "4px" }}>
              Event: {proposal.eventName || "Event"} &nbsp;|&nbsp; Society: {proposal.society || "KSAC"} &nbsp;|&nbsp; Dates: {proposal.dateDisplay || proposal.startDate || "Upcoming"}
            </div>
          </div>

          {/* Itemized Budget Table */}
          {enabled.includes("BUDGET") &&
          Array.isArray(proposal.budgetItems) &&
          proposal.budgetItems.length > 0 ? (
            <div style={{ marginBottom: "10px" }}>
              {proposal.includeGstNote !== false && (
                <p style={{ fontSize: "9pt", fontStyle: "italic", margin: "0 0 5px 0" }}>
                  (N.B. The budget distribution provided below is calculated prior to the inclusion of Goods and Services Tax (GST). Applicable GST, in accordance with prevailing Government Regulations, will be added, and the final cost may vary.)
                </p>
              )}
              <table className="ksac-table">
                <thead>
                  <tr>
                    <th style={{ width: "45px" }}>Sl No.</th>
                    <th>Particulars</th>
                    <th style={{ width: "65px" }}>Quantity</th>
                    <th style={{ width: "95px" }}>Pricing</th>
                    <th style={{ width: "125px" }}>Tentative Cost (in Rs.)</th>
                  </tr>
                </thead>
                <tbody>
                  {proposal.budgetItems.map((b: any, idx: number) => (
                    <tr key={idx}>
                      <td style={{ textAlign: "center" }}>{idx + 1}</td>
                      <td>{b.particulars || "-"}</td>
                      <td style={{ textAlign: "center" }}>{b.quantity || "-"}</td>
                      <td style={{ textAlign: "right" }}>{b.unitPrice || "-"}</td>
                      <td style={{ textAlign: "right" }}>{formatIndianCurrency(b.totalCost || 0)}</td>
                    </tr>
                  ))}
                  <tr>
                    <td colSpan={4} style={{ textAlign: "right", fontWeight: 700 }}>
                      Total Amount
                    </td>
                    <td style={{ textAlign: "right", fontWeight: 700 }}>
                      Rs. {formatIndianCurrency(budgetTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>

              <div
                style={{
                  border: "1px solid #000000",
                  padding: "8px 12px",
                  backgroundColor: "#fafafa",
                  margin: "6px 0 12px",
                }}
              >
                <strong>Grand Total Approved Budget: Rs. {formatIndianCurrency(budgetTotal)}/-</strong>
                <br />
                <strong>In words:</strong> {budgetWords}
              </div>
            </div>
          ) : (
            <div style={{ border: "1px dashed #94a3b8", padding: "16px", textAlign: "center", marginBottom: "12px", fontStyle: "italic" }}>
              No separate monetary expenditure requested from KSAC university funds for this event.
            </div>
          )}

          {/* Revenue Model (if enabled) */}
          {enabled.includes("REVENUE") &&
            Array.isArray(proposal.revenueItems) &&
            proposal.revenueItems.length > 0 && (
              <div style={{ marginBottom: "10px" }}>
                <h4 className="ksac-subsec-title">Revenue Projections &amp; Self-Sponsorship:</h4>
                <table className="ksac-table">
                  <thead>
                    <tr>
                      <th style={{ width: "45px" }}>Sl No.</th>
                      <th>Revenue Source</th>
                      <th style={{ width: "130px" }}>Amount Projection</th>
                      <th style={{ width: "130px" }}>Total (in Rs.)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {proposal.revenueItems.map((r: any, idx: number) => (
                      <tr key={idx}>
                        <td style={{ textAlign: "center" }}>{idx + 1}</td>
                        <td>{r.source || "-"}</td>
                        <td style={{ textAlign: "right" }}>{r.amountFormula || "-"}</td>
                        <td style={{ textAlign: "right" }}>{formatIndianCurrency(r.total || 0)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td colSpan={3} style={{ textAlign: "right", fontWeight: 700 }}>
                        Total Projected Revenue
                      </td>
                      <td style={{ textAlign: "right", fontWeight: 700 }}>
                        Rs. {formatIndianCurrency(revenueTotal)}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

          {/* Speaker Fee (if enabled) */}
          {enabled.includes("SPEAKER") && proposal.speakerDetails?.name && (
            <div style={{ marginBottom: "10px" }}>
              <h4 className="ksac-subsec-title">Speaker / Dignitary Honorarium &amp; Logistics:</h4>
              <div style={{ fontWeight: 700, fontSize: "10pt" }}>
                {proposal.speakerDetails.name}{" "}
                {proposal.speakerDetails.title ? `(${proposal.speakerDetails.title})` : ""}
              </div>
              {Array.isArray(proposal.speakerDetails.feeItems) &&
                proposal.speakerDetails.feeItems.length > 0 && (
                  <table className="ksac-table" style={{ marginTop: "4px" }}>
                    <thead>
                      <tr>
                        <th style={{ width: "45px" }}>Sl No.</th>
                        <th>Particulars</th>
                        <th style={{ width: "65px" }}>Quantity</th>
                        <th style={{ width: "95px" }}>Pricing</th>
                        <th style={{ width: "125px" }}>Cost (in Rs.)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {proposal.speakerDetails.feeItems.map((f: any, idx: number) => (
                        <tr key={idx}>
                          <td style={{ textAlign: "center" }}>{idx + 1}</td>
                          <td>{f.particulars || "-"}</td>
                          <td style={{ textAlign: "center" }}>{f.quantity || "-"}</td>
                          <td style={{ textAlign: "right" }}>{formatIndianCurrency(f.pricing || 0)}</td>
                          <td style={{ textAlign: "right" }}>{formatIndianCurrency(f.total || 0)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td colSpan={4} style={{ textAlign: "right", fontWeight: 700 }}>
                          Speaker Total
                        </td>
                        <td style={{ textAlign: "right", fontWeight: 700 }}>
                          Rs. {formatIndianCurrency(proposal.speakerDetails.speakerTotal || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                )}
            </div>
          )}

          {/* Official Signatories Matrix ON THIS EXACT SAME BUDGET PAGE */}
          <div className="ksac-summary-and-signatures" style={{ marginTop: "18px" }}>
            <div style={{ fontWeight: 700, fontSize: "10pt", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: "4px" }}>
              Official Requisition &amp; Budget Sanction Signatories:
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px 24px",
                marginTop: "20px",
                breakInside: "avoid",
              }}
            >
              {(footerSignatories.length > 0
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
              ).map((sig: any, idx: number, arr: any[]) => (
                <div key={idx} style={{ minWidth: "190px", gridColumn: idx === 4 && arr.length === 5 ? "span 2" : undefined, textAlign: idx === 4 && arr.length === 5 ? "center" : undefined }}>
                  <div style={{ height: "38px" }} />
                  <div style={{ borderTop: "1.5px solid #000000", paddingTop: "4px", fontWeight: 700, fontSize: "10.5pt" }}>
                    {sig.name && <div>{sig.name}</div>}
                    <div style={{ fontSize: "10pt", whiteSpace: "pre-line" }}>{sig.designation || sig.roleTitle}</div>
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

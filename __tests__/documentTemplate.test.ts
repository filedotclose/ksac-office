import { test } from "node:test";
import assert from "node:assert/strict";
import { generateProposalDocumentHtml } from "../lib/proposalDocumentTemplate";

test("generateProposalDocumentHtml renders publication-quality HTML with letterheads & tables", () => {
  const sampleProposal = {
    eventName: "OMEGA 6.0 Annual Flagship",
    society: "FED Society",
    academicYear: "2025-2026",
    datesDisplay: "22nd - 24th November 2026",
    expectedParticipants: 450,
    background: "Flagship entrepreneurship and hackathon summit organized by FED Society.",
    enabledSections: ["SUB_EVENTS", "BUDGET", "VENUE"],
    budgetItems: [
      { slNo: 1, particulars: "Stage & LED Backdrop", quantity: "1", unitPrice: "25000", totalCost: 25000 },
      { slNo: 2, particulars: "Mementos & Trophies", quantity: "10", unitPrice: "1200", totalCost: 12000 },
    ],
    budgetTotal: 37000,
    budgetInWords: "Thirty-Seven Thousand Rupees Only",
    subEvents: [
      { name: "Ideathon", dayLabel: "Day 1", date: "22 Nov", timings: "10 AM", description: "Pitch round" },
    ],
    signatories: [
      { roleTitle: "Convenor", name: "Dr. Faculty Advisor", designation: "Faculty In-Charge", location: "NOTESHEET" },
      { roleTitle: "Dean, KSAC", name: "Dr. Jyotin Kumar Das", designation: "Dean, Student Affairs", location: "BOTH" },
    ],
  };

  const html = generateProposalDocumentHtml(sampleProposal, { useWideBannerHeader: false });

  assert.ok(html.includes("<!DOCTYPE html>"), "Must be a valid full HTML document");
  assert.ok(html.includes("OMEGA 6.0 Annual Flagship"), "Must contain event title");
  assert.ok(html.includes("Thirty-Seven Thousand Rupees Only"), "Must contain budget in words");
  assert.ok(html.includes("Stage & LED Backdrop"), "Must contain budget item");
  assert.ok(html.includes("data:image/png;base64"), "Must embed inline base64 logos for offline printing");
  assert.ok(html.includes("Dr. Jyotin Kumar Das"), "Must contain signatory details");
});

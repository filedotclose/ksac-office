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
    enabledSections: ["SUB_EVENTS", "BUDGET", "VENUE", "SECURITY", "FELICITATION", "SPONSORS"],
    budgetItems: [
      { slNo: 1, particulars: "Stage & LED Backdrop", quantity: "1", unitPrice: "25000", totalCost: 25000 },
      { slNo: 2, particulars: "Mementos & Trophies", quantity: "10", unitPrice: "1200", totalCost: 12000 },
    ],
    budgetTotal: 37000,
    budgetInWords: "Thirty-Seven Thousand Rupees Only",
    subEvents: [
      { name: "Ideathon", dayLabel: "Day 1", date: "22 Nov", timings: "10 AM", description: "Pitch round" },
    ],
    securityRequirements: [
      { securityType: "Campus Security Guards", quantity: 4, campus: "Campus 25", timings: "09:00 AM - 09:00 PM", details: "Main entrance gate security" },
    ],
    felicitationRequirements: [
      { item: "Sambalpuri Handloom Shawl", quantity: 2, recipientDignitary: "Hon'ble Chief Guest", details: "Traditional Sambalpuri silk shawl" },
      { item: "Fresh Flower Bouquet", quantity: 2, recipientDignitary: "Keynote Speaker", details: "Fresh rose bouquet" },
    ],
    sponsors: [
      { name: "Red Bull India", tier: "Title Sponsor", contributionAmount: 50000, mouFileName: "RedBull_Signed_MoU.pdf" },
    ],
    societyLogo: {
      dataUrl: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=",
      fileName: "fed_logo.png",
    },
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

  // Verify Feature: Society Logo in Letterhead
  assert.ok(html.includes('class="ksac-emblem society"'), "Must contain Society Emblem logo element");
  assert.ok(html.includes('FED Society Logo'), "Must contain society logo alt text");

  // Verify Feature: Security Requisitions
  assert.ok(html.includes("Security &amp; Crowd Management Requirements"), "Must contain Security section");
  assert.ok(html.includes("Main entrance gate security"), "Must render security row details");

  // Verify Feature: Felicitation Material
  assert.ok(html.includes("Dignitary Felicitation &amp; Hospitality Protocol Material"), "Must contain Felicitation section");
  assert.ok(html.includes("Sambalpuri Handloom Shawl"), "Must render felicitation item");

  // Verify Feature: Sponsors & MoU
  assert.ok(html.includes("Event Sponsors &amp; Memorandum of Understanding") || html.includes("Event Sponsors"), "Must contain Sponsors section");
  assert.ok(html.includes("Red Bull India"), "Must render sponsor name");
  assert.ok(html.includes("RedBull_Signed_MoU.pdf"), "Must render attached MoU file name");

  // Verify Feature: Independent Budget Page with Signatories on Same Page
  assert.ok(html.includes("OFFICIAL EVENT BUDGET &amp; EXPENDITURE STATEMENT"), "Must contain dedicated Independent Budget Page");
  assert.ok(html.includes("ksac-budget-standalone-page"), "Must have standalone budget page class");
  assert.ok(html.includes("Signatories Matrix"), "Must contain Signatories matrix on budget page");
});


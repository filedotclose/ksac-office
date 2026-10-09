import { test } from "node:test";
import assert from "node:assert/strict";
import {
  extractDepartmentEmailsForProposal,
  DEFAULT_DEPARTMENT_DIRECTORY,
} from "../lib/eventProposalPresets";

test("extractDepartmentEmailsForProposal synthesizes department emails from proposal requirements", () => {
  const mockProposal = {
    eventName: "Technova 2026",
    society: "KIIT Film Society",
    academicYear: "2025-2026",
    datesDisplay: "14th - 16th October 2026",
    studentName: "Suryansh Das",
    position: "President",
    enabledSections: ["VENUE", "TECHNICAL", "FOOD", "BUDGET"],
    venueRequirements: [
      {
        campus: "Campus 6",
        venueType: "Auditorium",
        date: "14th October 2026",
        timings: "10:00 AM - 4:00 PM",
        quantity: "1",
        details: "Main hall for screening",
      },
    ],
    technicalRequirements: [
      {
        venue: "Campus 6 Auditorium",
        item: "Cordless Microphones",
        quantity: "4",
        date: "14th October 2026",
        timings: "10:00 AM",
        details: "High quality audio required",
      },
    ],
    budgetTotal: 85000,
    budgetInWords: "Eighty-Five Thousand Rupees Only",
  };

  const synthesized = extractDepartmentEmailsForProposal(mockProposal, DEFAULT_DEPARTMENT_DIRECTORY);

  assert.ok(Array.isArray(synthesized));
  assert.ok(synthesized.length >= 2, "Should have synthesized emails for active departments");

  const venueMail = synthesized.find((m) => m.categoryKey === "VENUE");
  assert.ok(venueMail, "Venue department email should exist");
  assert.ok(venueMail.recipientEmail.includes("@"), "Recipient email must be valid");
  assert.ok(venueMail.subject.includes("Technova 2026"), "Subject should contain event name");
  assert.ok(venueMail.bodyText.includes("Campus 6"), "Body should contain campus venue requirement");

  const techMail = synthesized.find((m) => m.categoryKey === "TECHNICAL");
  assert.ok(techMail, "Technical department email should exist");
  assert.ok(techMail.bodyText.includes("Cordless Microphones"), "Body should contain microphone requirement");
});

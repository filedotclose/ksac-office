import { test } from "node:test";
import assert from "node:assert/strict";
import { isAuthorizedForEventProposal } from "../lib/eventProposalPresets";

test("isAuthorizedForEventProposal allows Dean, Admin, Presidents, and Vice-Presidents", () => {
  // Dean KSAC
  assert.equal(isAuthorizedForEventProposal({ role: "dean" }), true);

  // FIC (Faculty In-Charge)
  assert.equal(isAuthorizedForEventProposal({ role: "fic" }), true);

  // Admin
  assert.equal(isAuthorizedForEventProposal({ role: "admin" }), true);

  // President
  assert.equal(isAuthorizedForEventProposal({ role: "student", position: "President" }), true);
  assert.equal(isAuthorizedForEventProposal({ role: "president" }), true);

  // Vice President
  assert.equal(isAuthorizedForEventProposal({ role: "student", position: "Vice-President" }), true);
  assert.equal(isAuthorizedForEventProposal({ role: "vice_president" }), true);

  // Multi-society position
  assert.equal(
    isAuthorizedForEventProposal({
      role: "student",
      societyPositions: [{ society: "Robotics", position: "President" }],
    }),
    true
  );

  // General member / student without lead position
  assert.equal(isAuthorizedForEventProposal({ role: "student", position: "Member" }), false);
  assert.equal(isAuthorizedForEventProposal({ role: "student" }), false);
  assert.equal(isAuthorizedForEventProposal(null), false);
});

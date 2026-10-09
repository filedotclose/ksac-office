import { test } from "node:test";
import assert from "node:assert/strict";
import {
  BANNER_FORMAT_PRESETS,
  POSTER_FORMAT_PRESETS,
  SMART_ITEM_PRESETS,
  SPONSOR_TIERS,
} from "../lib/eventProposalPresets";

test("BANNER_FORMAT_PRESETS contains standard stage and gate sizing", () => {
  const stageBackdrop = BANNER_FORMAT_PRESETS.find((b) => b.label.includes("Stage Backdrop"));
  assert.ok(stageBackdrop, "Stage Backdrop preset must exist");
  assert.equal(stageBackdrop?.dimensions, "12x8 ft");

  const archGate = BANNER_FORMAT_PRESETS.find((b) => b.label.includes("Entrance Gate Arch"));
  assert.ok(archGate, "Entrance Gate Arch preset must exist");
  assert.equal(archGate?.dimensions, "8x4 ft");

  const standee = BANNER_FORMAT_PRESETS.find((b) => b.label.includes("Standee"));
  assert.ok(standee, "Standee preset must exist");
  assert.equal(standee?.dimensions, "6x3 ft");
});

test("POSTER_FORMAT_PRESETS contains print and digital aspect ratios", () => {
  const a3 = POSTER_FORMAT_PRESETS.find((p) => p.label.includes("A3"));
  assert.ok(a3, "A3 format preset must exist");

  const a4 = POSTER_FORMAT_PRESETS.find((p) => p.label.includes("A4"));
  assert.ok(a4, "A4 format preset must exist");

  const story = POSTER_FORMAT_PRESETS.find((p) => p.label.includes("Fullscreen Story"));
  assert.ok(story, "Digital Fullscreen Story format preset must exist");
});

test("SMART_ITEM_PRESETS includes Security and Felicitation catalog", () => {
  assert.ok(SMART_ITEM_PRESETS.SECURITY.some((s) => s.includes("Campus Security Guards")));
  assert.ok(SMART_ITEM_PRESETS.SECURITY.some((s) => s.includes("Crowd Control Barricading")));
  assert.ok(SMART_ITEM_PRESETS.SECURITY.some((s) => s.includes("Night Security Surveillance")));

  assert.ok(SMART_ITEM_PRESETS.FELICITATION.some((f) => f.includes("Sambalpuri Handloom Shawl")));
  assert.ok(SMART_ITEM_PRESETS.FELICITATION.some((f) => f.includes("Traditional Brass Lamp")));
  assert.ok(SMART_ITEM_PRESETS.FELICITATION.some((f) => f.includes("Fresh Floral Bouquet")));
});

test("SPONSOR_TIERS contains institutional tier hierarchy", () => {
  assert.ok(SPONSOR_TIERS.includes("Title Sponsor"));
  assert.ok(SPONSOR_TIERS.includes("Associate Sponsor"));
  assert.ok(SPONSOR_TIERS.includes("Powered By Sponsor"));
});

import { test } from "node:test";
import assert from "node:assert/strict";
import { numberToIndianRupeeWords, formatIndianCurrency } from "../lib/eventProposalPresets";

test("numberToIndianRupeeWords converts values correctly", () => {
  assert.equal(numberToIndianRupeeWords(0), "Rupees Zero Only");
  assert.equal(numberToIndianRupeeWords(500), "Rupees Five Hundred Only");
  assert.equal(numberToIndianRupeeWords(1500), "Rupees One Thousand Five Hundred Only");
  assert.equal(numberToIndianRupeeWords(178500), "Rupees One Lakh Seventy Eight Thousand Five Hundred Only");
  assert.equal(numberToIndianRupeeWords(10000000), "Rupees One Crore Only");
});

test("formatIndianCurrency formats numbers with Indian commas standard", () => {
  assert.equal(formatIndianCurrency(0), "0");
  assert.equal(formatIndianCurrency(1500), "1,500");
  assert.equal(formatIndianCurrency(178500), "1,78,500");
  assert.equal(formatIndianCurrency(10000000), "1,00,00,000");
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  missingRequiredUploadTypes,
  normalizeCustomerIntake,
  safetyReviewFromIntake,
  normalizeRequiredUploadTypes
} from "../functions/_lib/intake.js";

const baseClient = {
  hairLength: "Shoulder",
  hairDensity: "Average",
  hairCondition: "Natural",
  allergies: "Latex",
  notes: "Sensitive scalp"
};

test("legacy hair intake remains compatible and is surfaced for review", () => {
  const intake = normalizeCustomerIntake(baseClient);
  assert.equal(intake.hairLength, "Shoulder");
  assert.equal(intake.allergies, "yes");
  assert.equal(intake.allergiesExplanation, "Latex");
  assert.equal(safetyReviewFromIntake(intake).needsReview, true);
});

test("nail intake stays brief while safety explanations remain required when a concern is reported", () => {
  const nails = normalizeCustomerIntake({ designNotes: "", allergies: "no", previousReactions: "no", irritation: "no", infection: "no", injury: "no", openAreas: "no", otherSafetyConcern: "no" }, null, "Nails");
  assert.equal(nails.hairLength, undefined);
  assert.equal(safetyReviewFromIntake(nails).needsReview, false);
  assert.throws(() => normalizeCustomerIntake({ ...nails, otherSafetyConcern: "yes" }, null, "Nails"), /Other safety concern explanation is required/u);
});

test("press-on intake preserves optional design preferences without redundant length or shape fields", () => {
  const intake = normalizeCustomerIntake({
    ...baseClient,
    preferredColors: "Pink and gold",
    neededBy: "2030-05-01",
    designNotes: "French tips"
  }, "pressOn");
  assert.equal(intake.nailLength, undefined);
  assert.equal(intake.designNotes, "French tips");
  assert.equal(normalizeCustomerIntake({ ...baseClient }, "pressOn").preferredColors, "");
});

test("wedding intake validates party size and preserves every specialty answer", () => {
  const intake = normalizeCustomerIntake({
    ...baseClient,
    weddingDate: "2030-06-15",
    gettingReadyLocation: "Little Rock",
    ceremonyTime: "16:00",
    partySize: "5",
    trialRequested: "Yes",
    weddingNotes: "Bride plus four attendants"
  }, "wedding");
  assert.equal(intake.partySize, 5);
  assert.equal(intake.weddingNotes, "Bride plus four attendants");
  assert.throws(() => normalizeCustomerIntake({ ...baseClient, weddingDate: "2030-06-15", gettingReadyLocation: "Little Rock", ceremonyTime: "16:00", partySize: "0", trialRequested: "No" }, "wedding"), /whole number/u);
});

test("bridal makeup intake remains makeup-only and party intake keeps its quantity", () => {
  const bridal = normalizeCustomerIntake({ ...baseClient, makeupOccasion: "Wedding", makeupLook: "Soft glam", skinType: "Normal", lashPreference: "Natural lashes", weddingDate: "2030-06-15" }, "bridal", "Makeup");
  assert.equal(bridal.hairLength, undefined);
  assert.equal(bridal.weddingDate, "2030-06-15");
  const party = normalizeCustomerIntake({ ...baseClient, makeupOccasion: "Wedding", makeupLook: "Soft glam", skinType: "Normal", lashPreference: "Natural lashes", weddingDate: "2030-06-15", partySize: "4" }, "bridalParty", "Makeup");
  assert.equal(party.partySize, 4);
  assert.throws(() => normalizeCustomerIntake({ ...baseClient, makeupOccasion: "Wedding", makeupLook: "Soft glam", skinType: "Normal", lashPreference: "Natural lashes", partySize: "2" }, "bridal", "Makeup"), /Wedding date is required/u);
});

test("required upload aliases are normalized and missing photos are reported", () => {
  assert.deepEqual(normalizeRequiredUploadTypes(["current", "inspiration"]), ["current_look", "inspiration"]);
  assert.deepEqual(missingRequiredUploadTypes(["current", "inspiration"], ["current_look"]), ["inspiration"]);
  assert.deepEqual(missingRequiredUploadTypes(["current"], ["current_look", "inspiration"]), []);
  assert.throws(() => normalizeRequiredUploadTypes(["public_gallery"]), /unsupported photo type/u);
});

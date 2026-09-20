import test from "node:test";
import assert from "node:assert/strict";
import {
  missingRequiredUploadTypes,
  normalizeCustomerIntake,
  normalizeRequiredUploadTypes
} from "../functions/_lib/intake.js";

const baseClient = {
  hairLength: "Shoulder",
  hairDensity: "Average",
  hairCondition: "Natural",
  allergies: "Latex",
  notes: "Sensitive scalp"
};

test("normal customer intake preserves every shared answer", () => {
  assert.deepEqual(normalizeCustomerIntake(baseClient), {
    schemaVersion: 1,
    questionnaireType: null,
    hairLength: "Shoulder",
    hairDensity: "Average",
    hairCondition: "Natural",
    allergies: "Latex",
    notes: "Sensitive scalp"
  });
});

test("press-on intake requires and preserves every specialty answer", () => {
  const intake = normalizeCustomerIntake({
    ...baseClient,
    nailLength: "Medium",
    nailShape: "Almond",
    preferredColors: "Pink and gold",
    neededBy: "2030-05-01",
    designNotes: "French tips"
  }, "pressOn");
  assert.equal(intake.nailShape, "Almond");
  assert.equal(intake.designNotes, "French tips");
  assert.throws(() => normalizeCustomerIntake({ ...baseClient, nailLength: "Medium" }, "pressOn"), /Nail shape is required/u);
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

test("required upload aliases are normalized and missing photos are reported", () => {
  assert.deepEqual(normalizeRequiredUploadTypes(["current", "inspiration"]), ["current_look", "inspiration"]);
  assert.deepEqual(missingRequiredUploadTypes(["current", "inspiration"], ["current_look"]), ["inspiration"]);
  assert.deepEqual(missingRequiredUploadTypes(["current"], ["current_look", "inspiration"]), []);
  assert.throws(() => normalizeRequiredUploadTypes(["public_gallery"]), /unsupported photo type/u);
});


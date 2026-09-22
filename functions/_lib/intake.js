const MAX_SHORT_TEXT = 160;
const MAX_LONG_TEXT = 4000;

function text(value, field, { required = false, maxLength = MAX_SHORT_TEXT } = {}) {
  if (value == null) value = "";
  if (typeof value !== "string") throw new TypeError(`${field} must be text.`);
  const normalized = value.trim();
  if (required && !normalized) throw new TypeError(`${field} is required.`);
  if (normalized.length > maxLength) throw new TypeError(`${field} is too long.`);
  return normalized;
}

function positiveWholeNumber(value, field, maximum = 100) {
  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < 1 || normalized > maximum) {
    throw new TypeError(`${field} must be a whole number between 1 and ${maximum}.`);
  }
  return normalized;
}

const SAFETY_FIELDS = [
  ["allergies", "Allergies or sensitivities"], ["previousReactions", "Previous reactions"],
  ["irritation", "Irritation"], ["infection", "Infection"], ["injury", "Injury"],
  ["openAreas", "Open areas"], ["otherSafetyConcern", "Other safety concern"]
];

function safetyAnswers(client) {
  const result = {};
  for (const [key, label] of SAFETY_FIELDS) {
    const raw = text(client[key], label, { maxLength: 1000 });
    // Hair requests created before the safety form used a free-text allergy field.
    // Preserve that data as an explained alert instead of rejecting the booking.
    const legacyExplanation = key === "allergies" && raw && !["yes", "no"].includes(raw.toLowerCase()) ? raw : "";
    const answer = legacyExplanation ? "yes" : raw.toLowerCase();
    if (answer && !["yes", "no"].includes(answer)) throw new TypeError(`${label} must be Yes or No.`);
    result[key] = answer || "no";
    const explanationKey = `${key}Explanation`;
    result[explanationKey] = text(client[explanationKey] || legacyExplanation, `${label} explanation`, { required: answer === "yes", maxLength: 1000 });
  }
  return result;
}

export function safetyReviewFromIntake(intake) {
  const labels = { allergies: "allergies or sensitivities", previousReactions: "previous reactions", irritation: "irritation", infection: "infection", injury: "injury", openAreas: "open areas", otherSafetyConcern: "another safety concern" };
  const flagged = SAFETY_FIELDS.filter(([key]) => intake[key] === "yes").map(([key]) => labels[key]);
  return { needsReview: flagged.length > 0, summary: flagged.length ? `Client reported ${flagged.join(", ")}. Kia review required.` : null };
}

export function normalizeCustomerIntake(client, questionnaireType = null, serviceCategory = "Hair") {
  if (!client || typeof client !== "object" || Array.isArray(client)) {
    throw new TypeError("Customer details are required.");
  }

  const intake = {
    schemaVersion: 2,
    questionnaireType: questionnaireType || null,
    serviceCategory,
    notes: text(client.notes, "Special requests", { maxLength: MAX_LONG_TEXT }),
    ...safetyAnswers(client)
  };

  if (serviceCategory === "Hair") Object.assign(intake, {
    hairLength: text(client.hairLength, "Current hair length", { required: true }),
    hairDensity: text(client.hairDensity, "Hair density", { required: true }),
    hairCondition: text(client.hairCondition, "Hair condition", { required: true })
  });
  if (serviceCategory === "Nails") Object.assign(intake, {
    currentNailProduct: text(client.currentNailProduct, "Current nail product"),
    removalNeeded: text(client.removalNeeded, "Removal needed"),
    nailDesignStyle: text(client.nailDesignStyle, "Nail design style", { maxLength: 160 }),
    designNotes: text(client.designNotes, "Nail design notes", { maxLength: MAX_LONG_TEXT })
  });
  if (serviceCategory === "Makeup") Object.assign(intake, {
    makeupOccasion: text(client.makeupOccasion, "Occasion", { required: true }),
    makeupLook: text(client.makeupLook, "Desired makeup look", { required: true }),
    skinType: text(client.skinType, "Skin type", { required: true }),
    productAvoidance: text(client.productAvoidance, "Products to avoid", { maxLength: 1000 }),
    lashPreference: text(client.lashPreference, "Lash preference", { required: true })
  });

  if (questionnaireType === "pressOn") {
    Object.assign(intake, {
      preferredColors: text(client.preferredColors, "Preferred colors", { maxLength: 500 }),
      neededBy: text(client.neededBy, "Needed-by date", { maxLength: 20 }),
      designNotes: text(client.designNotes, "Design inspiration and custom notes", { maxLength: MAX_LONG_TEXT })
    });
  }

  if (questionnaireType === "wedding") {
    Object.assign(intake, {
      weddingDate: text(client.weddingDate, "Wedding date", { required: true, maxLength: 20 }),
      gettingReadyLocation: text(client.gettingReadyLocation, "Getting-ready location", { required: true, maxLength: 500 }),
      ceremonyTime: text(client.ceremonyTime, "Ceremony time", { required: true, maxLength: 20 }),
      partySize: positiveWholeNumber(client.partySize, "Number receiving makeup"),
      trialRequested: text(client.trialRequested, "Makeup trial choice", { required: true, maxLength: 20 }),
      weddingNotes: text(client.weddingNotes, "Additional wedding notes", { maxLength: MAX_LONG_TEXT })
    });
  }

  if (questionnaireType === "makeupParty") {
    Object.assign(intake, {
      partySize: positiveWholeNumber(client.partySize, "Number receiving makeup")
    });
  }

  return intake;
}

export function normalizeRequiredUploadTypes(value) {
  if (!Array.isArray(value)) throw new TypeError("Service photo requirements are not configured correctly.");
  const aliases = { current: "current_look", current_look: "current_look", inspiration: "inspiration" };
  const normalized = value.map(item => aliases[String(item)]).filter(Boolean);
  if (normalized.length !== value.length) throw new TypeError("Service photo requirements contain an unsupported photo type.");
  return [...new Set(normalized)];
}

export function missingRequiredUploadTypes(requiredTypes, uploadedTypes) {
  const required = normalizeRequiredUploadTypes(requiredTypes);
  const uploaded = new Set(Array.isArray(uploadedTypes) ? uploadedTypes : []);
  return required.filter(type => !uploaded.has(type));
}

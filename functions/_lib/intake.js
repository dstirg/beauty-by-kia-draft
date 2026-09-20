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

export function normalizeCustomerIntake(client, questionnaireType = null) {
  if (!client || typeof client !== "object" || Array.isArray(client)) {
    throw new TypeError("Customer details are required.");
  }

  const intake = {
    schemaVersion: 1,
    questionnaireType: questionnaireType || null,
    hairLength: text(client.hairLength, "Current hair length", { required: true }),
    hairDensity: text(client.hairDensity, "Hair density", { required: true }),
    hairCondition: text(client.hairCondition, "Hair condition", { required: true }),
    allergies: text(client.allergies, "Allergies or sensitivities", { maxLength: 1000 }),
    notes: text(client.notes, "Special requests", { maxLength: MAX_LONG_TEXT })
  };

  if (questionnaireType === "pressOn") {
    Object.assign(intake, {
      nailLength: text(client.nailLength, "Nail length", { required: true }),
      nailShape: text(client.nailShape, "Nail shape", { required: true }),
      preferredColors: text(client.preferredColors, "Preferred colors", { required: true, maxLength: 500 }),
      neededBy: text(client.neededBy, "Needed-by date", { required: true, maxLength: 20 }),
      designNotes: text(client.designNotes, "Design inspiration and custom notes", { required: true, maxLength: MAX_LONG_TEXT })
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


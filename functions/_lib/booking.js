export const BOOKING_STATUSES = Object.freeze([
  "pending_review",
  "awaiting_deposit",
  "confirmed",
  "completed",
  "reschedule_requested",
  "cancelled_by_client",
  "cancelled_by_brookia",
  "declined",
  "no_show",
  "time_unavailable"
]);

export const PAYMENT_STATUSES = Object.freeze([
  "deposit_not_requested",
  "deposit_requested",
  "deposit_pending",
  "deposit_paid",
  "deposit_failed",
  "deposit_refunded"
]);

export const SLOT_BLOCKING_STATUSES = new Set(["awaiting_deposit", "confirmed"]);
export const SLOT_RELEASING_STATUSES = new Set([
  "pending_review",
  "completed",
  "reschedule_requested",
  "cancelled_by_client",
  "cancelled_by_brookia",
  "declined",
  "no_show",
  "time_unavailable"
]);

export function intervalsOverlap(startA, endA, startB, endB) {
  return new Date(startA).getTime() < new Date(endB).getTime()
    && new Date(endA).getTime() > new Date(startB).getTime();
}

export function appointmentWindow(startAt, durationMinutes, beforeMinutes = 0, afterMinutes = 0) {
  const start = new Date(startAt);
  if (!Number.isFinite(start.getTime())) throw new TypeError("Invalid appointment start time.");
  const appointmentEnd = new Date(start.getTime() + Number(durationMinutes) * 60000);
  return {
    appointmentStartAt: start.toISOString(),
    appointmentEndAt: appointmentEnd.toISOString(),
    bufferedStartAt: new Date(start.getTime() - Number(beforeMinutes) * 60000).toISOString(),
    bufferedEndAt: new Date(appointmentEnd.getTime() + Number(afterMinutes) * 60000).toISOString()
  };
}

export function localDateParts(isoTimestamp, timeZone = "America/Chicago") {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23"
  }).formatToParts(new Date(isoTimestamp));
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]));
  const weekday = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(values.weekday);
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
    weekday
  };
}

export function statusReleasesSlot(status) {
  return SLOT_RELEASING_STATUSES.has(status);
}

-- Customer-experience policy update approved from owner feedback.
UPDATE policy_versions
SET policy_json = json_set(
  policy_json,
  '$.cancellation',
  'You can cancel up to 24 hours before your scheduled service by contacting Kia. Cancellations made with less than 24 hours’ notice may result in forfeiture of the deposit and may require a new deposit to rebook.'
)
WHERE is_current = 1;

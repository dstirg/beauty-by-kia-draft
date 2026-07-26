# Beauty by Kia — Draft Review

This repository contains the review-only Beauty by Kia booking portal. The app remains labeled **Draft Review — Not Yet Live**.

## Approved pricing update

The browser-based app includes Brookia’s approved Hair, Braids, Color, Weaves, Nails, and Makeup service catalog; variable add-ons; automatic $25/$40/$50 deposit tiers; estimated remaining balances; policy acceptance records; consultation and photo-review requirements; and an admin-controlled Grand Opening Special that is off by default.

The admin dashboard can edit service and add-on price types and ranges, availability, applicable add-ons, final booking prices, deposits, policies, and promotion dates. Historical bookings store their own original estimate and pricing snapshot.

## Draft safeguards

- Payment actions are simulations only; the app never collects card details or processes real payments.
- The Grand Opening Special is disabled by default and expires automatically after its configured end date.
- The public banner and page title identify the site as a draft.
- Data is stored locally in the current browser; use the admin backup export before clearing browser data.

## Tests

Run `node pricing.test.js` to check fixed, range, starting, consultation, deposit-tier, add-on, and promotion calculations.

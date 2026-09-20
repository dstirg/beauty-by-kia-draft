# Booking request data map

The booking API treats the browser as untrusted. Every submitted field is
normalized or validated on the server before D1 persistence, and the admin
dashboard renders only the authenticated booking record returned by the API.

| Form field | API payload | Server validation | D1 / private storage | Admin display |
| --- | --- | --- | --- | --- |
| Name | `client.name` | Required text; length limited | `bookings.client_name` | Customer heading |
| Phone | `client.phone` | Required text; length limited | `bookings.client_phone` | Contact details |
| Email | `client.email` | Required, normalized email | `bookings.client_email` | Contact details |
| Preferred contact | `client.preferredContact` | Allowed contact choice; SMS requires consent | `bookings.preferred_contact` and `sms_consent_at` | Contact details |
| Current hair length | `client.hairLength` | Required text | `bookings.client_intake_json.hairLength` | Hair details |
| Hair density | `client.hairDensity` | Required text | `bookings.client_intake_json.hairDensity` | Hair details |
| Hair condition | `client.hairCondition` | Required text | `bookings.client_intake_json.hairCondition` | Hair details |
| Allergies / sensitivities | `client.allergies` | Optional text; length limited | `bookings.client_intake_json.allergies` | Hair details |
| Special requests / notes | `client.notes` | Optional text; length limited | `client_intake_json.notes`; also `customer_notes` for backward compatibility | Hair details |
| Press-on nail length | `client.nailLength` | Required for press-on questionnaire | `client_intake_json.nailLength` | Service-specific answers |
| Press-on nail shape | `client.nailShape` | Required for press-on questionnaire | `client_intake_json.nailShape` | Service-specific answers |
| Preferred colors | `client.preferredColors` | Required for press-on questionnaire | `client_intake_json.preferredColors` | Service-specific answers |
| Press-on needed-by date | `client.neededBy` | Required for press-on questionnaire | `client_intake_json.neededBy` | Service-specific answers |
| Press-on design notes | `client.designNotes` | Required for press-on questionnaire | `client_intake_json.designNotes` | Service-specific answers |
| Wedding date | `client.weddingDate` | Required for wedding questionnaire | `client_intake_json.weddingDate` | Service-specific answers |
| Getting-ready location | `client.gettingReadyLocation` | Required for wedding questionnaire | `client_intake_json.gettingReadyLocation` | Service-specific answers |
| Ceremony time | `client.ceremonyTime` | Required for wedding questionnaire | `client_intake_json.ceremonyTime` | Service-specific answers |
| Wedding party size | `client.partySize` | Whole number from 1 through 100 | `client_intake_json.partySize` | Service-specific answers |
| Trial choice | `client.trialRequested` | Required for wedding questionnaire | `client_intake_json.trialRequested` | Service-specific answers |
| Wedding notes | `client.weddingNotes` | Optional text; length limited | `client_intake_json.weddingNotes` | Service-specific answers |
| Service | `serviceId` | Must identify an active D1 service | `booking_services` immutable price/name snapshot | Appointment and pricing |
| Add-ons | `addOnIds[]` | Each must be an active add-on allowed for the service | `booking_add_ons` immutable snapshots | Add-ons and pricing |
| Preferred date/time | `requestedStartAt` | Valid future date/time within booking rules | `bookings.requested_start_at` | Appointment date/time |
| Required customer photos | `privateUploadClaims[]` | Each signed claim must belong to this booking request; required service photo types must be present | R2 private object plus `private_upload_metadata`; no public URL | Protected admin photo viewer only |
| Policy acceptance | `acceptedPolicies` | Must be `true`; active policy version is read from D1 | `policy_acceptances` | Audit record |
| SMS consent | `smsConsent` | Required when text is selected; otherwise optional | `bookings.sms_consent_at` | Contact details |
| Turnstile response | `turnstileToken` | Verified server-side when the request has not already supplied a verified upload claim | Not stored as customer data | Not displayed |

`client_intake_json` is versioned (`schemaVersion: 1`) so later form changes can
be added without silently discarding answers or reinterpreting older bookings.

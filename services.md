# Services

## Third-party dependencies (approved)

### Frontend (`hosting/`)

- **firebase**: 10.14.1
- **react-router-dom**: 6.28.0
- **@tanstack/react-query**: 5.85.3
- **framer-motion**: 11.11.17
- **recharts**: 2.15.0
- **date-fns**: 4.1.0

### Cloud Functions (`functions/`)

- **@sendgrid/mail**: 8.1.4 (email delivery)
- **puppeteer**: 23.9.0 (blueprint PDF generation)

## Cloud Functions (callable)

### `createCompany`

- **Inputs**: `{ companyName: string, userName: string }`
- **Outputs**: `{ companyId: string, inviteCode: string }`
- **Side effects**:
  - Creates `/companies/{companyId}`
  - Creates `/inviteCodes/{inviteCode}` mapping
  - Creates admin participant `/companies/{companyId}/participants/{uid}`

### `joinCompany`

- **Inputs**: `{ inviteCode: string, userName: string }`
- **Outputs**: `{ companyId: string }`
- **Side effects**:
  - Creates or updates participant `/companies/{companyId}/participants/{uid}` as role `founder`
  - Upserts invite tracking doc `/companies/{companyId}/invites/{emailLower}` with status `accepted`

### `sendInviteEmail`

- **Inputs**: `{ inviteCode: string, email: string }`
- **Outputs**: `{ ok: true }`
- **Side effects**:
  - Sends an email via SendGrid containing a registration link for the invite code
  - Upserts invite tracking doc `/companies/{companyId}/invites/{emailLower}` with status `pending`

### `generateBlueprint`

- **Inputs**: `{ companyId: string }`
- **Outputs**: `{ version: number, generatedAt: string, companyId: string, companyName: string, participants: any[], responses: any[], approvals: any[] }`
- **Side effects**:
  - When called with `action=closeFinalize` (admin-only):
    - Sends a localized “mapping closed” email to each participant (SendGrid)
      - Localization uses `/users/{uid}.language` and bundled `functions/content/domain-content-<lang>.json` files
    - Writes workflow stage to `closed` (`/companies/{companyId}/workflow/state`)
    - Updates `/companies/{companyId}.status = closed`
  - When called with `action=resendClosedEmail` (admin-only):
    - Re-sends the localized “mapping closed” email to each participant (SendGrid)
    - Requires current workflow stage to be `closed`
    - Returns `{ ok: true, sentCount: number }`
  - When called with `action=startFromScratch` (admin-only):
    - Deletes company data (responses, comments, acceptance, workflow, blueprint)
    - Resets `/companies/{companyId}.status = new`

## Cloud Functions (scheduled / triggers)

### `sendReminders` (scheduled)

- **Inputs**: None
- **Outputs**: None
- **Side effects**:
  - Scans participants and sends reminder emails (SendGrid) when inactive
  - Updates `lastReminderSent` on participant docs

### `onApprovalWritten` (Firestore trigger)

- **Inputs**: Firestore write at `/companies/{companyId}/approvals/{userId}`
- **Outputs**: None
- **Side effects**:
  - When a participant approves, sends an email notification to the company admin email

## Runtime configuration

- **Secret**: `SENDGRID_API_KEY` (Secret Manager)
- **Param**: `SENDGRID_FROM_EMAIL` (sender email address)
- **Param**: `APP_BASE_URL` (e.g. `https://partnership-mapping.web.app`)


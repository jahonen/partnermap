# Integrations

## SendGrid (Email delivery)

- **Used by**: Cloud Functions (`functions/`)
- **Library**: `@sendgrid/mail`
- **Purpose**:
  - Invitation emails
  - Reminder emails
  - Approval notification emails
  - Localized “mapping closed” emails (including re-send)

### Interface

- **Inputs**:
  - Recipient email(s)
  - Subject
  - Plain text body
  - HTML body
- **Outputs**:
  - Delivery request accepted/rejected by SendGrid API
- **Side effects**:
  - Sends external email
  - Logs success/failure in Cloud Functions logs

### Configuration

- **Secret**: `SENDGRID_API_KEY` (Secret Manager)
- **Param**: `SENDGRID_FROM_EMAIL`

## Firebase

### Firebase Authentication

- **Used by**: `hosting/`
- **Purpose**: login/registration and session management

### Firestore

- **Used by**: `hosting/` and `functions/`
- **Purpose**:
  - Company/workflow state
  - Participants/invites
  - Responses/comments/approvals/acceptance
  - User profile + language preference (`/users/{uid}.language`)

### Firebase Hosting

- **Used by**: `hosting/`
- **Purpose**: serve the frontend SPA

### Cloud Functions (2nd gen)

- **Used by**: `functions/`
- **Purpose**: workflow actions and email sending

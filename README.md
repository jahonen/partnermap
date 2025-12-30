# Outkomia Partnership Mapping

[![License](https://img.shields.io/badge/License-BSD_3--Clause-blue.svg)](https://opensource.org/licenses/BSD-3-Clause)

Partnership Mapping is a Firebase-backed web app for running a structured co-founder / partner alignment process across multiple domains, producing a final “blueprint”, collecting partner acceptance, and finally emailing a localized “mapping closed” summary to all participants.

## Repository structure

- `hosting/`: React (Vite) frontend deployed to Firebase Hosting
- `functions/`: Firebase Cloud Functions (Node.js, 2nd gen)
- `firestore.rules`: Firestore Security Rules
- `firestore.indexes.json`: Firestore indexes

## Main docs

- `START_HERE.md`: short orientation + entry points
- `services.md`: callable / deployable services (inputs/outputs/side-effects)
- `component.md`: modular frontend components (inputs/outputs/side-effects)

## Supported languages

Frontend and closed-email localization currently support:

- `en`, `fi`, `sv`, `el`, `de`, `fr`, `es`

Language selection is stored locally and persisted for signed-in users in Firestore at:

- `/users/{uid}.language`

## Workflow overview

Stages are stored at:

- `/companies/{companyId}/workflow/state.stage`

Current stages:

- `assessment`: participants select options per domain
- `review`: admin selects the final blueprint
- `finalize`: participants accept/reject the blueprint
- `closed`: read-only, “mapping closed” email sent

Admin-only workflow actions are executed via the callable function `generateBlueprint` (see `services.md`).

## Local development

Install dependencies:

- `npm --prefix hosting install`
- `npm --prefix functions install`

Run frontend (Vite):

- `npm --prefix hosting run dev`

Run lint:

- `npm --prefix hosting run lint`
- `npm --prefix functions run lint`

Emulators:

- Use `firebase emulators:start` from repo root (configure as needed in your Firebase project).

## Deployment

- Deploy hosting: `firebase deploy --only hosting`
- Deploy functions: `firebase deploy --only functions`

## Configuration

Cloud Functions configuration:

- **Secret**: `SENDGRID_API_KEY` (Secret Manager)
- **Param**: `SENDGRID_FROM_EMAIL`
- **Param**: `APP_BASE_URL` (e.g. `https://partnership-mapping.web.app`)

These are loaded via Firebase Functions params and `.env.<projectId>` in the functions directory.

# Outkomia Partnership Mapping

## Project structure

- `hosting/`: React (Vite) frontend deployed to Firebase Hosting
- `functions/`: Firebase Cloud Functions (Node.js)
- `firestore.rules`: Firestore Security Rules
- `firestore.indexes.json`: Firestore indexes

## Conventions

- Components are co-located in a folder: `/src/components/<PascalCase>/<PascalCase>.jsx` and optional `/<PascalCase>.scss`
- Shared styles live in `main.scss`

## Local development

- Frontend: run the Vite dev server from `hosting/`
- Functions: run Firebase emulators from repo root or `functions/`

## Quick commands

- Lint (hosting): `npm --prefix hosting run lint`
- Lint (functions): `npm --prefix functions run lint`
- Deploy hosting: `firebase deploy --only hosting`
- Deploy functions: `firebase deploy --only functions`

## Where to start

- UI entry: `hosting/src/main.jsx`
- Cloud Functions entry: `functions/index.js`
- Security rules: `firestore.rules`

## Additional docs

- Repo overview + setup: `README.md`
- Services/interfaces: `services.md`
- Components/interfaces: `component.md`
- External integrations: `integration.md`

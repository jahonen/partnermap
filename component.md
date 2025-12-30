# Components

## AuthProvider (`hosting/src/providers/AuthProvider/AuthProvider.jsx`)

### Interface

- **Inputs**: `children`
- **Outputs**: React context values `{ user, isAuthLoading }`
- **Side effects**: Subscribes to Firebase Auth `onAuthStateChanged`, upserts `users/{uid}` profile fields (`email`, `name`, `updatedAt`) in Firestore

## auth-context (`hosting/src/providers/AuthProvider/auth-context.js`)

### Interface

- **Inputs**: None
- **Outputs**:
  - `AuthContext`
  - `useAuth()` hook
- **Side effects**: None

## ReviewProgressWheel (`hosting/src/components/ReviewProgressWheel/ReviewProgressWheel.jsx`)

### Interface

- **Inputs**:
  - `domainKeys` (array of domain keys)
  - `completedKeys` (array of domain keys considered completed)
  - `currentKey` (currently active domain key)
- **Outputs**: SVG 8-slice progress wheel highlighting completed domains
- **Side effects**: None

## Web shell assets (`hosting/index.html`, `hosting/public/*`)

### Interface

- **Inputs**: None
- **Outputs**: Favicons, PWA manifest, and link preview metadata (OpenGraph/Twitter)
- **Side effects**: None

## Breadcrumbs (`hosting/src/components/Breadcrumbs/Breadcrumbs.jsx`)

### Interface

- **Inputs**: None
- **Outputs**: Breadcrumb navigation bar based on current route
- **Side effects**: None

## RequireCompany (`hosting/src/components/RequireCompany/RequireCompany.jsx`)

### Interface

- **Inputs**: `children`
- **Outputs**: Renders `children` when the user has a company context; otherwise redirects to `/register`
- **Side effects**: Loads company context from Firestore via `useUserCompanyContext`

## AppLayout (`hosting/src/components/AppLayout/AppLayout.jsx`)

### Interface

- **Inputs**: `children`
- **Outputs**: Persistent page shell with header + footer
- **Side effects**: None

## AppHeader (`hosting/src/components/AppHeader/AppHeader.jsx`)

### Interface

- **Inputs**: None
- **Outputs**: Persistent app header with language selector and auth action (Login / Log out)
- **Side effects**: Calls Firebase Auth `signOut` when Log out is clicked, updates selected language via `LanguageProvider`

## AppFooter (`hosting/src/components/AppFooter/AppFooter.jsx`)

### Interface

- **Inputs**: None
- **Outputs**: Global footer
- **Side effects**: None

## LanguageProvider (`hosting/src/providers/LanguageProvider/LanguageProvider.jsx`)

### Interface

- **Inputs**: `children`
- **Outputs**: React context values `{ language, setLanguage }`
- **Side effects**: Persists language to `localStorage`

## LandingWheel (`hosting/src/components/LandingWheel/LandingWheel.jsx`)

### Interface

- **Inputs**: `onSpin` (optional)
- **Outputs**: SVG wheel visualization for landing page
- **Side effects**: None

### ResetPasswordPage

- **Inputs**: None
- **Outputs**: Password reset request form
- **Side effects**: Calls Firebase Auth `sendPasswordResetEmail`

### VerifyEmailPage

- **Inputs**: None
- **Outputs**: Email verification guidance + resend/check actions
- **Side effects**:
  - Calls Firebase Auth `sendEmailVerification`
  - Calls Firebase Auth `user.reload()`

## RequireAuth (`hosting/src/components/RequireAuth/RequireAuth.jsx`)

### Interface

- **Inputs**: `children`
- **Outputs**: Renders `children` when authenticated, otherwise redirects to `/login`
- **Side effects**: None

## ConfigError (`hosting/src/components/ConfigError/ConfigError.jsx`)

### Interface

- **Inputs**: `title`, `details`
- **Outputs**: Error screen describing missing/invalid configuration
- **Side effects**: None

## Pages (`hosting/src/pages/*`)

### LandingPage

- **Inputs**: None
- **Outputs**: Marketing landing page with multi-section explanation and CTA to start mapping + navigation to login/register
- **Side effects**: None

### LoginPage

- **Inputs**: None
- **Outputs**: Email/password login form + Google Sign-In
- **Side effects**:
  - Calls Firebase Auth `signInWithEmailAndPassword`
  - Calls Firebase Auth `signInWithPopup` (Google)

### RegisterPage

- **Inputs**: URL param `inviteCode` (optional)
- **Outputs**: Registration and company association form
- **Side effects**:
  - If signed out: creates a Firebase Auth user, calls Cloud Functions to create/join company, sends verification email
  - If already signed in: skips account creation and calls Cloud Functions to create/join company for the current user

### DashboardPage / AssessPage / ReviewPage / FinalPage

- **Inputs**: None
- **Outputs**:
  - Dashboard company context + navigation
  - Dashboard invite teammates section (copy invite link, send invite email)
  - Dashboard admin stage controls (including re-send closed email when stage is `closed`)
  - Assessment browser UI (domains + solution options) with autosave
  - Review summary of saved selections + conflict view + comments
  - Final approvals + export of selections as a JSON file
- **Side effects**:
  - Dashboard admin actions call Cloud Functions workflow actions (e.g. `generateBlueprint` with `action=resendClosedEmail`)
  - Dashboard displays success/error feedback for admin actions


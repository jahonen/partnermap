const {HttpsError} = require("firebase-functions/v2/https");

function requireAuth(request) {
  if (!request.auth || !request.auth.uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
}

function requireNonEmptyString(value, fieldName, maxLen = 200) {
  if (typeof value !== "string") {
    throw new HttpsError("invalid-argument", `${fieldName} must be a string`);
  }
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLen) {
    throw new HttpsError("invalid-argument", `${fieldName} is required and must be <= ${maxLen} chars`);
  }
  return trimmed;
}

function normalizeInviteCode(inviteCode) {
  if (typeof inviteCode !== "string") {
    return "";
  }
  return inviteCode.trim().toUpperCase();
}

module.exports = {
  requireAuth,
  requireNonEmptyString,
  normalizeInviteCode,
};

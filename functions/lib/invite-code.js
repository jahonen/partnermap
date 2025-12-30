const {HttpsError} = require("firebase-functions/v2/https");

function generateInviteCode(length) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let i = 0; i < length; i += 1) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return result;
}

async function generateUniqueInviteCode({firestore, attempts = 8, length = 8}) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const code = generateInviteCode(length);
    const codeRef = firestore.collection("inviteCodes").doc(code);
    const existing = await codeRef.get();
    if (!existing.exists) {
      return code;
    }
  }

  throw new HttpsError("internal", "Failed to generate unique invite code");
}

module.exports = {
  generateInviteCode,
  generateUniqueInviteCode,
};

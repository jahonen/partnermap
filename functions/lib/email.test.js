const test = require("node:test");
const assert = require("node:assert/strict");

const {buildInviteEmail, normalizeEmailForInvite} = require("./email.js");

test("buildInviteEmail includes register link with invite code", () => {
  const {subject, text} = buildInviteEmail({companyName: "ACME", inviteCode: "ABCDEFGH", baseUrl: "https://x.test"});
  assert.match(subject, /ACME/);
  assert.match(text, /https:\/\/x\.test\/register\/ABCDEFGH/);
});

test("normalizeEmailForInvite normalizes gmail dots and plus tags", () => {
  assert.equal(normalizeEmailForInvite("jukkis.ahonen+test@gmail.com"), "jukkisahonen@gmail.com");
  assert.equal(normalizeEmailForInvite("JUKKIS.AHONEN@googlemail.com"), "jukkisahonen@gmail.com");
});

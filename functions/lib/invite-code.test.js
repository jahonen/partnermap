const test = require("node:test");
const assert = require("node:assert/strict");

const {generateInviteCode} = require("./invite-code.js");

test("generateInviteCode returns correct length and allowed chars", () => {
  const code = generateInviteCode(8);
  assert.equal(code.length, 8);
  assert.match(code, /^[A-Z2-9]+$/);
});

const test = require("node:test");
const assert = require("node:assert/strict");

const {shouldSendReminder} = require("./reminders.js");

test("shouldSendReminder returns false when lastActivityAt is missing", () => {
  const nowMs = Date.now();
  assert.equal(
      shouldSendReminder({lastActivityAtMs: null, lastReminderSentMs: null, nowMs}),
      false,
  );
});

test("shouldSendReminder returns false when activity is too recent", () => {
  const nowMs = Date.now();
  const lastActivityAtMs = nowMs - 1 * 24 * 60 * 60 * 1000;
  assert.equal(
      shouldSendReminder({lastActivityAtMs, lastReminderSentMs: null, nowMs, minDaysSinceActivity: 3}),
      false,
  );
});

test("shouldSendReminder returns true when no previous reminder and activity old enough", () => {
  const nowMs = Date.now();
  const lastActivityAtMs = nowMs - 10 * 24 * 60 * 60 * 1000;
  assert.equal(
      shouldSendReminder({lastActivityAtMs, lastReminderSentMs: null, nowMs, minDaysSinceActivity: 3}),
      true,
  );
});

test("shouldSendReminder respects minDaysBetweenReminders", () => {
  const nowMs = Date.now();
  const lastActivityAtMs = nowMs - 10 * 24 * 60 * 60 * 1000;
  const lastReminderSentMs = nowMs - 2 * 24 * 60 * 60 * 1000;
  assert.equal(
      shouldSendReminder({lastActivityAtMs, lastReminderSentMs, nowMs, minDaysBetweenReminders: 7}),
      false,
  );
});

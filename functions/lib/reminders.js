function shouldSendReminder({lastActivityAtMs, lastReminderSentMs, nowMs, minDaysSinceActivity = 3, minDaysBetweenReminders = 7}) {
  if (!lastActivityAtMs) {
    return false;
  }

  const msInDay = 24 * 60 * 60 * 1000;
  const daysSinceActivity = (nowMs - lastActivityAtMs) / msInDay;

  if (daysSinceActivity < minDaysSinceActivity) {
    return false;
  }

  if (!lastReminderSentMs) {
    return true;
  }

  const daysSinceReminder = (nowMs - lastReminderSentMs) / msInDay;
  return daysSinceReminder >= minDaysBetweenReminders;
}

module.exports = {
  shouldSendReminder,
};

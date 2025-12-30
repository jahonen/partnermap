const {HttpsError} = require("firebase-functions/v2/https");
const logger = require("firebase-functions/logger");
const sgMail = require("@sendgrid/mail");

function initSendGrid(apiKey) {
  if (!apiKey) {
    throw new HttpsError("failed-precondition", "SENDGRID_API_KEY is not configured");
  }
  sgMail.setApiKey(apiKey);
}

function requireEmail(email) {
  if (typeof email !== "string") {
    throw new HttpsError("invalid-argument", "email must be a string");
  }
  const trimmed = email.trim();
  if (!trimmed || trimmed.length > 200 || !trimmed.includes("@")) {
    throw new HttpsError("invalid-argument", "email must be a valid email address");
  }
  return trimmed;
}

function normalizeEmailForInvite(email) {
  const trimmed = requireEmail(email);
  const lower = trimmed.toLowerCase();
  const atIdx = lower.indexOf("@");
  if (atIdx < 0) {
    return lower;
  }

  let local = lower.slice(0, atIdx);
  const domain = lower.slice(atIdx + 1);

  // Gmail: dots are ignored in the local part and +tags are ignored.
  if (domain === "gmail.com" || domain === "googlemail.com") {
    const plusIdx = local.indexOf("+");
    if (plusIdx >= 0) {
      local = local.slice(0, plusIdx);
    }
    local = local.replace(/\./g, "");
    return `${local}@gmail.com`;
  }

  return lower;
}

async function sendEmail({to, from, subject, text, html, apiKey}) {
  const recipient = requireEmail(to);
  const sender = requireEmail(from);

  initSendGrid(apiKey);

  logger.info("sendEmail:start", {structuredData: true, to: recipient});

  try {
    await sgMail.send({
      to: recipient,
      from: sender,
      subject,
      text,
      html,
    });
  } catch (err) {
    logger.error("sendEmail:error", {structuredData: true, to: recipient, message: err?.message});
    throw new HttpsError("internal", "Failed to send email");
  }

  logger.info("sendEmail:end", {structuredData: true, to: recipient});
}

function buildInviteEmail({companyName, inviteCode, baseUrl}) {
  const safeCompany = companyName || "your company";
  const link = `${baseUrl.replace(/\/$/, "")}/register/${inviteCode}`;

  return {
    subject: `Invitation to Partnership Mapping (${safeCompany})`,
    text: `You have been invited to Partnership Mapping for ${safeCompany}.\n\nOpen this link to register: ${link}\n\nThis tool helps co-founders align before drafting contracts.`,
  };
}

function buildReminderEmail({companyName, baseUrl}) {
  const safeCompany = companyName || "your company";
  const link = `${baseUrl.replace(/\/$/, "")}/login`;

  return {
    subject: `Reminder: complete your Partnership Mapping (${safeCompany})`,
    text: `Reminder: please complete your Partnership Mapping for ${safeCompany}.\n\nContinue here: ${link}`,
  };
}

function buildApprovalNotificationEmail({companyName, approverName, baseUrl}) {
  const safeCompany = companyName || "your company";
  const link = `${baseUrl.replace(/\/$/, "")}/final`;
  const safeApprover = approverName || "A participant";

  return {
    subject: `Approval update: ${safeCompany}`,
    text: `${safeApprover} approved the current blueprint for ${safeCompany}.\n\nView status here: ${link}`,
  };
}

module.exports = {
  requireEmail,
  normalizeEmailForInvite,
  sendEmail,
  buildInviteEmail,
  buildReminderEmail,
  buildApprovalNotificationEmail,
};

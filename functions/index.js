/**
 * Import function triggers from their respective submodules:
 *
 * const {onCall} = require("firebase-functions/v2/https");
 * const {onDocumentWritten} = require("firebase-functions/v2/firestore");
 *
 * See a full list of supported triggers at https://firebase.google.com/docs/functions
 */

const {setGlobalOptions} = require("firebase-functions");
const {defineSecret, defineString} = require("firebase-functions/params");
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const {onDocumentWritten} = require("firebase-functions/v2/firestore");
const {onSchedule} = require("firebase-functions/v2/scheduler");
const logger = require("firebase-functions/logger");

const admin = require("firebase-admin");

const {
  buildInviteEmail,
  buildReminderEmail,
  buildApprovalNotificationEmail,
  sendEmail,
  requireEmail,
  normalizeEmailForInvite,
} = require("./lib/email.js");

const {shouldSendReminder} = require("./lib/reminders.js");

const domainContentEn = require("./content/domain-content-en.json");
const domainContentFi = require("./content/domain-content-fi.json");
const domainContentSv = require("./content/domain-content-sv.json");
const domainContentEl = require("./content/domain-content-el.json");
const domainContentDe = require("./content/domain-content-de.json");
const domainContentFr = require("./content/domain-content-fr.json");
const domainContentEs = require("./content/domain-content-es.json");

admin.initializeApp();

const firestore = admin.firestore();

// For cost control, you can set the maximum number of containers that can be
// running at the same time. This helps mitigate the impact of unexpected
// traffic spikes by instead downgrading performance. This limit is a
// per-function limit. You can override the limit for each function using the
// `maxInstances` option in the function's options, e.g.
// `onRequest({ maxInstances: 5 }, (req, res) => { ... })`.
// NOTE: setGlobalOptions does not apply to functions using the v1 API. V1
// functions should each use functions.runWith({ maxInstances: 10 }) instead.
// In the v1 API, each function can only serve one request per container, so
// this will be the maximum concurrent request count.
setGlobalOptions({maxInstances: 10, region: "europe-west1"});

const sendgridApiKey = defineSecret("SENDGRID_API_KEY");
const sendgridFromEmail = defineString("SENDGRID_FROM_EMAIL");
const appBaseUrl = defineString("APP_BASE_URL");

function getBaseUrl() {
  return appBaseUrl.value() || "https://partnership-mapping.web.app";
}

function getDomainContentByLanguage(language) {
  const lang = (language || "").toString().trim().toLowerCase();
  if (lang === "fi") {
    return domainContentFi;
  }
  if (lang === "sv") {
    return domainContentSv;
  }
  if (lang === "el") {
    return domainContentEl;
  }
  if (lang === "de") {
    return domainContentDe;
  }
  if (lang === "fr") {
    return domainContentFr;
  }
  if (lang === "es") {
    return domainContentEs;
  }
  return domainContentEn;
}

function getCloseEmailCopy(language) {
  const lang = (language || "").toString().trim().toLowerCase();
  if (lang === "fi") {
    return {
      title: "Partnership Mapping suljettu",
      intro: "Blueprint on nyt suljettu. Alla ovat lopulliset valinnat ja osallistujien kommentit.",
      timelineTitle: "Aikajana",
      processStartedLabel: "Prosessi aloitettu",
      outcomeGeneratedLabel: "Tulos muodostettu",
      acceptedPartnersTitle: "Hyväksyneet kumppanit",
      selectionsTitle: "Lopulliset valinnat",
      commentsTitle: "Kommentit",
      dashboardLabel: "Dashboard",
      noComments: "(Ei kommentteja)",
      noAcceptedPartners: "(Ei kumppaneita)",
      subjectPrefix: "Outkomia Partnership Mapping blueprint",
      textIntro: "Partnership Mapping blueprint on suljettu.",
    };
  }
  if (lang === "sv") {
    return {
      title: "Partnership Mapping stängt",
      intro: "Blueprinten är nu stängd. Nedan finns de slutliga valen och partnernas kommentarer.",
      timelineTitle: "Tidslinje",
      processStartedLabel: "Processen startade",
      outcomeGeneratedLabel: "Resultat genererat",
      acceptedPartnersTitle: "Partners som godkände",
      selectionsTitle: "Slutliga val",
      commentsTitle: "Kommentarer",
      dashboardLabel: "Dashboard",
      noComments: "(Inga kommentarer)",
      noAcceptedPartners: "(Inga partners)",
      subjectPrefix: "Outkomia Partnership Mapping blueprint",
      textIntro: "Partnership Mapping blueprinten har stängts.",
    };
  }
  if (lang === "el") {
    return {
      title: "Το Partnership Mapping έκλεισε",
      intro: "Το blueprint έχει πλέον κλείσει. Παρακάτω είναι οι τελικές επιλογές και τα σχόλια των συμμετεχόντων.",
      timelineTitle: "Χρονολόγιο",
      processStartedLabel: "Έναρξη διαδικασίας",
      outcomeGeneratedLabel: "Δημιουργία αποτελέσματος",
      acceptedPartnersTitle: "Συνεργάτες που αποδέχτηκαν",
      selectionsTitle: "Τελικές επιλογές",
      commentsTitle: "Σχόλια",
      dashboardLabel: "Dashboard",
      noComments: "(Χωρίς σχόλια)",
      noAcceptedPartners: "(Χωρίς συνεργάτες)",
      subjectPrefix: "Outkomia Partnership Mapping blueprint",
      textIntro: "Το Partnership Mapping blueprint έχει κλείσει.",
    };
  }
  if (lang === "de") {
    return {
      title: "Partnership Mapping abgeschlossen",
      intro: "Der Blueprint ist jetzt abgeschlossen. Unten stehen die finalen Auswahlen und Kommentare der Partner.",
      timelineTitle: "Zeitplan",
      processStartedLabel: "Prozess gestartet",
      outcomeGeneratedLabel: "Ergebnis erstellt",
      acceptedPartnersTitle: "Partner, die zugestimmt haben",
      selectionsTitle: "Finale Auswahl",
      commentsTitle: "Kommentare",
      dashboardLabel: "Dashboard",
      noComments: "(Keine Kommentare)",
      noAcceptedPartners: "(Keine Partner)",
      subjectPrefix: "Outkomia Partnership Mapping blueprint",
      textIntro: "Der Partnership Mapping Blueprint wurde abgeschlossen.",
    };
  }
  if (lang === "fr") {
    return {
      title: "Partnership Mapping clôturé",
      intro: "Le blueprint est maintenant clôturé. Ci-dessous, les choix finaux et les commentaires des partenaires.",
      timelineTitle: "Chronologie",
      processStartedLabel: "Début du processus",
      outcomeGeneratedLabel: "Résultat généré",
      acceptedPartnersTitle: "Partenaires ayant accepté",
      selectionsTitle: "Choix finaux",
      commentsTitle: "Commentaires",
      dashboardLabel: "Dashboard",
      noComments: "(Aucun commentaire)",
      noAcceptedPartners: "(Aucun partenaire)",
      subjectPrefix: "Outkomia Partnership Mapping blueprint",
      textIntro: "Le blueprint Partnership Mapping a été clôturé.",
    };
  }
  if (lang === "es") {
    return {
      title: "Partnership Mapping cerrado",
      intro: "El blueprint está cerrado. A continuación están las selecciones finales y los comentarios de los socios.",
      timelineTitle: "Cronología",
      processStartedLabel: "Inicio del proceso",
      outcomeGeneratedLabel: "Resultado generado",
      acceptedPartnersTitle: "Socios que aceptaron",
      selectionsTitle: "Selecciones finales",
      commentsTitle: "Comentarios",
      dashboardLabel: "Dashboard",
      noComments: "(Sin comentarios)",
      noAcceptedPartners: "(Sin socios)",
      subjectPrefix: "Outkomia Partnership Mapping blueprint",
      textIntro: "El blueprint de Partnership Mapping ha sido cerrado.",
    };
  }
  return {
    title: "Partnership Mapping closed",
    intro: "The blueprint is now closed. Below are the final selections and partner comments.",
    timelineTitle: "Timeline",
    processStartedLabel: "Process started",
    outcomeGeneratedLabel: "Outcome generated",
    acceptedPartnersTitle: "Partners who accepted",
    selectionsTitle: "Final selections",
    commentsTitle: "Comments",
    dashboardLabel: "Dashboard",
    noComments: "(No comments)",
    noAcceptedPartners: "(No partners)",
    subjectPrefix: "Outkomia Partnership Mapping blueprint",
    textIntro: "The Partnership Mapping blueprint has been closed.",
  };
}

function escapeHtml(text) {
  return (text || "").toString().replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function formatTimestampUtc(ts) {
  if (!ts) {
    return "";
  }
  const d = ts?.toDate ? ts.toDate() : ts instanceof Date ? ts : null;
  if (!d || Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toISOString().replace("T", " ").replace("Z", " UTC");
}

function buildBrandedEmailHtml({title, subtitle, bodyHtml, baseUrl}) {
  const safeBaseUrl = (baseUrl || "").toString().trim() || getBaseUrl();
  const logoUrl = `${safeBaseUrl.replace(/\/$/, "")}/Partnermap_by_Outkomia_logo.png`;
  const safeTitle = title || "Outkomia Partnership Mapping";
  const safeSubtitle = subtitle || "";
  const safeBody = bodyHtml || "";

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body style="margin:0;padding:0;background:#f6f7f8;font-family:Arial, Helvetica, sans-serif;color:#2c3539;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f7f8;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellspacing="0" cellpadding="0" style="max-width:600px;background:#ffffff;border:1px solid rgba(44,53,57,0.10);border-radius:16px;overflow:hidden;">
            <tr>
              <td style="padding:18px 22px;background:#ffffff;border-bottom:1px solid rgba(44,53,57,0.08);">
                <img src="${logoUrl}" alt="Outkomia Partnermap" style="display:block;height:38px;width:auto;" />
              </td>
            </tr>
            <tr>
              <td style="padding:22px;">
                <div style="font-size:18px;font-weight:700;margin:0 0 6px;">${safeTitle}</div>
                ${safeSubtitle ? `<div style="font-size:13px;color:rgba(44,53,57,0.78);margin:0 0 14px;">${safeSubtitle}</div>` : ""}
                <div style="font-size:14px;line-height:1.6;">${safeBody}</div>
              </td>
            </tr>
            <tr>
              <td style="padding:14px 22px;background:#ffffff;border-top:1px solid rgba(44,53,57,0.08);font-size:12px;color:rgba(44,53,57,0.65);">
                Outkomia — Partnership Mapping
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function sendClosedEmailsToParticipants({
  companySnap,
  companyRef,
  participants,
  acceptanceByUser,
  selections,
  comments,
  workflow,
  now,
  baseUrl,
  from,
}) {
  let sentCount = 0;
  const prettyComments = (comments || [])
      .map((c) => `- ${c.userName || ""}: ${c.text || ""}`)
      .join("\n");

  const userSnaps = await Promise.all(
      (participants || []).map((p) => firestore.collection("users").doc(p.userId).get().catch(() => null)),
  );
  const languageByUserId = new Map();
  userSnaps.forEach((snap, idx) => {
    const uid = participants[idx]?.userId;
    if (!uid) {
      return;
    }
    const lang = snap && snap.exists ? (snap.data()?.language || "") : "";
    languageByUserId.set(uid, lang);
  });

  const processStartedAt = workflow?.reviewStartedAt || workflow?.finalizeStartedAt || null;
  const processStartedAtStr = formatTimestampUtc(processStartedAt);
  const outcomeGeneratedAtStr = formatTimestampUtc(now);

  const acceptedEmails = (participants || [])
      .filter((p) => (acceptanceByUser.get(p.userId)?.status || "pending") === "accepted")
      .map((p) => (p.email || "").toString().trim())
      .filter((email) => Boolean(email))
      .sort((a, b) => a.localeCompare(b));

  for (const p of participants || []) {
    const email = p.email;
    if (!email) {
      continue;
    }

    const language = languageByUserId.get(p.userId) || "en";
    const copy = getCloseEmailCopy(language);
    const content = getDomainContentByLanguage(language);
    const domains = content?.domains || {};

    const selectionRows = Object.entries(selections || {})
        .map(([domainKey, option]) => {
          const domain = domains?.[domainKey] || {};
          const solutions = Array.isArray(domain?.solutions) ? domain.solutions : [];
          const sel = solutions.find((s) => Number(s.option) === Number(option)) || null;
          const domainName = domain?.name || domainKey;
          const optionName = sel?.name || `Option ${String(option)}`;
          const optionDesc = sel?.description || "";
          return {
            domainKey,
            domainName,
            optionName,
            optionDesc,
          };
        })
        .sort((a, b) => a.domainName.localeCompare(b.domainName));

    const selectionsHtml = selectionRows.length ? selectionRows.map((row) => {
      const safeDesc = escapeHtml(row.optionDesc);
      const safeName = escapeHtml(row.optionName);
      const safeDomain = escapeHtml(row.domainName);
      return `
          <div style="margin:0 0 14px;">
            <div style="font-size:14px;font-weight:700;margin:0 0 4px;">${safeDomain}</div>
            <div style="font-size:13px;font-weight:700;margin:0 0 6px;">${safeName}</div>
            <div style="font-size:13px;color:rgba(44,53,57,0.85);line-height:1.55;">${safeDesc}</div>
          </div>
        `;
    }).join("") : "";

    const dashboardUrl = `${baseUrl.replace(/\/$/, "")}/dashboard`;

    const subject = `${copy.subjectPrefix}: ${companySnap.data()?.name || ""}`.trim();
    const text = `${copy.textIntro} ${companySnap.data()?.name || ""}.\n\n${copy.dashboardLabel}: ${dashboardUrl}`.trim();

    const html = buildBrandedEmailHtml({
      title: copy.title,
      subtitle: companySnap.data()?.name || "",
      bodyHtml: `
          <p>${copy.intro}</p>
          <p><strong>${copy.timelineTitle}</strong></p>
          <div style="font-size:13px;color:rgba(44,53,57,0.85);line-height:1.55;margin:0 0 14px;">
            <div><strong>${copy.processStartedLabel}:</strong> ${escapeHtml(processStartedAtStr || "-")}</div>
            <div><strong>${copy.outcomeGeneratedLabel}:</strong> ${escapeHtml(outcomeGeneratedAtStr || "-")}</div>
          </div>
          <p><strong>${copy.acceptedPartnersTitle}</strong></p>
          ${acceptedEmails.length ? `
            <ul style="margin:0 0 14px;padding-left:18px;">
              ${acceptedEmails.map((e) => `<li style="margin:0 0 6px;">${escapeHtml(e)}</li>`).join("")}
            </ul>
          ` : `<p style="font-size:13px;color:rgba(44,53,57,0.85);line-height:1.55;margin:0 0 14px;">${copy.noAcceptedPartners}</p>`}
          <p><strong>${copy.selectionsTitle}</strong></p>
          ${selectionsHtml || ""}
          <p><strong>${copy.commentsTitle}</strong></p>
          <pre style="white-space:pre-wrap;background:rgba(44,53,57,0.04);padding:12px;border-radius:12px;border:1px solid rgba(44,53,57,0.10);font-size:12px;line-height:1.5;">${escapeHtml(prettyComments || copy.noComments)}</pre>
          <p style="margin-top:16px;">${copy.dashboardLabel}: <a href="${dashboardUrl}">${dashboardUrl}</a></p>
        `,
      baseUrl,
    });

    await sendEmail({
      to: email,
      from,
      subject,
      text,
      html,
      apiKey: sendgridApiKey.value(),
    });

    sentCount += 1;
  }

  return {sentCount};
}

function getFromEmail() {
  const from = sendgridFromEmail.value();
  if (!from) {
    throw new HttpsError("failed-precondition", "SENDGRID_FROM_EMAIL is not configured");
  }
  return requireEmail(from);
}

function requireAuth(context) {
  if (!context.auth || !context.auth.uid) {
    throw new HttpsError("unauthenticated", "Authentication required");
  }
}

function normalizeInviteCode(inviteCode) {
  if (typeof inviteCode !== "string") {
    return "";
  }
  return inviteCode.trim().toUpperCase();
}

function generateInviteCode(length) {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";

  for (let i = 0; i < length; i += 1) {
    result += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }

  return result;
}

async function generateUniqueInviteCode() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const code = generateInviteCode(8);
    const codeRef = firestore.collection("inviteCodes").doc(code);
    const existing = await codeRef.get();
    if (!existing.exists) {
      return code;
    }
  }

  throw new HttpsError("internal", "Failed to generate unique invite code");
}

exports.createCompany = onCall(async (request) => {
  try {
    const {data, auth} = request;
    requireAuth(request);

    const companyName = typeof data?.companyName === "string" ? data.companyName.trim() : "";
    const userName = typeof data?.userName === "string" ? data.userName.trim() : "";

    if (!companyName || companyName.length > 100) {
      throw new HttpsError("invalid-argument", "companyName is required and must be <= 100 chars");
    }
    if (!userName || userName.length > 100) {
      throw new HttpsError("invalid-argument", "userName is required and must be <= 100 chars");
    }

    const userId = auth.uid;
    const userEmail = auth.token?.email || "";
    if (!userEmail) {
      throw new HttpsError("invalid-argument", "Authenticated user must have an email");
    }

    logger.info("createCompany:start", {structuredData: true, userId});

    const inviteCode = await generateUniqueInviteCode();
    const companyRef = firestore.collection("companies").doc();
    const inviteCodeRef = firestore.collection("inviteCodes").doc(inviteCode);
    const participantRef = companyRef.collection("participants").doc(userId);
    const userRef = firestore.collection("users").doc(userId);

    const now = admin.firestore.FieldValue.serverTimestamp();

    await firestore.runTransaction(async (tx) => {
      tx.set(companyRef, {
        name: companyName,
        createdBy: userId,
        createdAt: now,
        status: "new",
        inviteCode,
        adminEmail: userEmail,
      });

      tx.set(inviteCodeRef, {
        companyId: companyRef.id,
        createdAt: now,
      });

      tx.set(participantRef, {
        userId,
        email: userEmail,
        name: userName,
        role: "admin",
        status: "registered",
        invitedAt: now,
        registeredAt: now,
        lastReminderSent: null,
        lastActivityAt: now,
      });

      tx.set(userRef, {
        activeCompanyId: companyRef.id,
        email: userEmail,
        name: userName,
        updatedAt: now,
      }, {merge: true});
    });

    logger.info("createCompany:end", {structuredData: true, userId, companyId: companyRef.id});

    return {
      companyId: companyRef.id,
      inviteCode,
    };
  } catch (err) {
    const message = err?.message || "createCompany failed";
    logger.error("createCompany:error", {structuredData: true, message, err});
    if (err instanceof HttpsError) {
      throw err;
    }
    throw new HttpsError("internal", message);
  }
});

exports.joinCompany = onCall(async (request) => {
  const {data, auth} = request;
  requireAuth(request);

  const inviteCode = normalizeInviteCode(data?.inviteCode);
  const userName = typeof data?.userName === "string" ? data.userName.trim() : "";

  if (!inviteCode || inviteCode.length !== 8) {
    throw new HttpsError("invalid-argument", "inviteCode is required and must be 8 chars");
  }
  if (!userName || userName.length > 100) {
    throw new HttpsError("invalid-argument", "userName is required and must be <= 100 chars");
  }

  const userId = auth.uid;
  const userEmail = auth.token?.email || "";
  if (!userEmail) {
    throw new HttpsError("invalid-argument", "Authenticated user must have an email");
  }

  logger.info("joinCompany:start", {structuredData: true, userId, inviteCode});

  const inviteCodeSnap = await firestore.collection("inviteCodes").doc(inviteCode).get();
  if (!inviteCodeSnap.exists) {
    throw new HttpsError("not-found", "Invite code not found");
  }

  const companyId = inviteCodeSnap.data()?.companyId;
  if (!companyId) {
    throw new HttpsError("internal", "Invite code mapping is invalid");
  }

  const companyRef = firestore.collection("companies").doc(companyId);
  const companySnap = await companyRef.get();
  if (!companySnap.exists) {
    throw new HttpsError("not-found", "Company not found");
  }

  const status = companySnap.data()?.status;
  if (status === "finalized") {
    throw new HttpsError("failed-precondition", "Company is finalized and cannot accept new participants");
  }

  const participantRef = companyRef.collection("participants").doc(userId);
  const userRef = firestore.collection("users").doc(userId);
  const inviteKey = normalizeEmailForInvite(userEmail);
  const inviteRef = companyRef.collection("invites").doc(inviteKey);
  const now = admin.firestore.FieldValue.serverTimestamp();

  await firestore.runTransaction(async (tx) => {
    const existingParticipant = await tx.get(participantRef);
    if (existingParticipant.exists) {
      tx.update(participantRef, {
        name: userName,
        email: userEmail,
        lastActivityAt: now,
      });

      tx.set(userRef, {
        activeCompanyId: companyId,
        email: userEmail,
        name: userName,
        updatedAt: now,
      }, {merge: true});

      tx.set(inviteRef, {
        email: userEmail,
        emailLower: userEmail.trim().toLowerCase(),
        inviteKey,
        status: "accepted",
        acceptedAt: now,
        acceptedBy: userId,
        updatedAt: now,
      }, {merge: true});
      return;
    }

    tx.set(participantRef, {
      userId,
      email: userEmail,
      name: userName,
      role: "founder",
      status: "registered",
      invitedAt: now,
      registeredAt: now,
      lastReminderSent: null,
      lastActivityAt: now,
    });

    tx.set(userRef, {
      activeCompanyId: companyId,
      email: userEmail,
      name: userName,
      updatedAt: now,
    }, {merge: true});

    tx.set(inviteRef, {
      email: userEmail,
      emailLower: userEmail.trim().toLowerCase(),
      inviteKey,
      status: "accepted",
      acceptedAt: now,
      acceptedBy: userId,
      updatedAt: now,
    }, {merge: true});
  });

  logger.info("joinCompany:end", {structuredData: true, userId, companyId});

  return {
    companyId,
  };
});

exports.sendInviteEmail = onCall(
    {secrets: [sendgridApiKey]},
    async (request) => {
      requireAuth(request);

      const inviteCode = normalizeInviteCode(request.data?.inviteCode);
      const recipientEmail = requireEmail(request.data?.email);

      if (!inviteCode || inviteCode.length !== 8) {
        throw new HttpsError("invalid-argument", "inviteCode is required and must be 8 chars");
      }

      const inviteCodeSnap = await firestore.collection("inviteCodes").doc(inviteCode).get();
      if (!inviteCodeSnap.exists) {
        throw new HttpsError("not-found", "Invite code not found");
      }

      const companyId = inviteCodeSnap.data()?.companyId;
      if (!companyId) {
        throw new HttpsError("internal", "Invite code mapping is invalid");
      }

      const companyRef = firestore.collection("companies").doc(companyId);
      const companySnap = await companyRef.get();
      if (!companySnap.exists) {
        throw new HttpsError("not-found", "Company not found");
      }

      const workflowSnap = await companyRef.collection("workflow").doc("state").get();
      const stage = workflowSnap.exists ? (workflowSnap.data()?.stage || "assessment") : "assessment";
      if (stage !== "assessment") {
        throw new HttpsError("failed-precondition", "Invites are locked once review begins");
      }

      const requesterId = request.auth.uid;
      const requesterParticipantRef = companyRef.collection("participants").doc(requesterId);
      const requesterSnap = await requesterParticipantRef.get();
      if (!requesterSnap.exists || requesterSnap.data()?.role !== "admin") {
        throw new HttpsError("permission-denied", "Only admins can send invites");
      }

      const now = admin.firestore.FieldValue.serverTimestamp();
      const inviteKey = normalizeEmailForInvite(recipientEmail);
      const recipientLower = recipientEmail.trim().toLowerCase();
      const inviteRef = companyRef.collection("invites").doc(inviteKey);

      await firestore.runTransaction(async (tx) => {
        const existing = await tx.get(inviteRef);
        const existingStatus = existing.exists ? (existing.data()?.status || "") : "";

        tx.set(inviteRef, {
          email: recipientEmail,
          emailLower: recipientLower,
          inviteKey,
          inviteCode,
          status: existingStatus === "accepted" ? "accepted" : "pending",
          sentAt: now,
          sentBy: requesterId,
          updatedAt: now,
        }, {merge: true});
      });

      const companyName = companySnap.data()?.name || "";
      const {subject, text} = buildInviteEmail({companyName, inviteCode, baseUrl: getBaseUrl()});

      await sendEmail({
        to: recipientEmail,
        from: getFromEmail(),
        subject,
        text,
        apiKey: sendgridApiKey.value(),
      });

      return {ok: true};
    },
);

exports.cancelInvite = onCall(async (request) => {
  requireAuth(request);

  const inviteCode = normalizeInviteCode(request.data?.inviteCode);
  const recipientEmail = requireEmail(request.data?.email);

  if (!inviteCode || inviteCode.length !== 8) {
    throw new HttpsError("invalid-argument", "inviteCode is required and must be 8 chars");
  }

  const inviteCodeSnap = await firestore.collection("inviteCodes").doc(inviteCode).get();
  if (!inviteCodeSnap.exists) {
    throw new HttpsError("not-found", "Invite code not found");
  }

  const companyId = inviteCodeSnap.data()?.companyId;
  if (!companyId) {
    throw new HttpsError("internal", "Invite code mapping is invalid");
  }

  const companyRef = firestore.collection("companies").doc(companyId);
  const requesterId = request.auth.uid;
  const requesterParticipantRef = companyRef.collection("participants").doc(requesterId);
  const requesterSnap = await requesterParticipantRef.get();
  if (!requesterSnap.exists || requesterSnap.data()?.role !== "admin") {
    throw new HttpsError("permission-denied", "Only admins can cancel invites");
  }

  const inviteKey = normalizeEmailForInvite(recipientEmail);
  const inviteRef = companyRef.collection("invites").doc(inviteKey);
  const inviteSnap = await inviteRef.get();
  if (!inviteSnap.exists) {
    return {ok: true};
  }

  if (inviteSnap.data()?.status && inviteSnap.data()?.status !== "pending") {
    throw new HttpsError("failed-precondition", "Only pending invites can be cancelled");
  }

  await inviteRef.delete();
  return {ok: true};
});

exports.generateBlueprint = onCall({secrets: [sendgridApiKey]}, async (request) => {
  requireAuth(request);

  const companyId = typeof request.data?.companyId === "string" ? request.data.companyId.trim() : "";
  if (!companyId) {
    throw new HttpsError("invalid-argument", "companyId is required");
  }

  const companyRef = firestore.collection("companies").doc(companyId);
  const companySnap = await companyRef.get();
  if (!companySnap.exists) {
    throw new HttpsError("not-found", "Company not found");
  }

  const requesterId = request.auth.uid;
  const participantRef = companyRef.collection("participants").doc(requesterId);
  const participantSnap = await participantRef.get();
  if (!participantSnap.exists) {
    throw new HttpsError("permission-denied", "Not a participant");
  }

  const requesterRole = participantSnap.data()?.role || "";
  const isAdmin = requesterRole === "admin";

  const action = typeof request.data?.action === "string" ? request.data.action.trim() : "";
  const domains = Array.isArray(request.data?.domains) ? request.data.domains : [];
  const now = admin.firestore.FieldValue.serverTimestamp();

  const workflowRef = companyRef.collection("workflow").doc("state");
  const blueprintRef = companyRef.collection("blueprint").doc("current");

  const baseUrl = getBaseUrl();
  const from = getFromEmail();

  function requireAdminAction() {
    if (!isAdmin) {
      throw new HttpsError("permission-denied", "Only admins can perform this action");
    }
  }

  function requireDomainsProvided() {
    if (!Array.isArray(domains) || domains.length < 1) {
      throw new HttpsError("invalid-argument", "domains array is required");
    }
  }

  if (action === "reconcileInvites") {
    requireAdminAction();

    const [participantsSnap, invitesSnap] = await Promise.all([
      companyRef.collection("participants").get(),
      companyRef.collection("invites").get(),
    ]);

    const participants = participantsSnap.docs.map((d) => ({userId: d.id, ...d.data()}));
    const participantKeys = new Set(
        participants
            .map((p) => p?.email)
            .filter(Boolean)
            .map((email) => normalizeEmailForInvite(email)),
    );

    const fixes = [];
    invitesSnap.docs.forEach((d) => {
      const invite = d.data() || {};
      const status = (invite.status || "").toString().trim().toLowerCase();
      if (status !== "pending") {
        return;
      }
      const inviteKey = (invite.inviteKey || d.id || "").toString();
      if (!inviteKey) {
        return;
      }
      if (!participantKeys.has(inviteKey)) {
        return;
      }
      fixes.push({ref: d.ref, inviteKey});
    });

    if (!fixes.length) {
      return {ok: true, updated: 0};
    }

    await firestore.runTransaction(async (tx) => {
      fixes.forEach((f) => {
        tx.set(f.ref, {
          status: "accepted",
          acceptedAt: now,
          updatedAt: now,
          reconciledAt: now,
          reconciledBy: requesterId,
        }, {merge: true});
      });
    });

    return {ok: true, updated: fixes.length};
  }

  async function computeStrictReadiness() {
    requireDomainsProvided();

    const [participantsSnap, responsesSnap, invitesSnap] = await Promise.all([
      companyRef.collection("participants").get(),
      companyRef.collection("responses").get(),
      companyRef.collection("invites").get(),
    ]);

    const pendingInvites = invitesSnap.docs
        .map((d) => d.data() || {})
        .filter((i) => (i.status || "") === "pending").length;

    const participants = participantsSnap.docs.map((d) => ({userId: d.id, ...d.data()}));
    const responses = responsesSnap.docs.map((d) => ({userId: d.id, ...d.data()}));

    const responseByUser = new Map();
    responses.forEach((r) => responseByUser.set(r.userId, r));

    const missing = [];
    participants.forEach((p) => {
      const r = responseByUser.get(p.userId);
      if (!r || !r.domains) {
        missing.push(p.userId);
        return;
      }
      for (const domainKey of domains) {
        const sel = r.domains?.[domainKey] || {};
        const opts = Array.isArray(sel.options) ? sel.options : (sel.option != null ? [sel.option] : []);
        if (!opts.length) {
          missing.push(p.userId);
          return;
        }
      }
    });

    return {
      pendingInvites,
      participantsCount: participants.length,
      missingUserIds: Array.from(new Set(missing)),
    };
  }

  async function getWorkflowStage() {
    const snap = await workflowRef.get();
    return snap.exists ? (snap.data()?.stage || "assessment") : "assessment";
  }

  async function requireStage(expected) {
    const stage = await getWorkflowStage();
    if (stage !== expected) {
      throw new HttpsError("failed-precondition", `Invalid stage: expected ${expected}`);
    }
  }

  function requireAcceptStatus(status) {
    if (!["pending", "accepted", "rejected"].includes(status)) {
      throw new HttpsError("invalid-argument", "status must be one of: pending, accepted, rejected");
    }
  }

  async function requireBlueprintComplete() {
    requireDomainsProvided();
    const blueprintSnap = await blueprintRef.get();
    const selections = blueprintSnap.exists ? (blueprintSnap.data()?.selections || {}) : {};
    const missing = [];
    for (const domainKey of domains) {
      const option = selections?.[domainKey];
      if (!Number.isFinite(Number(option))) {
        missing.push(domainKey);
      }
    }
    if (missing.length) {
      throw new HttpsError("failed-precondition", "Finalize is not available until exactly one option is selected per domain");
    }
  }

  if (action === "startReview") {
    requireAdminAction();
    await requireStage("assessment");
    const readiness = await computeStrictReadiness();
    if (readiness.pendingInvites > 0) {
      throw new HttpsError("failed-precondition", "Cannot start review while there are pending invites");
    }
    if (readiness.missingUserIds.length > 0) {
      throw new HttpsError("failed-precondition", "Cannot start review until all participants have completed responses");
    }

    await workflowRef.set({
      stage: "review",
      domains,
      reviewStartedAt: now,
      reviewStartedBy: requesterId,
      updatedAt: now,
    }, {merge: true});

    return {ok: true};
  }

  if (action === "setBlueprintSelection") {
    requireAdminAction();
    await requireStage("review");
    const domainKey = typeof request.data?.domainKey === "string" ? request.data.domainKey.trim() : "";
    const option = Number(request.data?.option);
    if (!domainKey) {
      throw new HttpsError("invalid-argument", "domainKey is required");
    }
    if (!Number.isFinite(option)) {
      throw new HttpsError("invalid-argument", "option must be a number");
    }
    await blueprintRef.set({
      selections: {
        [domainKey]: option,
      },
      updatedAt: now,
      updatedBy: requesterId,
    }, {merge: true});
    return {ok: true};
  }

  if (action === "startFinalize") {
    requireAdminAction();
    await requireStage("review");
    await requireBlueprintComplete();

    const acceptanceRef = companyRef.collection("acceptance").doc(requesterId);

    await firestore.runTransaction(async (tx) => {
      tx.set(workflowRef, {
        stage: "finalize",
        finalizeStartedAt: now,
        finalizeStartedBy: requesterId,
        updatedAt: now,
      }, {merge: true});

      tx.set(acceptanceRef, {
        status: "accepted",
        comment: "",
        updatedAt: now,
        autoAcceptedAt: now,
      }, {merge: true});
    });

    return {ok: true};
  }

  if (action === "setAcceptance") {
    await requireStage("finalize");
    const status = typeof request.data?.status === "string" ? request.data.status.trim().toLowerCase() : "";
    requireAcceptStatus(status);
    const comment = typeof request.data?.comment === "string" ? request.data.comment.trim().slice(0, 500) : "";

    const acceptanceRef = companyRef.collection("acceptance").doc(requesterId);
    await acceptanceRef.set({
      status,
      comment,
      updatedAt: now,
    }, {merge: true});
    return {ok: true};
  }

  if (action === "closeFinalize") {
    requireAdminAction();
    await requireStage("finalize");

    const [participantsSnap, acceptanceSnap, blueprintSnap, commentsSnap, workflowSnap] = await Promise.all([
      companyRef.collection("participants").get(),
      companyRef.collection("acceptance").get(),
      blueprintRef.get(),
      companyRef.collection("comments").orderBy("createdAt", "desc").get(),
      workflowRef.get(),
    ]);

    const participants = participantsSnap.docs.map((d) => ({userId: d.id, ...d.data()}));
    const acceptance = acceptanceSnap.docs.map((d) => ({userId: d.id, ...d.data()}));
    const acceptanceByUser = new Map(acceptance.map((a) => [a.userId, a]));

    const workflow = workflowSnap.exists ? (workflowSnap.data() || {}) : {};

    const missing = participants.filter((p) => (acceptanceByUser.get(p.userId)?.status || "pending") !== "accepted");
    if (missing.length) {
      throw new HttpsError("failed-precondition", "Cannot close until all invited partners have accepted");
    }

    const blueprint = blueprintSnap.exists ? (blueprintSnap.data() || {}) : {};
    const selections = blueprint?.selections || {};

    const comments = commentsSnap.docs.map((d) => ({id: d.id, ...d.data()}));

    const emailRes = await sendClosedEmailsToParticipants({
      companySnap,
      companyRef,
      participants,
      acceptanceByUser,
      selections,
      comments,
      workflow,
      now,
      baseUrl,
      from,
    });

    await workflowRef.set({
      stage: "closed",
      closedAt: now,
      closedBy: requesterId,
      updatedAt: now,
    }, {merge: true});

    await companyRef.set({
      status: "closed",
      updatedAt: now,
    }, {merge: true});

    return {ok: true, ...emailRes};
  }

  if (action === "resendClosedEmail") {
    requireAdminAction();
    await requireStage("closed");

    const [participantsSnap, acceptanceSnap, blueprintSnap, commentsSnap, workflowSnap] = await Promise.all([
      companyRef.collection("participants").get(),
      companyRef.collection("acceptance").get(),
      blueprintRef.get(),
      companyRef.collection("comments").orderBy("createdAt", "desc").get(),
      workflowRef.get(),
    ]);

    const participants = participantsSnap.docs.map((d) => ({userId: d.id, ...d.data()}));
    const acceptance = acceptanceSnap.docs.map((d) => ({userId: d.id, ...d.data()}));
    const acceptanceByUser = new Map(acceptance.map((a) => [a.userId, a]));

    const workflow = workflowSnap.exists ? (workflowSnap.data() || {}) : {};

    const blueprint = blueprintSnap.exists ? (blueprintSnap.data() || {}) : {};
    const selections = blueprint?.selections || {};

    const comments = commentsSnap.docs.map((d) => ({id: d.id, ...d.data()}));

    const emailRes = await sendClosedEmailsToParticipants({
      companySnap,
      companyRef,
      participants,
      acceptanceByUser,
      selections,
      comments,
      workflow,
      now,
      baseUrl,
      from,
    });

    return {ok: true, ...emailRes};
  }

  if (action === "startFromScratch") {
    requireAdminAction();

    const confirm = typeof request.data?.confirm === "string" ? request.data.confirm.trim() : "";
    if (confirm.toUpperCase() !== "DELETE") {
      throw new HttpsError("failed-precondition", "Confirmation required: type DELETE to start over");
    }

    await Promise.all([
      firestore.recursiveDelete(companyRef.collection("responses")),
      firestore.recursiveDelete(companyRef.collection("comments")),
      firestore.recursiveDelete(companyRef.collection("acceptance")),
      blueprintRef.delete().catch(() => {}),
      workflowRef.delete().catch(() => {}),
    ]);

    await companyRef.set({
      status: "new",
      updatedAt: now,
    }, {merge: true});

    return {ok: true};
  }

  const [participantsSnap, responsesSnap, approvalsSnap, acceptanceSnap, workflowSnap, blueprintSnap] = await Promise.all([
    companyRef.collection("participants").get(),
    companyRef.collection("responses").get(),
    companyRef.collection("approvals").get(),
    companyRef.collection("acceptance").get(),
    workflowRef.get(),
    blueprintRef.get(),
  ]);

  const participants = participantsSnap.docs.map((d) => ({id: d.id, ...d.data()}));
  const responses = responsesSnap.docs.map((d) => ({userId: d.id, ...d.data()}));
  const approvals = approvalsSnap.docs.map((d) => ({userId: d.id, ...d.data()}));
  const acceptance = acceptanceSnap.docs.map((d) => ({userId: d.id, ...d.data()}));

  const workflow = workflowSnap.exists ? workflowSnap.data() : null;
  const blueprint = blueprintSnap.exists ? blueprintSnap.data() : null;

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    companyId,
    companyName: companySnap.data()?.name || "",
    participants,
    responses,
    approvals,
    acceptance,
    workflow,
    blueprint,
  };
});

exports.sendReminders = onSchedule(
    {secrets: [sendgridApiKey], schedule: "every 24 hours"},
    async () => {
      const now = admin.firestore.Timestamp.now();
      const nowMs = now.toMillis();

      const companiesSnap = await firestore.collection("companies").get();
      const baseUrl = getBaseUrl();
      const from = getFromEmail();

      for (const companyDoc of companiesSnap.docs) {
        const companyId = companyDoc.id;
        const companyName = companyDoc.data()?.name || "";

        const participantsSnap = await firestore.collection("companies").doc(companyId).collection("participants").get();
        for (const pDoc of participantsSnap.docs) {
          const p = pDoc.data() || {};
          const email = p.email;
          if (!email) {
            continue;
          }

          const lastActivityAtMs = p.lastActivityAt?.toMillis ? p.lastActivityAt.toMillis() : null;
          const lastReminderSentMs = p.lastReminderSent?.toMillis ? p.lastReminderSent.toMillis() : null;

          const shouldSend = shouldSendReminder({lastActivityAtMs, lastReminderSentMs, nowMs});
          if (!shouldSend) {
            continue;
          }

          const {subject, text} = buildReminderEmail({companyName, baseUrl});

          await sendEmail({
            to: email,
            from,
            subject,
            text,
            apiKey: sendgridApiKey.value(),
          });

          await pDoc.ref.update({
            lastReminderSent: now,
          });
        }
      }
    },
);

exports.onApprovalWritten = onDocumentWritten(
    {document: "companies/{companyId}/approvals/{userId}", secrets: [sendgridApiKey]},
    async (event) => {
      const before = event.data?.before?.data() || null;
      const after = event.data?.after?.data() || null;

      const wasApproved = Boolean(before?.approved);
      const isApproved = Boolean(after?.approved);
      if (!isApproved || wasApproved === isApproved) {
        return;
      }

      const companyId = event.params.companyId;
      const userId = event.params.userId;

      const companyRef = firestore.collection("companies").doc(companyId);
      const companySnap = await companyRef.get();
      if (!companySnap.exists) {
        return;
      }

      const companyName = companySnap.data()?.name || "";
      const adminEmail = companySnap.data()?.adminEmail || "";
      if (!adminEmail) {
        return;
      }

      const participantSnap = await companyRef.collection("participants").doc(userId).get();
      const approverName = participantSnap.exists ? participantSnap.data()?.name : "";

      const {subject, text} = buildApprovalNotificationEmail({
        companyName,
        approverName,
        baseUrl: getBaseUrl(),
      });

      await sendEmail({
        to: adminEmail,
        from: getFromEmail(),
        subject,
        text,
        apiKey: sendgridApiKey.value(),
      });

      logger.info("onApprovalWritten:sent", {structuredData: true, companyId, userId});
    },
);

// Create and deploy your first functions
// https://firebase.google.com/docs/functions/get-started

// exports.helloWorld = onRequest((request, response) => {
//   logger.info("Hello logs!", {structuredData: true});
//   response.send("Hello from Firebase!");
// });

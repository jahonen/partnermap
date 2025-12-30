import { signOut } from 'firebase/auth'
import { httpsCallable } from 'firebase/functions'
import { useQueryClient } from '@tanstack/react-query'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { useDomainContent } from '../../content/use-domain-content.js'
import { useUiStrings } from '../../content/use-ui-strings.js'
import { firebaseAuth, firebaseFunctions } from '../../firebase/firebase.js'
import { useApprovals } from '../../data/use-approvals.js'
import { useCompanyResponsesRealtime } from '../../data/use-company-responses-realtime.js'
import { useInvitesRealtime } from '../../data/use-invites-realtime.js'
import { useParticipantsRealtime } from '../../data/use-participants-realtime.js'
import { useUserCompanyContext } from '../../data/use-user-company-context.js'
import { useWorkflowActions } from '../../data/use-workflow-actions.js'
import { useBlueprint, useWorkflowState } from '../../data/use-workflow.js'
import { useAcceptanceRealtime } from '../../data/use-acceptance-realtime.js'
import styles from './DashboardPage.module.scss'

export default function DashboardPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { data, isLoading, error } = useUserCompanyContext()
  const domainContent = useDomainContent()
  const ui = useUiStrings()

  const { data: invites } = useInvitesRealtime()
  const { data: participants } = useParticipantsRealtime()
  const { data: companyResponses } = useCompanyResponsesRealtime()
  const { data: approvals } = useApprovals()
  const { data: workflowState } = useWorkflowState()
  const { data: blueprint } = useBlueprint()
  const { data: acceptance } = useAcceptanceRealtime()
  const { mutateAsync: runWorkflowAction, isPending: isRunningWorkflowAction } = useWorkflowActions()

  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteStatus, setInviteStatus] = useState('')
  const [inviteError, setInviteError] = useState('')
  const [isSendingInvite, setIsSendingInvite] = useState(false)
  const [isCancellingInvite, setIsCancellingInvite] = useState(false)
  const [adminActionStatus, setAdminActionStatus] = useState('')

  const inviteCode = data?.company?.inviteCode || ''
  const isAdmin = (data?.participant?.role || '').toString().trim().toLowerCase() === 'admin'
  const stage = workflowState?.stage || 'assessment'
  const userId = data?.participant?.userId || ''

  const resendStatusCopy = useMemo(() => {
    return {
      sending: ui?.sending || 'Sending…',
      sent: ui?.sent || 'Sent',
      failed: ui?.failed || 'Failed',
    }
  }, [ui])

  useEffect(() => {
    if (stage !== 'closed') {
      setAdminActionStatus('')
    }
  }, [stage])

  const domainKeys = useMemo(() => {
    const domains = domainContent?.domains || {}
    return Object.entries(domains)
      .map(([key, value]) => ({ key, order: value?.order || 0 }))
      .sort((a, b) => a.order - b.order)
      .map((x) => x.key)
  }, [domainContent])

  const onStartReview = useCallback(async () => {
    if (!isAdmin) {
      return
    }
    await runWorkflowAction({ action: 'startReview', payload: { domains: domainKeys } })
    navigate('/review')
  }, [domainKeys, isAdmin, navigate, runWorkflowAction])

  const onStartFinalize = useCallback(async () => {
    if (!isAdmin) {
      return
    }
    await runWorkflowAction({ action: 'startFinalize', payload: { domains: domainKeys } })
    navigate('/final')
  }, [domainKeys, isAdmin, navigate, runWorkflowAction])

  const onCloseFinalize = useCallback(async () => {
    if (!isAdmin) {
      return
    }
    await runWorkflowAction({ action: 'closeFinalize' })
  }, [isAdmin, runWorkflowAction])

  const onResendClosedEmail = useCallback(async () => {
    if (!isAdmin) {
      return
    }
    setAdminActionStatus(resendStatusCopy.sending)
    try {
      const res = await runWorkflowAction({ action: 'resendClosedEmail' })
      const sentCount = Number(res?.sentCount || 0)
      setAdminActionStatus(resendStatusCopy.sent + (sentCount ? ` (${sentCount})` : ''))
    } catch (err) {
      setAdminActionStatus(resendStatusCopy.failed + `: ${err?.message || String(err)}`)
      throw err
    }
  }, [isAdmin, resendStatusCopy, runWorkflowAction])

  const readiness = useMemo(() => {
    const inviteList = Array.isArray(invites) ? invites : []
    const participantList = Array.isArray(participants) ? participants : []
    const responses = Array.isArray(companyResponses) ? companyResponses : []

    const hasPendingInvites = inviteList.some((i) => {
      const status = (i?.status || '').toString().toLowerCase()
      return status === 'pending'
    })

    const responseByUserId = new Map(responses.map((r) => [r?.userId, r]))

    function isDomainComplete(sel) {
      if (!sel) {
        return false
      }
      if (Array.isArray(sel?.options)) {
        return sel.options.length > 0
      }
      return sel?.option != null
    }

    const incompleteUsers = participantList
      .map((p) => p?.userId)
      .filter(Boolean)
      .filter((uid) => {
        const r = responseByUserId.get(uid)
        if (!r) {
          return true
        }
        const domains = r?.domains || {}
        return domainKeys.some((dk) => !isDomainComplete(domains?.[dk]))
      })

    const allAssessmentsComplete = participantList.length > 0 && incompleteUsers.length === 0

    const selections = blueprint?.selections || {}
    const incompleteDomains = domainKeys.filter((dk) => selections?.[dk] == null)
    const blueprintComplete = domainKeys.length > 0 && incompleteDomains.length === 0

    const acceptanceList = Array.isArray(acceptance) ? acceptance : []
    const statusByUser = new Map(acceptanceList.map((a) => [a?.userId, a?.status]))
    const notAcceptedUsers = participantList
      .map((p) => p?.userId)
      .filter(Boolean)
      .filter((uid) => statusByUser.get(uid) !== 'accepted')

    const allAccepted = participantList.length > 0 && notAcceptedUsers.length === 0

    const myResponse = responseByUserId.get(userId) || null
    const myAssessmentComplete = Boolean(userId && myResponse && domainKeys.every((dk) => isDomainComplete(myResponse?.domains?.[dk])))
    const myAcceptanceStatus = statusByUser.get(userId) || 'pending'

    return {
      hasPendingInvites,
      allAssessmentsComplete,
      incompleteUsers,
      blueprintComplete,
      incompleteDomains,
      allAccepted,
      notAcceptedUsers,
      myAssessmentComplete,
      myAcceptanceStatus,
    }
  }, [acceptance, blueprint, companyResponses, domainKeys, invites, participants, userId])

  const adminPrimary = useMemo(() => {
    if (!isAdmin) {
      return null
    }
    if (stage === 'assessment') {
      if (!readiness.myAssessmentComplete) {
        return {
          label: ui?.startAssessment || 'Start / Continue assessment',
          help: ui?.participantContinueAssessmentHelp || 'Complete all 8 domains.',
          to: '/assess',
          disabled: false,
          reasons: [],
        }
      }
      const disabled = isRunningWorkflowAction || readiness.hasPendingInvites || !readiness.allAssessmentsComplete
      const reasons = []
      if (readiness.hasPendingInvites) {
        reasons.push(ui?.adminBlockedInvites || 'Pending invites must be accepted or cancelled')
      }
      if (!readiness.allAssessmentsComplete) {
        reasons.push(ui?.adminBlockedAssessments || 'All participants must complete assessments')
      }
      return {
        label: ui?.adminStartReview || 'Start review (lock assessments)',
        help: ui?.adminStartReviewHelp || 'Locks assessment and moves to blueprint selection.',
        onClick: onStartReview,
        disabled,
        reasons,
      }
    }
    if (stage === 'review') {
      if (!readiness.blueprintComplete) {
        const remaining = readiness.incompleteDomains.length
        return {
          label: ui?.reviewSummary || 'Open review',
          help: (ui?.adminBlockedBlueprint || 'Select 1 option per domain to continue') + ` (${domainKeys.length - remaining}/${domainKeys.length})`,
          to: '/review',
          disabled: false,
          reasons: [],
        }
      }
      const disabled = isRunningWorkflowAction
      return {
        label: ui?.adminStartFinalize || 'Publish blueprint (start acceptance)',
        help: ui?.adminStartFinalizeHelp || 'Publishes final blueprint and asks partners to accept or reject.',
        onClick: onStartFinalize,
        disabled,
        reasons: [],
      }
    }
    if (stage === 'finalize') {
      const disabled = isRunningWorkflowAction || !readiness.allAccepted
      const reasons = []
      if (!readiness.allAccepted) {
        reasons.push(ui?.adminBlockedAcceptance || 'Waiting for all partners to accept the blueprint')
      }
      return {
        label: ui?.adminCloseMapping || 'Close mapping (send confirmation email)',
        help: ui?.adminCloseMappingHelp || 'Locks the mapping and sends the final confirmation email to all partners.',
        onClick: onCloseFinalize,
        disabled,
        reasons,
      }
    }
    if (stage === 'closed') {
      const disabled = isRunningWorkflowAction
      return {
        label: disabled ? resendStatusCopy.sending : (ui?.adminResendClosedEmail || 'Re-send confirmation email'),
        help: ui?.adminResendClosedEmailHelp || 'Re-sends the closed mapping email to all partners.',
        onClick: onResendClosedEmail,
        disabled,
        reasons: [],
      }
    }
    return null
  }, [domainKeys.length, isAdmin, isRunningWorkflowAction, onCloseFinalize, onResendClosedEmail, onStartFinalize, onStartReview, readiness, resendStatusCopy, stage, ui])

  const participantPrimary = useMemo(() => {
    if (isAdmin) {
      return null
    }
    if (stage === 'assessment') {
      if (readiness.myAssessmentComplete) {
        return {
          label: ui?.participantDoneWaiting || 'You are done — waiting for others',
          help: ui?.participantDoneWaitingHelp || 'The admin will start the review once everyone is ready.',
          to: null,
          disabled: true,
        }
      }
      return {
        label: ui?.participantContinueAssessment || 'Continue assessment',
        help: ui?.participantContinueAssessmentHelp || 'Complete all 8 domains.',
        to: '/assess',
        disabled: false,
      }
    }
    if (stage === 'review') {
      return {
        label: ui?.participantReviewInProgress || 'Review in progress',
        help: ui?.participantReviewInProgressHelp || 'The admin is selecting the final blueprint.',
        to: '/review',
        disabled: false,
      }
    }
    if (stage === 'finalize') {
      return {
        label: ui?.participantFinalizeCta || 'Review and accept/reject blueprint',
        help: ui?.participantFinalizeHelp || 'You can change your decision until the mapping is closed.',
        to: '/final',
        disabled: false,
      }
    }
    return {
      label: ui?.participantViewClosed || 'View final blueprint',
      help: ui?.participantViewClosedHelp || 'The mapping is closed.',
      to: '/final',
      disabled: false,
    }
  }, [isAdmin, readiness.myAssessmentComplete, stage, ui])

  async function onStartFromScratch() {
    if (!isAdmin) {
      return
    }
    const confirm = window.prompt('Are you sure? All data will be lost. Write DELETE to start over')
    if (!confirm) {
      return
    }
    await runWorkflowAction({ action: 'startFromScratch', payload: { confirm } })
  }

  function normalizeEmailForInvite(email) {
    const trimmed = (email || '').toString().trim().toLowerCase()
    const atIdx = trimmed.indexOf('@')
    if (atIdx < 0) {
      return trimmed
    }
    let local = trimmed.slice(0, atIdx)
    const domain = trimmed.slice(atIdx + 1)
    if (domain === 'gmail.com' || domain === 'googlemail.com') {
      const plusIdx = local.indexOf('+')
      if (plusIdx >= 0) {
        local = local.slice(0, plusIdx)
      }
      local = local.replace(/\./g, '')
      return `${local}@gmail.com`
    }
    return trimmed
  }
  const inviteRows = useMemo(() => {
    const inviteList = Array.isArray(invites) ? invites : []
    const participantList = Array.isArray(participants) ? participants : []
    const responseList = Array.isArray(companyResponses) ? companyResponses : []
    const approvalList = Array.isArray(approvals) ? approvals : []
    const acceptanceList = Array.isArray(acceptance) ? acceptance : []
    const acceptanceByUserId = new Map(acceptanceList.map((a) => [a?.userId, (a?.status || '').toString().trim().toLowerCase()]))

    const byEmailLower = new Map()
    inviteList.forEach((i) => {
      const raw = (i?.emailLower || i?.email || '').toString().trim().toLowerCase()
      const emailKey = normalizeEmailForInvite(i?.inviteKey || raw)
      const inviteStatus = (i?.status || '').toString().trim().toLowerCase()
      if (!emailKey) {
        return
      }
      byEmailLower.set(emailKey, {
        email: i.email || emailKey,
        emailLower: emailKey,
        invitedAt: i.sentAt || null,
        inviteDocStatus: inviteStatus,
        participantUserId: '',
        status: 'Pending accept',
      })
    })

    const participantByEmailLower = new Map()
    participantList.forEach((p) => {
      const emailKey = normalizeEmailForInvite(p?.email)
      if (!emailKey) {
        return
      }
      participantByEmailLower.set(emailKey, p)
      if (!byEmailLower.has(emailKey)) {
        byEmailLower.set(emailKey, {
          email: p.email,
          emailLower: emailKey,
          invitedAt: p.invitedAt || null,
          participantUserId: p.userId,
          status: 'Accepted',
        })
      }
    })

    const hasResponse = new Set(responseList.map((r) => r?.userId).filter(Boolean))
    const approvedSet = new Set(
      approvalList
        .filter((a) => a?.approved)
        .map((a) => a?.userId)
        .filter(Boolean),
    )

    Array.from(byEmailLower.values()).forEach((row) => {
      const p = participantByEmailLower.get(row.emailLower)
      if (!p) {
        row.status = 'Pending accept'
        return
      }

      row.participantUserId = p.userId

      if ((row.inviteDocStatus || '') === 'pending') {
        row.status = 'Pending accept'
        return
      }

      if (stage === 'finalize' || stage === 'closed') {
        const a = acceptanceByUserId.get(p.userId) || 'pending'
        if (a === 'accepted') {
          row.status = 'Accepted'
          return
        }
        if (a === 'rejected') {
          row.status = 'Rejected'
          return
        }
        row.status = 'Pending decision'
        return
      }

      if (approvedSet.has(p.userId)) {
        row.status = 'Approved'
        return
      }
      if (hasResponse.has(p.userId)) {
        row.status = 'Responded'
        return
      }
      row.status = 'Accepted'
    })

    const order =
      stage === 'finalize' || stage === 'closed'
        ? { 'Pending accept': 1, 'Pending decision': 2, Accepted: 3, Rejected: 4 }
        : { 'Pending accept': 1, Accepted: 2, Responded: 3, Approved: 4 }
    return Array.from(byEmailLower.values()).sort((a, b) => {
      const aOrder = order[a.status] || 99
      const bOrder = order[b.status] || 99
      if (aOrder !== bOrder) {
        return aOrder - bOrder
      }
      return a.emailLower.localeCompare(b.emailLower)
    })
  }, [acceptance, approvals, companyResponses, invites, participants, stage])

  const inviteMismatches = useMemo(() => {
    if (!isAdmin) {
      return []
    }
    return (inviteRows || []).filter((row) => row.participantUserId && (row.inviteDocStatus || '') === 'pending')
  }, [inviteRows, isAdmin])

  const onReconcileInvites = useCallback(async () => {
    if (!isAdmin) {
      return
    }
    await runWorkflowAction({ action: 'reconcileInvites' })
  }, [isAdmin, runWorkflowAction])

  async function onCancelInvite(row) {
    if (!isAdmin) {
      return
    }
    if (!firebaseFunctions) {
      return
    }
    if (!inviteCode) {
      return
    }
    setInviteError('')
    setInviteStatus('')
    setIsCancellingInvite(true)
    try {
      const cancelInvite = httpsCallable(firebaseFunctions, 'cancelInvite')
      await cancelInvite({ inviteCode, email: row.email })
      setInviteStatus('Invite cancelled.')
      await queryClient.invalidateQueries({ queryKey: ['invites', data?.companyId || ''] })
    } catch (err) {
      setInviteError(err?.message || 'Failed to cancel invite')
    } finally {
      setIsCancellingInvite(false)
    }
  }
  const inviteLink = useMemo(() => {
    if (typeof window === 'undefined') {
      return ''
    }
    if (!inviteCode) {
      return ''
    }
    return `${window.location.origin}/register/${inviteCode}`
  }, [inviteCode])

  async function onSignOut() {
    if (!firebaseAuth) {
      return
    }
    await signOut(firebaseAuth)
  }

  async function onCopyInviteLink() {
    setInviteError('')
    setInviteStatus('')
    if (!inviteLink) {
      setInviteError('Invite link is not available yet.')
      return
    }
    try {
      await navigator.clipboard.writeText(inviteLink)
      setInviteStatus('Invite link copied.')
    } catch {
      setInviteError('Failed to copy invite link.')
    }
  }

  async function onSendInviteEmail(e) {
    e.preventDefault()
    setInviteError('')
    setInviteStatus('')
    setIsSendingInvite(true)

    try {
      if (!firebaseFunctions) {
        throw new Error('Firebase is not configured')
      }
      if (!inviteCode) {
        throw new Error('Invite code is not available')
      }
      const sendInviteEmail = httpsCallable(firebaseFunctions, 'sendInviteEmail')
      await sendInviteEmail({ inviteCode, email: inviteEmail.trim() })
      setInviteStatus('Invite email sent.')
      setInviteEmail('')
    } catch (err) {
      setInviteError(err?.message || 'Failed to send invite')
    } finally {
      setIsSendingInvite(false)
    }
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>{ui?.dashboardTitle || 'Dashboard'}</h1>

      {isLoading ? <div className={styles.note}>{ui?.loading || 'Loading…'}</div> : null}
      {error ? <div className={styles.error}>{error?.message || ui?.failedToLoadCompany || 'Failed to load company context'}</div> : null}

      {data?.company ? (
        <div className={styles.card}>
          <div className={styles.row}>
            <div className={styles.label}>{ui?.companyLabel || 'Company'}</div>
            <div className={styles.value}>{data.company?.name || data.companyId}</div>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>{ui?.inviteCodeLabel || 'Invite code'}</div>
            <div className={styles.valueMono}>{data.company?.inviteCode || '—'}</div>
          </div>
          <div className={styles.row}>
            <div className={styles.label}>{ui?.yourRoleLabel || 'Your role'}</div>
            <div className={styles.value}>{data.participant?.role || '—'}</div>
          </div>
        </div>
      ) : null}

      <div className={styles.stageBanner}>
        <div className={styles.stageLeft}>
          <div className={styles.stageLabel}>{ui?.stageLabel || 'Stage'}</div>
          <div className={styles.stageValue}>{ui?.[`stage_${stage}`] || stage}</div>
          <div className={styles.stageHelp}>
            {stage === 'assessment' ? (ui?.stageHelpAssessment || 'Complete assessments and resolve invites before review can start.') : null}
            {stage === 'review' ? (ui?.stageHelpReview || 'Review votes and select a final blueprint option per domain.') : null}
            {stage === 'finalize' ? (ui?.stageHelpFinalize || 'Partners accept or reject the blueprint. Admin can close when everyone accepted.') : null}
            {stage === 'closed' ? (ui?.stageHelpClosed || 'Mapping is closed and read-only.') : null}
          </div>
        </div>

        <div className={styles.stageMiddle}>
          <div className={styles.checklistTitle}>{ui?.readinessTitle || 'Readiness'}</div>
          <div className={styles.checklist}>
            <div className={readiness.hasPendingInvites ? styles.checkItemBad : styles.checkItemGood}>
              {readiness.hasPendingInvites ? '!' : '✓'} {ui?.readinessInvites || 'Invites resolved'}
            </div>
            <div className={!readiness.allAssessmentsComplete ? styles.checkItemBad : styles.checkItemGood}>
              {!readiness.allAssessmentsComplete ? '!' : '✓'} {ui?.readinessAssessments || 'All assessments complete'}
            </div>
            <div className={!readiness.blueprintComplete ? styles.checkItemBad : styles.checkItemGood}>
              {!readiness.blueprintComplete ? '!' : '✓'} {ui?.readinessBlueprint || 'Blueprint selected (8/8)'}
            </div>
            <div className={!readiness.allAccepted ? styles.checkItemBad : styles.checkItemGood}>
              {!readiness.allAccepted ? '!' : '✓'} {ui?.readinessAcceptance || 'All partners accepted'}
            </div>
          </div>
        </div>

        <div className={styles.stageRight}>
          {adminPrimary ? (
            <div className={styles.ctaCard}>
              <div className={styles.ctaTitle}>{ui?.adminControlsTitle || 'Admin: Stage controls'}</div>
              <div className={styles.ctaHelp}>{adminPrimary.help}</div>
              {adminPrimary.to ? (
                <Link
                  className={adminPrimary.disabled ? styles.secondaryButton : styles.primaryButton}
                  to={adminPrimary.to}
                  aria-disabled={adminPrimary.disabled ? 'true' : 'false'}
                  onClick={(e) => {
                    if (adminPrimary.disabled) {
                      e.preventDefault()
                    }
                  }}
                >
                  {adminPrimary.label}
                </Link>
              ) : (
                <button className={styles.primaryButton} type="button" onClick={adminPrimary.onClick} disabled={adminPrimary.disabled}>
                  {adminPrimary.label}
                </button>
              )}
              {adminPrimary.disabled && adminPrimary.reasons?.length ? (
                <div className={styles.blockedReasons}>
                  <div className={styles.blockedTitle}>{ui?.blockedTitle || 'Blocked because:'}</div>
                  {adminPrimary.reasons.map((r) => (
                    <div key={r} className={styles.blockedItem}>
                      - {r}
                    </div>
                  ))}
                </div>
              ) : null}

              {adminActionStatus ? <div className={styles.ctaNotice}>{adminActionStatus}</div> : null}

              <div className={styles.dangerZone}>
                <div className={styles.dangerTitle}>{ui?.dangerZoneTitle || 'Danger zone'}</div>
                <button className={styles.secondaryButton} type="button" onClick={onStartFromScratch} disabled={isRunningWorkflowAction}>
                  {ui?.adminStartOver || 'Delete mapping data (start over)'}
                </button>
              </div>
            </div>
          ) : participantPrimary ? (
            <div className={styles.ctaCard}>
              <div className={styles.ctaTitle}>{ui?.yourNextStepTitle || 'Your next step'}</div>
              <div className={styles.ctaHelp}>{participantPrimary.help}</div>
              {participantPrimary.to ? (
                <Link
                  className={participantPrimary.disabled ? styles.secondaryButton : styles.primaryButton}
                  to={participantPrimary.to}
                  aria-disabled={participantPrimary.disabled ? 'true' : 'false'}
                  onClick={(e) => {
                    if (participantPrimary.disabled) {
                      e.preventDefault()
                    }
                  }}
                >
                  {participantPrimary.label}
                </Link>
              ) : (
                <button className={styles.secondaryButton} type="button" disabled>
                  {participantPrimary.label}
                </button>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {inviteCode ? (
        <div className={styles.inviteCard}>
          <div className={styles.inviteTitle}>{isAdmin ? (ui?.inviteTeammatesTitle || 'Invite teammates') : (ui?.participantsTitle || 'Participants')}</div>

          {isAdmin ? (
            <>
              {stage !== 'assessment' ? (
                <div className={styles.note}>{ui?.invitesLocked || 'Invites are locked once review begins.'}</div>
              ) : (
                <>
                  <div className={styles.inviteRow}>
                    <div className={styles.inviteLink}>{inviteLink || inviteCode}</div>
                    <button className={styles.secondaryButton} type="button" onClick={onCopyInviteLink}>
                      {ui?.copyInviteLink || 'Copy invite link'}
                    </button>
                  </div>

                  <form className={styles.inviteForm} onSubmit={onSendInviteEmail}>
                    <label className={styles.inviteLabel}>
                      {ui?.emailLabel || 'Email'}
                      <input
                        className={styles.inviteInput}
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        autoComplete="email"
                        required
                      />
                    </label>
                    <button className={styles.primaryButton} type="submit" disabled={isSendingInvite}>
                      {isSendingInvite ? (ui?.sending || 'Sending…') : (ui?.sendInvite || 'Send invite')}
                    </button>
                  </form>
                </>
              )}

              {inviteStatus ? <div className={styles.note}>{inviteStatus}</div> : null}
              {inviteError ? <div className={styles.error}>{inviteError}</div> : null}

              {inviteMismatches.length ? (
                <div className={styles.note}>
                  {ui?.inviteMismatchNote || 'Some invite records are still pending even though the participant has already joined. You can reconcile them.'}
                  <div className={styles.actions}>
                    <button
                      className={styles.secondaryButton}
                      type="button"
                      onClick={onReconcileInvites}
                      disabled={isRunningWorkflowAction}
                    >
                      {ui?.reconcileInvites || 'Reconcile invites'}
                    </button>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}

          {inviteRows.length ? (
            <div className={styles.inviteList}>
              <div className={styles.inviteListHeader}>
                <div className={styles.inviteListColEmail}>{ui?.participantsEmailHeader || 'Email'}</div>
                <div className={styles.inviteListColStatus}>{ui?.participantsStatusHeader || 'Status'}</div>
              </div>
              {inviteRows
                .filter((row) => (isAdmin ? true : row.participantUserId))
                .map((row) => (
                  <div key={row.emailLower} className={styles.inviteListRow}>
                    <div className={styles.inviteListColEmail}>{row.email}</div>
                    <div className={styles.inviteListColStatus}>
                      {row.status}
                      {isAdmin && row.status === 'Pending accept' ? (
                        <button
                          className={styles.cancelInviteButton}
                          type="button"
                          onClick={() => onCancelInvite(row)}
                          disabled={isCancellingInvite}
                        >
                          {ui?.cancelInvite || 'Cancel'}
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
            </div>
          ) : null}
        </div>
      ) : null}

      <button className={styles.linkButton} type="button" onClick={onSignOut}>
        {ui?.signOut || 'Sign out'}
      </button>
    </div>
  )
}

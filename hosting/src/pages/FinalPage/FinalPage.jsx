import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useUiStrings } from '../../content/use-ui-strings.js'
import { useComments, useCreateComment, useDeleteComment } from '../../data/use-comments.js'
import { useParticipants } from '../../data/use-participants-query.js'
import { useUserCompanyContext } from '../../data/use-user-company-context.js'
import { useWorkflowActions } from '../../data/use-workflow-actions.js'
import { useAcceptance, useWorkflowState } from '../../data/use-workflow.js'
import styles from './FinalPage.module.scss'

export default function FinalPage() {
  const navigate = useNavigate()
  const ui = useUiStrings()
  const { data: companyCtx, isLoading: isLoadingCompany, error: companyError } = useUserCompanyContext()
  const { data: participants, isLoading: isLoadingParticipants, error: participantsError } = useParticipants()
  const { data: workflowState, isLoading: isLoadingWorkflow } = useWorkflowState()
  const { data: acceptance, isLoading: isLoadingAcceptance, error: acceptanceError } = useAcceptance()
  const { data: comments, isLoading: isLoadingComments, error: commentsError } = useComments()
  const { mutateAsync: createComment, isPending: isCreatingComment, error: createCommentError } = useCreateComment()
  const { mutateAsync: deleteComment, isPending: isDeletingComment, error: deleteCommentError } = useDeleteComment()
  const { mutateAsync: runWorkflowAction, isPending: isRunningWorkflowAction, error: workflowActionError } = useWorkflowActions()

  const stage = workflowState?.stage || 'assessment'
  const isAdmin = companyCtx?.participant?.role === 'admin'
  const userId = companyCtx?.participant?.userId || ''

  const [commentText, setCommentText] = useState('')
  const [confirmError, setConfirmError] = useState('')

  useEffect(() => {
    if (isLoadingWorkflow) {
      return
    }
    if (stage === 'finalize' || stage === 'closed') {
      return
    }
    if (stage === 'review') {
      navigate('/review', { replace: true })
      return
    }
    navigate('/assess', { replace: true })
  }, [isLoadingWorkflow, navigate, stage])

  const statusByUserId = useMemo(() => {
    const map = new Map()
    ;(acceptance || []).forEach((a) => {
      map.set(a.userId, a)
    })
    return map
  }, [acceptance])

  const isReadyToClose = useMemo(() => {
    const list = participants || []
    if (!list.length) {
      return false
    }
    return list.every((p) => (statusByUserId.get(p.userId)?.status || 'pending') === 'accepted')
  }, [participants, statusByUserId])

  async function onSetStatus(status) {
    setConfirmError('')
    await runWorkflowAction({ action: 'setAcceptance', payload: { status } })
  }

  async function onCloseFinalize() {
    if (!isAdmin) {
      return
    }
    setConfirmError('')
    await runWorkflowAction({ action: 'closeFinalize' })
  }

  async function onStartFromScratch() {
    if (!isAdmin) {
      return
    }
    const confirm = window.prompt('Are you sure? All data will be lost. Write DELETE to start over')
    if (!confirm) {
      return
    }
    setConfirmError('')
    try {
      await runWorkflowAction({ action: 'startFromScratch', payload: { confirm } })
      navigate('/assess', { replace: true })
    } catch (err) {
      setConfirmError(err?.message || 'Failed to start from scratch')
    }
  }

  async function onSubmitComment(e) {
    e.preventDefault()
    const text = commentText.trim()
    if (!text) {
      return
    }
    await createComment({ domain: 'final', text })
    setCommentText('')
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>{ui?.finalTitle || 'Final'}</h1>
      <p className={styles.note}>{ui?.finalNote || 'Accept or reject the blueprint, and add any final comments.'}</p>

      {isLoadingCompany || isLoadingParticipants || isLoadingAcceptance || isLoadingWorkflow ? (
        <div className={styles.note}>Loading…</div>
      ) : null}
      {companyError ? <div className={styles.error}>{companyError?.message || 'Failed to load company context'}</div> : null}
      {participantsError ? <div className={styles.error}>{participantsError?.message || 'Failed to load participants'}</div> : null}
      {acceptanceError ? <div className={styles.error}>{acceptanceError?.message || 'Failed to load status'}</div> : null}
      {commentsError ? <div className={styles.error}>{commentsError?.message || 'Failed to load comments'}</div> : null}
      {createCommentError ? <div className={styles.error}>{createCommentError?.message || 'Failed to add comment'}</div> : null}
      {deleteCommentError ? <div className={styles.error}>{deleteCommentError?.message || 'Failed to delete comment'}</div> : null}
      {workflowActionError ? <div className={styles.error}>{workflowActionError?.message || 'Action failed'}</div> : null}
      {confirmError ? <div className={styles.error}>{confirmError}</div> : null}

      <div className={styles.approvalsCard}>
        <div className={styles.approvalsTitle}>Your decision</div>
        <div className={styles.approvalsNote}>Choose one status. All partners must accept before the mapping can be closed.</div>

        <div className={styles.statusActions}>
          <button
            className={styles.primaryButton}
            type="button"
            onClick={() => onSetStatus('accepted')}
            disabled={isRunningWorkflowAction || stage !== 'finalize'}
          >
            Accept
          </button>
          <button
            className={styles.secondaryButton}
            type="button"
            onClick={() => onSetStatus('rejected')}
            disabled={isRunningWorkflowAction || stage !== 'finalize'}
          >
            Reject
          </button>
        </div>

        <div className={styles.approvalsList}>
          {(participants || []).map((p) => {
            const s = statusByUserId.get(p.userId)?.status || 'pending'
            return (
              <div key={p.userId} className={styles.approvalRow}>
                <div className={styles.approvalName}>{p.name || p.email || p.userId}</div>
                <div className={s === 'accepted' ? styles.approved : (s === 'rejected' ? styles.rejected : styles.notApproved)}>
                  {s === 'accepted' ? 'Accepted' : (s === 'rejected' ? 'Rejected' : 'Pending')}
                </div>
              </div>
            )
          })}
        </div>

        {isAdmin ? (
          <div className={styles.adminActions}>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={onCloseFinalize}
              disabled={isRunningWorkflowAction || stage !== 'finalize' || !isReadyToClose}
            >
              Close Finalize (send email)
            </button>
            <button
              className={styles.secondaryButton}
              type="button"
              onClick={onStartFromScratch}
              disabled={isRunningWorkflowAction}
            >
              Start from Scratch
            </button>
          </div>
        ) : null}
      </div>

      <div className={styles.approvalsCard}>
        <div className={styles.approvalsTitle}>Comments</div>
        <div className={styles.approvalsNote}>Comments show the partner name. In Finalize you can delete your own comments.</div>

        <form className={styles.commentForm} onSubmit={onSubmitComment}>
          <textarea
            className={styles.textarea}
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Add a comment (max 500 chars)"
            rows={3}
          />
          <button className={styles.secondaryButton} type="submit" disabled={isCreatingComment || stage !== 'finalize'}>
            {isCreatingComment ? 'Posting…' : 'Post comment'}
          </button>
        </form>

        <div className={styles.commentList}>
          {(comments || []).filter((c) => c.domain === 'final').map((c) => (
            <div key={c.id} className={styles.commentItem}>
              <div className={styles.commentMeta}>
                {c.userName}
                {stage === 'finalize' && c.userId === userId ? (
                  <button
                    className={styles.deleteButton}
                    type="button"
                    onClick={() => deleteComment({ commentId: c.id })}
                    disabled={isDeletingComment}
                  >
                    Delete
                  </button>
                ) : null}
              </div>
              <div className={styles.commentText}>{c.text}</div>
            </div>
          ))}
        </div>

        {isLoadingComments ? <div className={styles.note}>Loading comments…</div> : null}
      </div>
    </div>
  )
}

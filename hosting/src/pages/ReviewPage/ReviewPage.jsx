import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useDomainContent } from '../../content/use-domain-content.js'
import { useUiStrings } from '../../content/use-ui-strings.js'
import { useCompanyResponses } from '../../data/use-company-responses-query.js'
import { useCommentsRealtime, useCreateComment, useDeleteComment } from '../../data/use-comments.js'
import { useParticipants } from '../../data/use-participants-query.js'
import { useUserCompanyContext } from '../../data/use-user-company-context.js'
import { useWorkflowActions } from '../../data/use-workflow-actions.js'
import { useBlueprintRealtime, useWorkflowState } from '../../data/use-workflow.js'
import ReviewProgressWheel from '../../components/ReviewProgressWheel/ReviewProgressWheel.jsx'
import styles from './ReviewPage.module.scss'

function getInitials(nameOrEmail) {
  const s = (nameOrEmail || '').toString().trim()
  if (!s) {
    return '?'
  }
  const parts = s.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  if (s.includes('@')) {
    return s[0].toUpperCase()
  }
  return s.slice(0, 2).toUpperCase()
}

export default function ReviewPage() {
  const navigate = useNavigate()
  const content = useDomainContent()
  const ui = useUiStrings()
  const { data: companyCtx } = useUserCompanyContext()
  const { data: workflowState, isLoading: isLoadingWorkflow } = useWorkflowState()
  const { data: blueprint, isLoading: isLoadingBlueprint, error: blueprintError } = useBlueprintRealtime()
  const { mutateAsync: runWorkflowAction, isPending: isRunningWorkflowAction, error: workflowActionError } = useWorkflowActions()
  const { data: companyResponses, isLoading: isLoadingCompany, error: companyError } = useCompanyResponses()
  const { data: participants, isLoading: isLoadingParticipants, error: participantsError } = useParticipants()
  const { data: comments, isLoading: isLoadingComments, error: commentsError } = useCommentsRealtime()
  const { mutateAsync: createComment, isPending: isCreatingComment, error: createCommentError } = useCreateComment()
  const { mutateAsync: deleteComment, isPending: isDeletingComment, error: deleteCommentError } = useDeleteComment()

  const [commentText, setCommentText] = useState('')
  const [isSavingSelection, setIsSavingSelection] = useState(false)
  const [hoverKey, setHoverKey] = useState(null)

  const stage = workflowState?.stage || 'assessment'
  const isAdmin = companyCtx?.participant?.role === 'admin'
  const userId = companyCtx?.participant?.userId || ''

  useEffect(() => {
    if (isLoadingWorkflow) {
      return
    }
    if (stage !== 'review') {
      if (stage === 'assessment') {
        navigate('/assess', { replace: true })
        return
      }
      navigate('/final', { replace: true })
    }
  }, [isLoadingWorkflow, navigate, stage])

  const domainKeys = useMemo(() => {
    const domains = content?.domains || {}
    return Object.entries(domains)
      .map(([key, domain]) => ({ key, order: domain?.order || 0 }))
      .sort((a, b) => a.order - b.order)
      .map((x) => x.key)
  }, [content])

  const selections = useMemo(() => blueprint?.selections || {}, [blueprint])
  const completedDomainKeys = useMemo(() => {
    return domainKeys.filter((dk) => selections?.[dk] != null)
  }, [domainKeys, selections])

  const isReadyToFinalize = useMemo(() => {
    return domainKeys.length > 0 && domainKeys.every((dk) => selections?.[dk] != null)
  }, [domainKeys, selections])

  const votesByDomain = useMemo(() => {
    const domains = content?.domains || {}
    const responses = companyResponses || []

    function getResponseOptions(response, domainKey) {
      const sel = response?.domains?.[domainKey] || {}
      if (Array.isArray(sel?.options)) {
        return sel.options
      }
      if (sel?.option != null) {
        return [sel.option]
      }
      return []
    }

    const out = {}
    Object.keys(domains).forEach((domainKey) => {
      const counts = {}
      responses.forEach((r) => {
        const options = getResponseOptions(r, domainKey)
        options.forEach((o) => {
          const key = String(Number(o))
          counts[key] = (counts[key] || 0) + 1
        })
      })
      out[domainKey] = counts
    })
    return out
  }, [companyResponses, content])

  const participantsById = useMemo(() => {
    const map = new Map()
    ;(participants || []).forEach((p) => {
      if (p?.userId) {
        map.set(p.userId, p)
      }
    })
    return map
  }, [participants])

  const [selectedDomainKey, setSelectedDomainKey] = useState(domainKeys[0] || '')

  useEffect(() => {
    if (!selectedDomainKey && domainKeys.length) {
      setSelectedDomainKey(domainKeys[0])
    }
  }, [domainKeys, selectedDomainKey])

  const selectedIdx = useMemo(() => {
    return Math.max(0, domainKeys.indexOf(selectedDomainKey))
  }, [domainKeys, selectedDomainKey])

  const selectedDomain = useMemo(() => {
    const domains = content?.domains || {}
    const key = domainKeys[selectedIdx] || domainKeys[0] || ''
    const domain = domains?.[key] || {}
    return {
      key,
      name: domain?.name || key,
      solutions: domain?.solutions || [],
      description: domain?.description || '',
    }
  }, [content, domainKeys, selectedIdx])

  const votersByOption = useMemo(() => {
    const domainKey = selectedDomain?.key
    if (!domainKey) {
      return {}
    }

    function getResponseOptions(response) {
      const sel = response?.domains?.[domainKey] || {}
      if (Array.isArray(sel?.options)) {
        return sel.options
      }
      if (sel?.option != null) {
        return [sel.option]
      }
      return []
    }

    const out = {}
    ;(companyResponses || []).forEach((r) => {
      const uid = r?.userId
      if (!uid) {
        return
      }
      const p = participantsById.get(uid)
      const display = p?.name || p?.email || uid
      const voter = { userId: uid, name: display, initials: getInitials(display) }
      const options = getResponseOptions(r)
      options.forEach((o) => {
        const key = String(Number(o))
        if (!out[key]) {
          out[key] = []
        }
        out[key].push(voter)
      })
    })

    Object.keys(out).forEach((k) => {
      out[k] = out[k].slice().sort((a, b) => a.name.localeCompare(b.name))
    })
    return out
  }, [companyResponses, participantsById, selectedDomain])

  async function onSelectBlueprint(domainKey, option) {
    if (!isAdmin) {
      return
    }
    if (!domainKey) {
      return
    }
    setIsSavingSelection(true)
    try {
      await runWorkflowAction({ action: 'setBlueprintSelection', payload: { domainKey, option } })
    } finally {
      setIsSavingSelection(false)
    }
  }

  const selectedCounts = useMemo(() => {
    return votesByDomain?.[selectedDomain?.key] || {}
  }, [selectedDomain, votesByDomain])

  const selectedOption = selections?.[selectedDomain?.key]

  const canGoPrev = selectedIdx > 0
  const canGoNext = selectedIdx < domainKeys.length - 1

  const onPrev = useCallback(() => {
    if (!canGoPrev) {
      return
    }
    setSelectedDomainKey(domainKeys[selectedIdx - 1])
  }, [canGoPrev, domainKeys, selectedIdx])

  const onNext = useCallback(() => {
    if (!canGoNext) {
      return
    }
    setSelectedDomainKey(domainKeys[selectedIdx + 1])
  }, [canGoNext, domainKeys, selectedIdx])

  const onCloseReview = useCallback(() => {
    navigate('/dashboard')
  }, [navigate])

  const onFinalize = useCallback(async () => {
    if (!isAdmin) {
      return
    }
    await runWorkflowAction({ action: 'startFinalize', payload: { domains: domainKeys } })
    navigate('/dashboard')
  }, [domainKeys, isAdmin, navigate, runWorkflowAction])

  const domainComments = useMemo(() => {
    const list = comments || []
    return list.filter((c) => c.domain === selectedDomain?.key)
  }, [comments, selectedDomain])

  async function onSubmitComment(e) {
    e.preventDefault()
    if (!selectedDomain?.key) {
      return
    }
    const text = commentText.trim()
    if (!text) {
      return
    }
    await createComment({ domain: selectedDomain.key, text })
    setCommentText('')
  }

  const onDeleteComment = useCallback(async (commentId) => {
    if (!commentId) {
      return
    }
    await deleteComment({ commentId })
  }, [deleteComment])

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>{ui?.reviewTitle || 'Review'}</h1>

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.progressWheelRow}>
            <ReviewProgressWheel
              domainKeys={domainKeys}
              completedKeys={completedDomainKeys}
              currentKey={selectedDomainKey}
              onSelectKey={(key) => setSelectedDomainKey(key)}
              onHoverKey={setHoverKey}
            />
          </div>
          <div className={styles.sidebarTitle}>{ui?.domainsLabel || 'Domains'}</div>
          <div className={styles.domainList}>
            {domainKeys.map((dk) => {
              const domain = content?.domains?.[dk] || {}
              const isActive = dk === selectedDomainKey
              const isHover = dk && hoverKey && dk === hoverKey
              const isCompleted = completedDomainKeys.includes(dk)
              return (
                <button
                  key={dk}
                  type="button"
                  className={
                    isActive
                      ? styles.domainButtonActive
                      : isHover
                        ? styles.domainButtonHover
                        : isCompleted
                          ? styles.domainButtonCompleted
                          : styles.domainButton
                  }
                  onClick={() => setSelectedDomainKey(dk)}
                  onMouseOver={() => setHoverKey(dk)}
                  onMouseOut={() => setHoverKey(null)}
                >
                  {domain?.name || dk}
                </button>
              )
            })}
          </div>
        </aside>

        <section className={styles.content}>
          <div className={styles.domainHeader}>
            <div>
              <div className={styles.domainName}>{selectedDomain?.name}</div>
              <div className={styles.domainSub}>
                {ui?.reviewDomainProgressLabel || 'Domain'} {Math.min(domainKeys.length, selectedIdx + 1)}/{domainKeys.length}
              </div>
            </div>

            <div className={styles.controls}>
              <button className={styles.secondaryButton} type="button" onClick={onCloseReview}>
                {ui?.closeReview || 'Close review'}
              </button>
              <button className={styles.secondaryButton} type="button" onClick={onPrev} disabled={!canGoPrev}>
                {ui?.previousDomain || 'Previous'}
              </button>
              <button className={styles.secondaryButton} type="button" onClick={onNext} disabled={!canGoNext}>
                {ui?.nextDomain || 'Next'}
              </button>
              {isAdmin ? (
                <button
                  className={styles.primaryButton}
                  type="button"
                  onClick={onFinalize}
                  disabled={isRunningWorkflowAction || !isReadyToFinalize}
                  title={!isReadyToFinalize ? (ui?.finalizeBlocked || 'Select exactly one option in all 8 domains') : ''}
                >
                  {ui?.finalizeReview || 'Finalize'}
                </button>
              ) : null}
            </div>
          </div>

          {!isAdmin ? (
            <div className={styles.note}>{ui?.reviewAdminOnlyNote || 'Only the admin can make selections. You can view votes and add comments.'}</div>
          ) : null}

          {isLoadingBlueprint ? <div className={styles.note}>{ui?.loadingBlueprint || 'Loading blueprint…'}</div> : null}
          {blueprintError ? <div className={styles.error}>{blueprintError?.message || ui?.failedToLoadBlueprint || 'Failed to load blueprint'}</div> : null}
          {workflowActionError ? <div className={styles.error}>{workflowActionError?.message || ui?.failedToUpdateBlueprint || 'Failed to update blueprint'}</div> : null}

          {isLoadingCompany || isLoadingParticipants ? (
            <div className={styles.note}>{ui?.loadingCompanyView || 'Loading company view…'}</div>
          ) : null}
          {companyError ? (
            <div className={styles.error}>{companyError?.message || ui?.failedToLoadCompanyResponses || 'Failed to load company responses'}</div>
          ) : null}

          {participantsError ? (
            <div className={styles.error}>{participantsError?.message || ui?.failedToLoadParticipants || 'Failed to load participants'}</div>
          ) : null}

          <h2 className={styles.h2}>{ui?.reviewOptionsTitle || 'Options'}</h2>
          <div className={styles.blueprintOptions}>
            {(selectedDomain?.solutions || []).map((s) => {
              const optionNum = Number(s.option)
              const isSelected = selectedOption != null && Number(selectedOption) === optionNum
              const voteCount = selectedCounts?.[String(optionNum)] || 0
              const voters = votersByOption?.[String(optionNum)] || []
              const visibleVoters = voters.slice(0, 8)
              const remaining = voters.length - visibleVoters.length

              return (
                <button
                  key={String(s.option)}
                  type="button"
                  className={isSelected ? styles.optionCardActive : styles.optionCard}
                  onClick={() => onSelectBlueprint(selectedDomain.key, optionNum)}
                  disabled={!isAdmin || isSavingSelection || isRunningWorkflowAction}
                  title={!isAdmin ? (ui?.adminOnly || 'Admin only') : ''}
                >
                  <div className={styles.optionHeader}>
                    <div className={styles.optionName}>{s.name}</div>
                    <div className={styles.optionVotes}>
                      <div className={styles.voteBadges} aria-label={`${voteCount} votes`}>
                        {visibleVoters.map((v) => (
                          <div key={v.userId} className={styles.voteBadge} title={v.name}>
                            {v.initials}
                          </div>
                        ))}
                        {remaining > 0 ? (
                          <div className={styles.voteBadgeMore} title={`+${remaining}`}>
                            +{remaining}
                          </div>
                        ) : null}
                      </div>
                    </div>
                  </div>
                  <div className={styles.optionDescription}>{s.description}</div>
                </button>
              )
            })}
          </div>

          <h2 className={styles.h2}>{ui?.commentsTitle || 'Comments'}</h2>
          <div className={styles.commentPanel}>
            {isLoadingComments ? <div className={styles.note}>{ui?.loadingComments || 'Loading comments…'}</div> : null}
            {commentsError ? <div className={styles.error}>{commentsError?.message || ui?.failedToLoadComments || 'Failed to load comments'}</div> : null}
            {createCommentError ? <div className={styles.error}>{createCommentError?.message || ui?.failedToAddComment || 'Failed to add comment'}</div> : null}
            {deleteCommentError ? <div className={styles.error}>{deleteCommentError?.message || ui?.failedToDeleteComment || 'Failed to delete comment'}</div> : null}

            <form className={styles.commentForm} onSubmit={onSubmitComment}>
              <textarea
                className={styles.textarea}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder={ui?.commentPlaceholder || 'Add a comment (max 500 chars)'}
                rows={3}
              />
              <button className={styles.commentButton} type="submit" disabled={isCreatingComment}>
                {isCreatingComment ? (ui?.posting || 'Posting…') : (ui?.postComment || 'Post comment')}
              </button>
            </form>

            <div className={styles.commentList}>
              {domainComments.length ? domainComments.map((c) => (
                <div key={c.id} className={styles.commentItem}>
                  <div className={styles.commentMeta}>
                    {c.userName}
                    {c.userId === userId ? (
                      <button
                        className={styles.deleteCommentButton}
                        type="button"
                        onClick={() => onDeleteComment(c.id)}
                        disabled={isDeletingComment}
                      >
                        {ui?.deleteComment || 'Delete'}
                      </button>
                    ) : null}
                  </div>
                  <div className={styles.commentText}>{c.text}</div>
                </div>
              )) : <div className={styles.commentEmpty}>{ui?.noCommentsYet || 'No comments yet.'}</div>}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

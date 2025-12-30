import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { useDomainContent } from '../../content/use-domain-content.js'
import { useUiStrings } from '../../content/use-ui-strings.js'
import { useSaveUserResponses, useUserResponses } from '../../data/use-user-responses.js'
import { useWorkflowState } from '../../data/use-workflow.js'
import ReviewProgressWheel from '../../components/ReviewProgressWheel/ReviewProgressWheel.jsx'
import styles from './AssessPage.module.scss'

export default function AssessPage() {
  const navigate = useNavigate()
  const content = useDomainContent()
  const ui = useUiStrings()
  const { data: workflowState, isLoading: isLoadingWorkflow } = useWorkflowState()
  const { data: savedResponses, isLoading: isLoadingResponses, error: responsesError } = useUserResponses()
  const { mutateAsync: saveResponses, isPending: isSaving, error: saveError } = useSaveUserResponses()

  const stage = workflowState?.stage || 'assessment'

  useEffect(() => {
    if (isLoadingWorkflow) {
      return
    }
    if (stage !== 'assessment') {
      if (stage === 'review') {
        navigate('/review', { replace: true })
        return
      }
      navigate('/final', { replace: true })
    }
  }, [isLoadingWorkflow, navigate, stage])

  const domains = useMemo(() => {
    const entries = Object.entries(content?.domains || {})
    return entries
      .map(([key, value]) => ({ key, ...value }))
      .sort((a, b) => (a.order || 0) - (b.order || 0))
  }, [content])

  const domainKeys = useMemo(() => domains.map((d) => d.key).filter(Boolean), [domains])

  const [selectedKey, setSelectedKey] = useState(domains[0]?.key || '')
  const [hoverKey, setHoverKey] = useState(null)

  const [selections, setSelections] = useState(() => savedResponses?.domains || {})

  useEffect(() => {
    if (!selectedKey && domains[0]?.key) {
      setSelectedKey(domains[0].key)
    }
  }, [domains, selectedKey])

  useEffect(() => {
    if (savedResponses?.domains) {
      setSelections(savedResponses.domains)
    }
  }, [savedResponses])

  const selected = useMemo(() => {
    return domains.find((d) => d.key === selectedKey) || domains[0]
  }, [domains, selectedKey])

  const selectedOptions = useMemo(() => {
    const domainSelection = selections?.[selected?.key] || {}
    if (Array.isArray(domainSelection?.options)) {
      return domainSelection.options
    }
    if (domainSelection?.option != null) {
      return [domainSelection.option]
    }
    return []
  }, [selections, selected?.key])

  const hasSelection = selectedOptions.length > 0

  const selectedIdx = useMemo(() => {
    const idx = domains.findIndex((d) => d.key === selected?.key)
    return Math.max(0, idx)
  }, [domains, selected])

  const canGoPrev = selectedIdx > 0
  const canGoNext = selectedIdx >= 0 && selectedIdx < domains.length - 1

  const completedDomainKeys = useMemo(() => {
    function isDomainComplete(sel) {
      if (!sel) {
        return false
      }
      if (Array.isArray(sel?.options)) {
        return sel.options.length > 0
      }
      return sel?.option != null
    }

    return domainKeys.filter((dk) => isDomainComplete(selections?.[dk]))
  }, [domainKeys, selections])

  const isAssessmentComplete = useMemo(() => {
    return domainKeys.length > 0 && domainKeys.every((dk) => completedDomainKeys.includes(dk))
  }, [completedDomainKeys, domainKeys])

  async function onToggleOption(domainKey, option) {
    const prev = selections?.[domainKey] || {}
    const prevOptions = Array.isArray(prev?.options) ? prev.options : (prev?.option != null ? [prev.option] : [])
    const optionNumber = Number(option)
    const has = prevOptions.some((x) => Number(x) === optionNumber)
    const nextOptions = has ? prevOptions.filter((x) => Number(x) !== optionNumber) : [...prevOptions, optionNumber]

    const next = {
      ...(selections || {}),
      [domainKey]: {
        options: nextOptions,
      },
    }

    setSelections(next)
    await saveResponses({ domains: next })
  }

  function onCloseAssessment() {
    navigate('/dashboard')
  }

  function onPrev() {
    if (!canGoPrev) {
      return
    }
    const prev = domains[selectedIdx - 1]
    if (prev?.key) {
      setSelectedKey(prev.key)
    }
  }

  function onNext() {
    if (!canGoNext) {
      return
    }
    const next = domains[selectedIdx + 1]
    if (next?.key) {
      setSelectedKey(next.key)
    }
  }

  function onCompleteAssessment() {
    navigate('/dashboard')
  }

  return (
    <div className={styles.page}>
      <h1 className={styles.h1}>{ui?.assessmentTitle || 'Assessment'}</h1>
      <p className={styles.note}>{ui?.assessmentNote || 'Select a domain to review common solution patterns and trade-offs.'}</p>

      {isLoadingResponses ? <div className={styles.status}>{ui?.loadingSavedSelections || 'Loading saved selections…'}</div> : null}
      {responsesError ? <div className={styles.error}>{responsesError?.message || ui?.failedToLoadSavedSelections || 'Failed to load saved selections'}</div> : null}
      {saveError ? <div className={styles.error}>{saveError?.message || ui?.failedToSave || 'Failed to save'}</div> : null}
      {isSaving ? <div className={styles.status}>{ui?.saving || 'Saving…'}</div> : null}

      <div className={styles.layout}>
        <aside className={styles.sidebar}>
          <div className={styles.progressWheelRow}>
            <ReviewProgressWheel
              domainKeys={domainKeys}
              completedKeys={completedDomainKeys}
              currentKey={selectedKey}
              onSelectKey={(key) => setSelectedKey(key)}
              onHoverKey={setHoverKey}
            />
          </div>
          <div className={styles.sidebarTitle}>{ui?.domainsLabel || 'Domains'}</div>
          <div className={styles.domainList}>
            {domains.map((d) => {
              const isActive = d.key === selected?.key
              const isHover = d.key && hoverKey && d.key === hoverKey
              const isCompleted = d.key && completedDomainKeys.includes(d.key)
              return (
                <button
                  key={d.key}
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
                  onClick={() => setSelectedKey(d.key)}
                >
                  {d.name}
                </button>
              )
            })}
          </div>
        </aside>

        <section className={styles.content}>
          <div className={styles.domainHeader}>
            <div className={styles.domainName}>{selected?.name || ''}</div>
            <div className={styles.controls}>
              <button className={styles.secondaryButton} type="button" onClick={onCloseAssessment}>
                {ui?.closeReview || 'Close'}
              </button>
              <button className={styles.secondaryButton} type="button" onClick={onPrev} disabled={!canGoPrev}>
                {ui?.previousDomain || 'Previous'}
              </button>
              <button className={styles.secondaryButton} type="button" onClick={onNext} disabled={!canGoNext || !hasSelection || isSaving}>
                {ui?.nextDomain || ui?.next || 'Next'}
              </button>
              {isAssessmentComplete ? (
                <button className={styles.primaryButton} type="button" onClick={onCompleteAssessment}>
                  {ui?.finalizeReview || ui?.completeAssessment || 'Finalise'}
                </button>
              ) : null}
            </div>
          </div>

          <div className={styles.cards}>
            {(selected?.solutions || []).map((s) => (
              <div key={`${selected?.key}-${s.option}`} className={styles.card}>
                <label className={styles.cardHeader}>
                  <input
                    className={styles.checkbox}
                    type="checkbox"
                    checked={selectedOptions.some((x) => Number(x) === Number(s.option))}
                    onChange={() => onToggleOption(selected?.key, s.option)}
                  />
                  <div className={styles.cardTitle}>{s.name}</div>
                </label>
                <div className={styles.cardBody}>{s.description}</div>
              </div>
            ))}
          </div>

        </section>
      </div>
    </div>
  )
}

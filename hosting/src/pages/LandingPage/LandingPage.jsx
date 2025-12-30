import LandingWheel from '../../components/LandingWheel/LandingWheel.jsx'
import { getDomainContent } from '../../content/get-domain-content.js'
import { useLanguage } from '../../providers/LanguageProvider/language-context.js'
import styles from './LandingPage.module.scss'

function withFallback(primary, fallback) {
  if (!primary) {
    return fallback
  }
  if (!fallback) {
    return primary
  }
  return {
    ...fallback,
    ...primary,
  }
}

export default function LandingPage() {
  const { language } = useLanguage()
  const content = getDomainContent(language)
  const fallbackContent = getDomainContent('en')
  const frontPage = withFallback(content?.frontPage, fallbackContent?.frontPage)

  const hero = withFallback(frontPage?.hero, fallbackContent?.frontPage?.hero)
  const problem = withFallback(frontPage?.problem, fallbackContent?.frontPage?.problem)
  const cost = withFallback(frontPage?.cost, fallbackContent?.frontPage?.cost)
  const solution = withFallback(frontPage?.solution, fallbackContent?.frontPage?.solution)
  const domains = withFallback(frontPage?.domains, fallbackContent?.frontPage?.domains)
  const benefits = withFallback(frontPage?.benefits, fallbackContent?.frontPage?.benefits)
  const different = withFallback(frontPage?.different, fallbackContent?.frontPage?.different)
  const who = withFallback(frontPage?.who, fallbackContent?.frontPage?.who)
  const trust = withFallback(frontPage?.trust, fallbackContent?.frontPage?.trust)
  const cta = withFallback(frontPage?.cta, fallbackContent?.frontPage?.cta)
  const socialProof = withFallback(frontPage?.socialProof, fallbackContent?.frontPage?.socialProof)
  const faq = withFallback(frontPage?.faq, fallbackContent?.frontPage?.faq)
  const about = withFallback(frontPage?.about, fallbackContent?.frontPage?.about)
  const aboutCompany = withFallback(frontPage?.aboutCompany, fallbackContent?.frontPage?.aboutCompany)
  const finalCta = withFallback(frontPage?.finalCta, fallbackContent?.frontPage?.finalCta)

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <h1 className={styles.h1}>{hero?.headline || frontPage?.h1}</h1>
              <p className={styles.subheadline}>{hero?.subheadline || frontPage?.lead}</p>
              <p className={styles.supporting}>{hero?.supporting || ''}</p>

              <div className={styles.ctaRow}>
                <a className={styles.primaryCta} href="/login">
                  {hero?.cta || frontPage?.primaryCta}
                </a>
                <div className={styles.secondaryHelp}>
                  {frontPage?.secondaryPrefix}
                  {' '}
                  <a className={styles.inlineLink} href="/register">
                    {frontPage?.secondaryLinkText}
                  </a>
                  {frontPage?.secondarySuffix}
                </div>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <LandingWheel />
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>{problem?.headline}</h2>
          </div>
          <div className={styles.twoCol}>
            <div className={styles.prose}>
              {(problem?.body || []).map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
            <div className={styles.card}>
              <ul className={styles.bullets}>
                {(problem?.bullets || []).map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className={styles.sectionAlt}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>{cost?.headline}</h2>
          </div>
          <div className={styles.twoCol}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>{cost?.bulletsHeadline}</div>
              <ul className={styles.bullets}>
                {(cost?.bullets || []).map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
            <div className={styles.prose}>
              {(cost?.body || []).map((p) => (
                <p key={p}>{p}</p>
              ))}
            </div>
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>{solution?.headline}</h2>
            <p className={styles.sectionLead}>{solution?.body}</p>
          </div>
          <div className={styles.grid2}>
            {(solution?.steps || []).map((s) => (
              <div key={s.title} className={styles.stepCard}>
                <div className={styles.stepTitle}>{s.title}</div>
                <div className={styles.stepBody}>{s.body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.sectionAlt}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>{domains?.headline}</h2>
            <p className={styles.sectionLead}>{domains?.intro}</p>
          </div>

          <div className={styles.grid2}>
            {(domains?.items || []).map((d) => (
              <div key={d.title} className={styles.domainCard}>
                <div className={styles.cardTitle}>{d.title}</div>
                <div className={styles.cardBody}>{d.body}</div>
              </div>
            ))}
          </div>

          {domains?.closing ? <div className={styles.callout}>{domains?.closing}</div> : null}
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>{benefits?.headline}</h2>
          </div>
          <div className={styles.grid2}>
            {(benefits?.items || []).map((b) => (
              <div key={b.title} className={styles.benefitCard}>
                <div className={styles.cardTitle}>{b.title}</div>
                <div className={styles.cardBody}>{b.body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.sectionAlt}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>{different?.headline}</h2>
            <p className={styles.sectionLead}>{different?.intro}</p>
          </div>
          <div className={styles.grid2}>
            {(different?.items || []).map((i) => (
              <div key={i.title} className={styles.featureCard}>
                <div className={styles.cardTitle}>{i.title}</div>
                <div className={styles.cardBody}>{i.body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>{who?.headline}</h2>
          </div>
          <div className={styles.twoCol}>
            <div className={styles.card}>
              <div className={styles.cardTitle}>{who?.intro}</div>
              <ul className={styles.bullets}>
                {(who?.bullets || []).map((b) => (
                  <li key={b}>{b}</li>
                ))}
              </ul>
            </div>
            <div className={styles.prose}>
              {who?.notReady ? <p>{who?.notReady}</p> : null}
              {who?.already ? <p>{who?.already}</p> : null}
            </div>
          </div>
        </section>

        <section className={styles.sectionAlt}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>{trust?.headline}</h2>
          </div>
          <div className={styles.grid2}>
            {(trust?.items || []).map((i) => (
              <div key={i.title} className={styles.trustCard}>
                <div className={styles.cardTitle}>{i.title}</div>
                <div className={styles.cardBody}>{i.body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.ctaSection}>
          <div className={styles.ctaBox}>
            <h2 className={styles.h2}>{cta?.headline}</h2>
            <p className={styles.sectionLead}>{cta?.subheadline}</p>
            <div className={styles.twoCol}>
              <div className={styles.card}>
                <div className={styles.cardTitle}>{cta?.nextHeadline}</div>
                <ol className={styles.steps}>
                  {(cta?.next || []).map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ol>
              </div>
              <div className={styles.ctaRight}>
                <a className={styles.primaryCta} href="/login">
                  {cta?.button}
                </a>
              </div>
            </div>
          </div>
        </section>

        {socialProof?.quotes?.length ? (
          <section className={styles.section}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.h2}>{socialProof?.headline}</h2>
            </div>
            <div className={styles.grid3}>
              {socialProof.quotes.map((q) => (
                <figure key={q.quote} className={styles.quoteCard}>
                  <blockquote className={styles.quote}>{q.quote}</blockquote>
                  <figcaption className={styles.quoteBy}>— {q.attribution}</figcaption>
                </figure>
              ))}
            </div>
          </section>
        ) : null}

        {faq?.items?.length ? (
          <section className={styles.sectionAlt}>
            <div className={styles.sectionHeader}>
              <h2 className={styles.h2}>{faq?.headline}</h2>
            </div>
            <div className={styles.faqGrid}>
              {faq.items.map((item) => (
                <details key={item.q} className={styles.faqItem}>
                  <summary className={styles.faqQ}>{item.q}</summary>
                  <div className={styles.faqA}>{item.a}</div>
                </details>
              ))}
            </div>
          </section>
        ) : null}

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>{about?.headline}</h2>
          </div>
          <div className={styles.grid2}>
            {(about?.sections || []).map((s) => (
              <div key={s.title} className={styles.card}>
                <div className={styles.cardTitle}>{s.title}</div>
                <div className={styles.cardBody}>{s.body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.sectionAlt}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>{aboutCompany?.headline}</h2>
          </div>
          <div className={styles.grid2}>
            {(aboutCompany?.sections || []).map((s) => (
              <div key={s.title} className={styles.card}>
                <div className={styles.cardTitle}>{s.title}</div>
                <div className={styles.cardBody}>{s.body}</div>
              </div>
            ))}
          </div>
        </section>

        <section className={styles.section}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.h2}>Related sites</h2>
            <p className={styles.sectionLead}>Learn more about the organisations behind this tool.</p>
          </div>
          <div className={styles.linksRow}>
            <a className={styles.externalLink} href="https://outkomia.com/" target="_blank" rel="noreferrer">
              outkomia.com
            </a>
            <a className={styles.externalLink} href="https://nxtstride.com/" target="_blank" rel="noreferrer">
              nxtstride.com
            </a>
            <a className={styles.externalLink} href="https://title.stream/" target="_blank" rel="noreferrer">
              title.stream
            </a>
            <a className={styles.externalLink} href="https://sports-veritas.com/" target="_blank" rel="noreferrer">
              sports-veritas.com
            </a>
          </div>
        </section>

        <section className={styles.finalCta}>
          <div className={styles.finalBox}>
            <h2 className={styles.h2}>{finalCta?.headline}</h2>
            <p className={styles.sectionLead}>{finalCta?.body}</p>
            <a className={styles.primaryCta} href="/login">
              {finalCta?.button}
            </a>
            <div className={styles.disclaimer}>{finalCta?.footerLegal || frontPage?.disclaimer}</div>
          </div>
        </section>
      </main>
    </div>
  )
}

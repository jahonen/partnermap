import de from './domain-content/de.json'
import el from './domain-content/el.json'
import en from './domain-content/en.json'
import es from './domain-content/es.json'
import fi from './domain-content/fi.json'
import fr from './domain-content/fr.json'
import sv from './domain-content/sv.json'

const byLanguage = {
  de,
  el,
  en,
  es,
  fi,
  fr,
  sv,
}

export function getDomainContent(language) {
  return byLanguage[language] || en
}

import { defineTranslations } from 'fumadocs-core/i18n';
import { uiTranslations } from 'fumadocs-ui/i18n';

export const translations = defineTranslations()
  .extend(uiTranslations())
  .add({
    'Search(search trigger)': 'Suchen',
    'Search(search dialog)': 'Suchen',
    'Open Search(search trigger)(aria-label)': 'Suche öffnen',
    'Close Search(search dialog)(aria-label)': 'Suche schließen',
    'No results found(search dialog)': 'Keine Ergebnisse gefunden',
    'Search failed(search dialog)': 'Suche fehlgeschlagen',
    'Search failed, showing results for {query}(search dialog)':
      'Suche fehlgeschlagen, Ergebnisse für {query}',
    'On this page(table of contents)': 'Auf dieser Seite',
    'No Headings(table of contents)': 'Keine Überschriften',
    'Table of Contents(inline table of contents)': 'Inhaltsverzeichnis',
    'Copy Markdown(page actions)': 'Markdown kopieren',
    'Copied Markdown(page actions)': 'Markdown kopiert',
    'Open(page actions)': 'Öffnen',
    'View as Markdown(page actions)': 'Als Markdown anzeigen',
    'Open in ChatGPT(page actions)': 'In ChatGPT öffnen',
    'Open in Claude(page actions)': 'In Claude öffnen',
    'Previous Page(pagination)': 'Vorherige Seite',
    'Next Page(pagination)': 'Nächste Seite',
    'Last updated on(page footer)': 'Zuletzt aktualisiert am',
    'Toggle Theme(theme switcher)(aria-label)': 'Design umschalten',
    'Light(theme switcher)(aria-label)': 'Hell',
    'Dark(theme switcher)(aria-label)': 'Dunkel',
    'System(theme switcher)(aria-label)': 'System',
    'Theme(site menu)': 'Design',
    'Show Sidebar(sidebar)': 'Sidebar anzeigen',
    'Hide Sidebar(sidebar)': 'Sidebar ausblenden',
    'Collapse Sidebar(sidebar)(aria-label)': 'Sidebar einklappen',
    'Open Sidebar(sidebar)(aria-label)': 'Sidebar öffnen',
    'Close Sidebar(sidebar)(aria-label)': 'Sidebar schließen',
    'Open Sidebar(aria-label)': 'Sidebar öffnen',
    'Close Sidebar(aria-label)': 'Sidebar schließen',
    'Copy Text(code block)(aria-label)': 'Text kopieren',
    'Copied Text(code block)(aria-label)': 'Text kopiert',
    'Copy Anchor Link(heading anchor)(aria-label)': 'Ankerlink kopieren',
    'Copied Anchor Link(heading anchor)(aria-label)': 'Ankerlink kopiert',
    'Page Not Found(404 not found page)': 'Seite nicht gefunden',
    'Back to Home(404 not found page)': 'Zur Startseite',
    'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.(404 not found page)':
      'Die gesuchte Seite wurde möglicherweise entfernt, umbenannt oder ist vorübergehend nicht verfügbar.',
    displayName: 'Deutsch',
  });

import type { Section } from '../types/api';

type Props = {
  t: (key: string) => string;
  section: Section;
  onNavigate: (s: Section) => void;
};

const SECTIONS: { id: Section; key: string }[] = [
  { id: 'overview', key: 'navOverview' },
  { id: 'browsers', key: 'navBrowsers' },
  { id: 'queues', key: 'navQueues' },
  { id: 'cache', key: 'navCache' },
  { id: 'logs', key: 'navLogs' }
];

export function Sidebar({ t, section, onNavigate }: Props) {
  return (
    <nav className="sidebar" aria-label={t('ariaSections')}>
      {SECTIONS.map(({ id, key }) => (
        <button
          key={id}
          type="button"
          className={`nav-btn${section === id ? ' nav-btn--active' : ''}`}
          onClick={() => onNavigate(id)}
        >
          {t(key)}
        </button>
      ))}
    </nav>
  );
}

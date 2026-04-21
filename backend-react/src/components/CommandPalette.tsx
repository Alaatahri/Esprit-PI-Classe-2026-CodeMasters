import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

interface PaletteItem {
  label: string;
  sub?: string;
  icon: () => JSX.Element;
  action: () => void;
}

interface Props { onClose: () => void; }

const IcoSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);
const IcoDash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
    <rect x="14" y="14" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/>
  </svg>
);
const IcoFolder = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
  </svg>
);
const IcoUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
    <circle cx="9" cy="7" r="4"/>
    <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  </svg>
);
const IcoBar = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
    <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
  </svg>
);
const IcoActivity = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
  </svg>
);
const IcoMonitor = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="2" y="3" width="20" height="14" rx="2"/>
    <line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/>
  </svg>
);
const IcoPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

export default function CommandPalette({ onClose }: Props) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const go = (path: string) => { navigate(path); onClose(); };

  const ALL_SECTIONS: { section: string; items: PaletteItem[] }[] = [
    {
      section: 'Navigation',
      items: [
        { label: "Vue d'ensemble", sub: 'Dashboard principal', icon: IcoDash,     action: () => go('/') },
        { label: 'Projets',        sub: 'Liste des projets',   icon: IcoFolder,   action: () => go('/projects') },
        { label: 'Utilisateurs',   sub: 'Gestion des comptes', icon: IcoUsers,    action: () => go('/users') },
        { label: 'Analytics',      sub: 'Statistiques avancées',icon: IcoBar,     action: () => go('/analytics') },
        { label: 'Activité',       sub: 'Journal d\'activité', icon: IcoActivity, action: () => go('/activity') },
        { label: 'Système',        sub: 'État du système',     icon: IcoMonitor,  action: () => go('/system') },
      ],
    },
    {
      section: 'Actions',
      items: [
        { label: 'Ajouter un projet', sub: 'Créer un nouveau projet', icon: IcoPlus, action: () => go('/projects/add') },
      ],
    },
  ];

  const filtered = ALL_SECTIONS
    .map(s => ({
      ...s,
      items: s.items.filter(
        i => !query ||
          i.label.toLowerCase().includes(query.toLowerCase()) ||
          (i.sub?.toLowerCase().includes(query.toLowerCase()) ?? false)
      ),
    }))
    .filter(s => s.items.length > 0);

  const flat = filtered.flatMap(s => s.items);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(v => Math.min(v + 1, flat.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(v => Math.max(v - 1, 0)); }
    if (e.key === 'Enter' && flat[selected]) { flat[selected].action(); }
    if (e.key === 'Escape') { onClose(); }
  };

  return (
    <div className="os-palette-overlay" onClick={onClose}>
      <div className="os-palette" onClick={e => e.stopPropagation()}>
        <div className="os-palette-input-wrap">
          <IcoSearch />
          <input
            ref={inputRef}
            className="os-palette-input"
            placeholder="Rechercher une page, action…"
            value={query}
            onChange={e => { setQuery(e.target.value); setSelected(0); }}
            onKeyDown={handleKey}
          />
          <button className="os-palette-esc" onClick={onClose}>ESC</button>
        </div>

        <div className="os-palette-results">
          {filtered.length === 0 ? (
            <div className="os-palette-empty">Aucun résultat pour « {query} »</div>
          ) : (() => {
            let idx = 0;
            return filtered.map(section => (
              <div key={section.section}>
                <div className="os-palette-section-label">{section.section}</div>
                {section.items.map(item => {
                  const cur = idx++;
                  const Icon = item.icon;
                  return (
                    <div
                      key={item.label}
                      className={`os-palette-item${selected === cur ? ' selected' : ''}`}
                      onMouseEnter={() => setSelected(cur)}
                      onClick={item.action}
                    >
                      <div className="os-palette-item-icon"><Icon /></div>
                      <div>
                        <div className="os-palette-item-label">{item.label}</div>
                        {item.sub && <div className="os-palette-item-sub">{item.sub}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}

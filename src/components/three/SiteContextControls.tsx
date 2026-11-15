'use client';

import { useId, useState } from 'react';
import { Check, ChevronDown, Construction, Layers, Map, Store } from 'lucide-react';
import { useExplorer } from '@/store/explorer';
import type { ContextToggle } from '@/types';
import styles from './SiteContextControls.module.css';

const options: { key: ContextToggle; label: string }[] = [
  { key: 'showRoads', label: 'Show Roads' },
  { key: 'showLandmarks', label: 'Show Landmarks' },
  { key: 'showCheckpoints', label: 'Show Checkpoints' },
  { key: 'showUnitLabels', label: 'Show Unit Labels' },
];

export function SiteContextControls() {
  const s = useExplorer();
  const [expanded, setExpanded] = useState(false);
  const panelId = useId();
  return (
    <div
      className={`site-context-controls ${styles.controls}`}
      onKeyDown={(event) => {
        if (event.key === 'Escape') setExpanded(false);
      }}
    >
      <div className={styles.viewToggle} role="group" aria-label="Building presentation">
        <button
          type="button"
          className={s.buildingView === 'construction' ? styles.active : ''}
          aria-pressed={s.buildingView === 'construction'}
          aria-label="Structural Frame View"
          onClick={() => s.setBuildingView('construction')}
        >
          <Construction size={15} />
          <span>Structural Frame</span>
        </button>
        <button
          type="button"
          className={s.buildingView === 'proposed' ? styles.active : ''}
          aria-pressed={s.buildingView === 'proposed'}
          aria-label="Proposed Finished Plaza View"
          onClick={() => s.setBuildingView('proposed')}
        >
          <Store size={15} />
          <span>Proposed 3D</span>
        </button>
      </div>
      <button
        type="button"
        className={`${styles.contextButton} ${expanded ? styles.expanded : ''}`}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded(!expanded)}
      >
        <Map size={15} />
        <span>Context</span>
        <ChevronDown size={12} />
      </button>
      {expanded && (
        <div id={panelId} className={styles.contextPanel}>
          <p className={styles.panelHeading}>
            <Layers size={15} /> Scene layers
          </p>
          <div className={styles.options} role="group" aria-label="Context layers">
            {options.map(({ key, label }) => (
              <button
                type="button"
                key={key}
                aria-pressed={s[key]}
                onClick={() => s.toggleContext(key)}
              >
                <span className={s[key] ? styles.checked : styles.unchecked} aria-hidden="true">
                  {s[key] && <Check size={12} />}
                </span>
                {label}
              </button>
            ))}
          </div>
          <p className={styles.note}>
            The target has a semi-basement and GF, 1F and 2F. Upper floors extend the photo-guided
            grid. Right-stair and basement-access positions remain provisional.
          </p>
        </div>
      )}
    </div>
  );
}

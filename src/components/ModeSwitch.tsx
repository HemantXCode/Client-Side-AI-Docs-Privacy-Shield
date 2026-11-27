import React from 'react';
import type { RedactionMode } from '../engine/sanitizer';

interface ModeSwitchProps {
  mode: RedactionMode;
  onModeChange: (mode: RedactionMode) => void;
  isDark?: boolean;
}

const MODES: Array<{ id: RedactionMode; label: string }> = [
  { id: 'full', label: 'Full mask' },
  { id: 'partial', label: 'Partial' },
  { id: 'pseudonym', label: 'Pseudonymize' },
];

export const ModeSwitch: React.FC<ModeSwitchProps> = ({
  mode,
  onModeChange,
  isDark = false,
}) => {
  return (
    <div
      role="group"
      aria-label="Redaction mode"
      className={`flex items-center overflow-x-auto rounded-[4px] border p-0.5 ${
        isDark ? 'bg-dark-bg border-dark-line' : 'bg-paper border-ink'
      }`}
    >
      {MODES.map((item) => {
        const active = mode === item.id;
        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onModeChange(item.id)}
            aria-pressed={active}
            className={`min-h-[44px] sm:min-h-[36px] shrink-0 rounded-[4px] px-3 py-1.5 text-xs font-medium transition-colors duration-150 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 ${
              isDark
                ? 'focus-visible:outline-dark-accent'
                : 'focus-visible:outline-accent'
            } ${
              active
                ? isDark
                  ? 'bg-dark-accent text-dark-bg font-semibold'
                  : 'bg-ink text-paper font-semibold'
                : isDark
                  ? 'text-dark-text hover:bg-dark-panel'
                  : 'text-ink hover:bg-panel'
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
};

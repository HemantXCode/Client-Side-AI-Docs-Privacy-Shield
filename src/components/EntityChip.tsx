import React from 'react';
import type { PiiCategory } from '../engine/patterns';
import { CATEGORY_THEME } from './themeTokens';

interface EntityChipProps {
  category: PiiCategory;
  count?: number;
  enabled?: boolean;
  interactive?: boolean;
  isDark?: boolean;
  onClick?: () => void;
}

export const EntityChip: React.FC<EntityChipProps> = ({
  category,
  count,
  enabled = true,
  interactive = false,
  isDark = false,
  onClick,
}) => {
  const theme = CATEGORY_THEME[category];
  const baseClasses = `inline-flex items-center gap-1.5 rounded-[4px] border px-2.5 py-1 text-xs font-mono transition-colors duration-150 ${
    enabled
      ? `${theme.chipBg} border-ink`
      : isDark
        ? 'bg-dark-bg text-dark-muted border-dark-line line-through'
        : 'bg-paper text-muted border-line line-through'
  }`;

  if (interactive && onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={enabled}
        aria-label={`Toggle ${theme.label} detection (${count ?? 0} found)`}
        className={`${baseClasses} min-h-[44px] sm:min-h-[34px] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 ${
          isDark ? 'focus-visible:outline-dark-accent' : 'focus-visible:outline-accent'
        }`}
      >
        <span className="font-semibold">{theme.label}</span>
        {typeof count === 'number' && (
          <span
            className={`rounded-[4px] px-1.5 py-0.5 text-[11px] tabular-nums border ${
              enabled
                ? 'bg-panel border-ink text-ink'
                : isDark
                  ? 'bg-dark-panel border-dark-line text-dark-muted'
                  : 'bg-panel border-line text-muted'
            }`}
          >
            {count}
          </span>
        )}
      </button>
    );
  }

  return (
    <span className={baseClasses}>
      <span className="font-semibold">{theme.label}</span>
      {typeof count === 'number' && (
        <span className="rounded-[4px] bg-panel border border-ink px-1.5 py-0.5 text-[11px] tabular-nums text-ink">
          {count}
        </span>
      )}
    </span>
  );
};

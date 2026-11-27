import React from 'react';
import type { RiskLevel } from '../engine/sanitizer';

interface RiskMeterProps {
  riskScore: number;
  riskLevel: RiskLevel;
  isDark?: boolean;
}

function getFilledSegments(riskScore: number): number {
  if (riskScore <= 0) return 0;
  if (riskScore <= 20) return 1;
  if (riskScore <= 45) return 2;
  if (riskScore <= 70) return 3;
  if (riskScore <= 90) return 4;
  return 5;
}

export const RiskMeter: React.FC<RiskMeterProps> = ({
  riskScore,
  riskLevel,
  isDark = false,
}) => {
  const filledCount = getFilledSegments(riskScore);

  return (
    <div
      className="flex items-center gap-2.5"
      aria-label={`Privacy risk level ${riskLevel}, ${filledCount} of 5 segments`}
    >
      <span
        className={`font-mono text-[11px] font-medium uppercase tracking-wider ${
          isDark ? 'text-dark-muted' : 'text-muted'
        }`}
      >
        Risk
      </span>
      <div className="flex items-center gap-1" role="meter" aria-valuemin={0} aria-valuemax={5} aria-valuenow={filledCount}>
        {[0, 1, 2, 3, 4].map((index) => {
          const filled = index < filledCount;
          return (
            <span
              key={index}
              className={`h-3 w-4 rounded-[4px] border transition-colors duration-150 ${
                filled
                  ? isDark
                    ? 'bg-dark-accent border-dark-accent'
                    : 'bg-accent border-ink'
                  : isDark
                    ? 'bg-dark-bg border-dark-line'
                    : 'bg-paper border-line'
              }`}
            />
          );
        })}
      </div>
      <span
        className={`font-mono text-xs font-semibold ${
          isDark ? 'text-dark-text' : 'text-ink'
        }`}
      >
        {riskLevel}
      </span>
    </div>
  );
};

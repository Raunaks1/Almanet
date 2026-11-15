import React from 'react';
import { X } from 'lucide-react';
import type { MatchedKeyword, WeakFinding } from '../../lib/resume/analyzeResume';
import { cx } from '../../components/ui/internal';
import styles from './ResumeHighlight.module.css';

interface ResumeHighlightProps {
  text: string;
  matched: MatchedKeyword[];
  weak: WeakFinding[];
  className?: string;
}

type Segment = { kind: 'plain' | 'matched' | 'weak'; text: string; suggestion?: string };

/** Split `text` into non-overlapping segments so highlights map exactly onto the
 *  displayed text. Weak findings take precedence over matched keywords on overlap.
 *  Never uses dangerouslySetInnerHTML. */
export function buildSegments(
  text: string,
  matched: MatchedKeyword[],
  weak: WeakFinding[],
): Segment[] {
  const marks: Array<{ start: number; end: number; kind: 'matched' | 'weak'; suggestion?: string }> = [];

  for (const m of matched) {
    for (const o of m.offsets) {
      marks.push({ start: o, end: o + m.canonical.length, kind: 'matched' });
    }
  }
  for (const w of weak) {
    marks.push({ start: w.start, end: w.end, kind: 'weak', suggestion: w.suggestion });
  }

  const points = new Set<number>([0, text.length]);
  for (const m of marks) {
    points.add(m.start);
    points.add(m.end);
  }
  const sorted = Array.from(points).sort((a, b) => a - b);

  const segments: Segment[] = [];
  for (let i = 0; i < sorted.length - 1; i += 1) {
    const s = sorted[i];
    const e = sorted[i + 1];
    if (s === e) continue;
    const segText = text.slice(s, e);

    let kind: Segment['kind'] = 'plain';
    let suggestion: string | undefined;
    for (const m of marks) {
      if (m.kind === 'weak' && s >= m.start && e <= m.end) {
        kind = 'weak';
        suggestion = m.suggestion;
        break;
      }
    }
    if (kind === 'plain') {
      for (const m of marks) {
        if (m.kind === 'matched' && s >= m.start && e <= m.end) {
          kind = 'matched';
          break;
        }
      }
    }
    segments.push({ kind, text: segText, suggestion });
  }
  return segments;
}

export const ResumeHighlight: React.FC<ResumeHighlightProps> = ({
  text,
  matched,
  weak,
  className,
}) => {
  const segments = React.useMemo(() => buildSegments(text, matched, weak), [
    text,
    matched,
    weak,
  ]);

  const [tooltip, setTooltip] = React.useState<{ suggestion: string } | null>(null);

  const enter = (suggestion: string) => setTooltip({ suggestion });
  const leave = () => setTooltip(null);

  const matchedCount = matched.reduce((s, m) => s + m.count, 0);
  const weakCount = weak.length;

  return (
    <section className={cx(styles.root, className)} aria-label="Resume text with highlights">
      <div className={styles.legend}>
        <span className={styles.legendItem}>
          <span className={cx(styles.swatch, styles.swatchMatched)} aria-hidden="true" />
          Matched keyword ({matchedCount})
        </span>
        <span className={styles.legendItem}>
          <span className={cx(styles.swatch, styles.swatchWeak)} aria-hidden="true" />
          Weak phrase ({weakCount})
        </span>
      </div>

      <div className={styles.textWrap} role="region" aria-label="Resume content">
        {segments.map((seg, i) => {
          if (seg.kind === 'plain') {
            return <span key={i}>{seg.text}</span>;
          }
          const isWeak = seg.kind === 'weak';
          return (
            <span
              key={i}
              className={cx(styles.highlight, isWeak ? styles.highlightWeak : styles.highlightMatched)}
              tabIndex={isWeak ? 0 : undefined}
              aria-label={isWeak ? seg.suggestion : undefined}
              title={isWeak ? seg.suggestion : undefined}
              onMouseEnter={() => isWeak && enter(seg.suggestion!)}
              onMouseLeave={leave}
              onFocus={() => isWeak && enter(seg.suggestion!)}
              onBlur={leave}
            >
              {seg.text}
            </span>
          );
        })}
      </div>

      {tooltip && (
        <div className={styles.tooltip} role="tooltip" aria-live="polite">
          <span className={styles.tooltipLabel}>Suggestion:</span> {tooltip.suggestion}
          <button type="button" className={styles.tooltipClose} onClick={leave} aria-label="Dismiss">
            <X size={14} strokeWidth={1.75} aria-hidden="true" />
          </button>
        </div>
      )}
    </section>
  );
}

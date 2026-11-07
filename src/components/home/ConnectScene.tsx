import React, { memo, useEffect, useRef } from 'react';
import { TestimonialGlobe } from '@/components/ui/testimonial-globe';
import type { GlobeTestimonial } from '@/components/ui/testimonial-globe';
import { arcPath } from './globeProjection';
import styles from './ConnectScene.module.css';

type Props = {
  items: GlobeTestimonial[];
  autoplay: boolean;
  interval?: number;
  size?: number;
  layout?: 'auto' | 'centered' | 'side-by-side';
  showBadge?: boolean;
};

// Module-constant arc pairs connecting the 10 global hubs
const ARC_PAIRS: [number, number][] = [
  [0, 1], // Sydney - Tokyo
  [1, 2], // Tokyo - Singapore
  [2, 3], // Singapore - Mumbai (Raunak)
  [3, 4], // Mumbai (Raunak) - Dubai
  [4, 5], // Dubai - Berlin
  [5, 6], // Berlin - Zurich
  [6, 7], // Zurich - London
  [3, 7], // Mumbai - London (direct long-haul)
  [7, 8], // London - Toronto
  [8, 9], // Toronto - San Francisco
  [9, 1], // San Francisco - Tokyo (trans-Pacific)
];

function ArcsOverlay({ items }: { items: GlobeTestimonial[] }) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const pathRefs = useRef<(SVGPathElement | null)[]>([]);

  useEffect(() => {
    let raf = 0;
    let geomFrame = -1;
    let left = 0;
    let top = 0;
    let size = 0;
    const measure = () => {
      const svg = svgRef.current;
      const frame = svg?.parentElement as HTMLElement | null;
      const box = frame?.querySelector('[data-globe-box]') as HTMLElement | null;
      if (!svg || !frame || !box) return;
      left = box.offsetLeft;
      top = box.offsetTop;
      // offsetLeft is relative to offsetParent; fall back to rect delta for nested layouts.
      if (box.offsetParent !== frame) {
        const fr = frame.getBoundingClientRect();
        const br = box.getBoundingClientRect();
        left = br.left - fr.left;
        top = br.top - fr.top;
      }
      size = box.clientWidth;
      svg.style.left = `${left}px`;
      svg.style.top = `${top}px`;
      svg.style.width = `${size}px`;
      svg.style.height = `${size}px`;
      svg.setAttribute('viewBox', `0 0 ${Math.max(0, size)} ${Math.max(0, size)}`);
    };
    const ro = new ResizeObserver(() => {
      geomFrame = -1;
    });
    const frame = svgRef.current?.parentElement as HTMLElement | null;
    if (frame) ro.observe(frame);

    const tick = (n: number) => {
      const svg = svgRef.current;
      if (svg && !document.hidden) {
        if (geomFrame !== n) {
          measure();
          geomFrame = n;
        }
        const host = frame?.querySelector('[data-globe]') as HTMLElement | null;
        const phi = host?.dataset.phi ? Number.parseFloat(host.dataset.phi) : NaN;
        if (Number.isFinite(phi) && size > 0) {
          ARC_PAIRS.forEach((pair, idx) => {
            const from = items[pair[0]];
            const to = items[pair[1]];
            const path = pathRefs.current[idx];
            if (!from || !to || !path) return;
            const { d, visible } = arcPath(from, to, phi, size);
            path.setAttribute('d', d);
            path.style.opacity = visible && d ? '1' : '0';
          });
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [items]);

  return (
    <svg ref={svgRef} className={styles.arcs} aria-hidden="true">
      <defs>
        <linearGradient id="almanet-arc" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(10,132,255,0)" />
          <stop offset="50%" stopColor="rgba(10,132,255,0.75)" />
          <stop offset="100%" stopColor="rgba(10,132,255,0)" />
        </linearGradient>
        <filter id="almanet-arc-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      {ARC_PAIRS.map((pair, idx) => (
        <path
          key={`${pair[0]}-${pair[1]}`}
          ref={(el) => {
            pathRefs.current[idx] = el;
          }}
          fill="none"
          stroke="url(#almanet-arc)"
          strokeWidth="1.6"
          strokeLinecap="round"
          filter="url(#almanet-arc-glow)"
          style={{ opacity: 0 }}
        />
      ))}
    </svg>
  );
}

function ConnectSceneInner({
  items,
  autoplay,
  interval = 4000,
  size = 700,
  layout = 'side-by-side',
  showBadge = false,
}: Props) {
  return (
    <div className={styles.wrap}>
      {showBadge && <div className={styles.badge} aria-hidden="true">Almanet</div>}
      <div className={styles.globeFrame}>
        <TestimonialGlobe
          items={items}
          autoplay={autoplay}
          autoRotate
          interval={interval}
          size={size}
          layout={layout}
          labels={{ previous: 'Previous person', next: 'Next person', pin: 'Show' }}
          className={styles.globe}
        />
        <ArcsOverlay items={items} />
      </div>
    </div>
  );
}

export const ConnectScene = memo(ConnectSceneInner);
export default ConnectScene;

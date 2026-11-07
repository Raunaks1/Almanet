import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';
import { motion, useReducedMotion, useInView } from 'motion/react';
import { ChevronDown } from 'lucide-react';
import { FAQ_ITEMS, SUPPORT_EMAIL, type FaqItem, getAnswer, buildRevealSchedule } from './faqData';
import { cx } from '@/components/ui/internal';
import './Faq.css';

const EASE: [number, number, number, number] = [0.2, 0.8, 0.2, 1];

interface AnswerProps {
  id: string;
  text: string;
  open: boolean;
  streamed: boolean;
  onDone: (id: string) => void;
  inView: boolean;
  reduced: boolean;
}

function Answer({ id, text, open, streamed, onDone, inView, reduced }: AnswerProps) {
  const times = useMemo(() => buildRevealSchedule(text), [text]);
  const [count, setCount] = useState(0);
  const doneRef = useRef(onDone);
  useEffect(() => {
    doneRef.current = onDone;
  });

  const finished = reduced || streamed || count >= text.length;
  const play = open && inView && !finished;

  // The reveal loop: depends ONLY on `play` and `times`.
  // Marking "done" happens only inside the tick when the last char is reached.
  useEffect(() => {
    if (!play) return;
    setCount(0);
    let raf = 0;
    let shown = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      let n = shown;
      while (n < times.length && times[n] <= elapsed) n++;
      if (n !== shown) {
        shown = n;
        setCount(n);
      }
      if (n >= times.length) {
        doneRef.current(id);
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [play, times, id]);

  // Closing mid-stream completes the answer instantly and marks it done.
  useEffect(() => {
    if (!open && !streamed && !reduced && count > 0 && count < text.length) {
      setCount(text.length);
      doneRef.current(id);
    }
  }, [open, streamed, reduced, count, text.length, id]);

  if (finished) {
    return <p className="faq-answer">{text}</p>;
  }
  return (
    <p className="faq-answer">
      <span className="faq-shown">{text.slice(0, count)}</span>
      {play && <span className="faq-caret" aria-hidden="true" />}
      <span className="faq-rest">{text.slice(count)}</span>
    </p>
  );
}

interface FaqProps {
  items?: FaqItem[];
  title?: string;
  subtitle?: string;
  className?: string;
}

export default function Faq({
  items = FAQ_ITEMS,
  title = 'Frequently asked questions.',
  subtitle = 'Everything you need to know before you join.',
  className,
}: FaqProps) {
  const reduceMotion = useReducedMotion() ?? false;
  const sectionRef = useRef<HTMLDivElement | null>(null);
  const sectionInView = useInView(sectionRef, { once: true, amount: 0.3 });

  const [openId, setOpenId] = useState<string | null>(items[0]?.id ?? null);
  // Items that have finished streaming — parent-owned state passed down.
  const [streamedIds, setStreamedIds] = useState<Set<string>>(new Set());
  // Items opened by the user (stream immediately even if section not in view).
  const [userOpenedIds, setUserOpenedIds] = useState<Set<string>>(new Set());
  const idPrefix = useId();

  const toggle = useCallback(
    (id: string) => {
      setUserOpenedIds((prev) => new Set(prev).add(id));
      setOpenId((prev) => (prev === id ? null : id));
    },
    [],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>, index: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggle(items[index].id);
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (index + 1) % items.length;
        const el = document.getElementById(`${idPrefix}-trigger-${next}`);
        el?.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (index - 1 + items.length) % items.length;
        const el = document.getElementById(`${idPrefix}-trigger-${prev}`);
        el?.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        document.getElementById(`${idPrefix}-trigger-0`)?.focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        document.getElementById(`${idPrefix}-trigger-${items.length - 1}`)?.focus();
      }
    },
    [items, toggle, idPrefix],
  );

  const isOpen = (id: string) => openId === id;
  const isStreamed = (id: string) => streamedIds.has(id);

  // Items fade up once when scrolled into view, staggered 60ms (cap at 6 items).
  const [itemsRevealed, setItemsRevealed] = useState(false);
  useEffect(() => {
    const el = sectionRef.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setItemsRevealed(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setItemsRevealed(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.3 } as IntersectionObserverInit,
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: reduceMotion ? 0 : 0.7, ease: EASE } },
  };

  const onDone = useCallback((id: string) => {
    setStreamedIds((prev) => new Set(prev).add(id));
  }, []);

  return (
    <section
      id="faq"
      aria-labelledby="faq-title"
      ref={sectionRef}
      className={cx('faq-section', className)}
    >
      <div className="faq-wrap">
        <motion.header
          className="faq-header"
          initial={reduceMotion ? false : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.7, ease: EASE }}
        >
          <p className="faq-eyebrow">FAQ</p>
          <h2 id="faq-title" className="faq-title">{title}</h2>
          <p className="faq-subtitle">{subtitle}</p>
        </motion.header>

        <ul className="faq-list">
          {items.map((item, index) => {
            const open = isOpen(item.id);
            const streamed = isStreamed(item.id);
            const text = getAnswer(item);
            const triggerId = `${idPrefix}-trigger-${index}`;
            const panelId = `${idPrefix}-panel-${index}`;
            // Default-open item streams only once section is in view;
            // user-opened items stream immediately.
            const inViewProp = sectionInView || userOpenedIds.has(item.id);

            return (
              <li
                key={item.id}
                className="faq-list-item"
              >
                <motion.div
                  className={cx('faq-item', open && 'faq-item--open')}
                  variants={itemVariants}
                  initial={reduceMotion ? false : 'hidden'}
                  animate={
                    itemsRevealed
                      ? 'visible'
                      : reduceMotion
                        ? 'visible'
                        : 'hidden'
                  }
                  transition={{
                    duration: reduceMotion ? 0 : 0.7,
                    ease: EASE,
                    delay: Math.min(index, 6) * 0.06,
                  }}
                >
                  <button
                    type="button"
                    id={triggerId}
                    className="faq-trigger"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => toggle(item.id)}
                    onKeyDown={(e) => handleKeyDown(e, index)}
                  >
                    <span className="faq-question">{item.question}</span>
                    <ChevronDown className="faq-chevron" size={18} strokeWidth={1.75} aria-hidden="true" />
                  </button>
                  <div
                    id={panelId}
                    className="faq-panel"
                    role="region"
                    aria-labelledby={triggerId}
                    data-open={open ? 'true' : 'false'}
                    inert={!open}
                  >
                    <div className="faq-panel-inner">
                      <Answer
                        id={item.id}
                        text={text}
                        open={open}
                        streamed={streamed}
                        onDone={onDone}
                        inView={inViewProp}
                        reduced={reduceMotion}
                      />
                    </div>
                  </div>
                </motion.div>
              </li>
            );
          })}
        </ul>

        {SUPPORT_EMAIL && (
          <p className="faq-support">
            Still have questions? <a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a>
          </p>
        )}
      </div>
    </section>
  );
}

import React, { useState } from 'react';
import {
  Calendar,
  Check,
  GraduationCap,
  Minus,
  Monitor,
  Moon,
  Plus,
  Search,
  Sun,
  X,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Checkbox,
  Chip,
  Combobox,
  Divider,
  EmptyState,
  FormField,
  GlassCard,
  IconButton,
  Input,
  Modal,
  SegmentedControl,
  Select,
  Skeleton,
  Switch,
  TabPanel,
  Tabs,
  Textarea,
  Tooltip,
  useToast,
} from '../components/ui';
import { ThemeToggle } from '../components/ThemeToggle';
import { COLLEGE_NAMES } from '../lib/colleges';
import styles from './UiKit.module.css';

const COLLEGE_OPTIONS = COLLEGE_NAMES.map((name) => ({ value: name, label: name }));

const ICON = { size: 16, strokeWidth: 1.75 } as const;

/**
 * Dev-only gallery for the UI kit — every component rendered twice, once
 * under light tokens and once under dark tokens, by scoping `data-theme`
 * to each pane. Mounts nothing in production builds.
 */
export default function UiKit() {
  if (!import.meta.env.DEV) return null;

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        <div>
          <h1 className={styles.title}>UI Kit</h1>
          <p className={styles.sub}>
            Dev-only review gallery. Each pane scopes its own <code>data-theme</code>, so
            components are evaluated against the real light and dark token sets. The
            document-level theme (top right) only affects this header text.
          </p>
        </div>
        <ThemeToggle />
      </header>

      <div className={styles.panels}>
        <Pane theme="light" />
        <Pane theme="dark" />
      </div>
    </div>
  );
}

function Pane({ theme }: { theme: 'light' | 'dark' }) {
  return (
    <section className={styles.pane} data-theme={theme}>
      <div className={styles.paneBar}>
        <span className={styles[theme]} aria-hidden="true" />
        <strong>{theme === 'light' ? 'Light' : 'Dark'}</strong>
        <span>tokens</span>
      </div>
      <div className={styles.paneBody}>
        <Sections />
      </div>
    </section>
  );
}

function Sections() {
  const [college, setCollege] = useState<string | null>(null);
  const [checkedA, setCheckedA] = useState(true);
  const [mixed, setMixed] = useState(true);
  const [switchOn, setSwitchOn] = useState(true);
  const [segment, setSegment] = useState('overview');
  const [segment2, setSegment2] = useState('all');
  const [tab, setTab] = useState('overview');
  const [tags, setTags] = useState(['2024 Batch', 'Arts Circle']);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const toast = useToast();

  return (
    <>
      {/* ── Buttons ─────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionName}>Buttons</h3>
        <div className={styles.row}>
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Glass</Button>
          <Button variant="tinted">Tinted</Button>
          <Button variant="plain">Plain</Button>
          <Button variant="destructive">Delete</Button>
        </div>
        <div className={styles.row}>
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button loading>Saving</Button>
          <Button disabled>Disabled</Button>
        </div>
        <div className={styles.row}>
          <Button
            variant="secondary"
            iconLeft={<Plus {...ICON} aria-hidden="true" />}
            iconRight={<Calendar {...ICON} aria-hidden="true" />}
          >
            Schedule
          </Button>
          <Button fullWidth>Full width</Button>
        </div>
      </section>

      {/* ── Icon buttons & tooltips ─────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionName}>Icon buttons & tooltip</h3>
        <div className={styles.row}>
          <Tooltip content="Search members">
            <IconButton icon={<Search {...ICON} aria-hidden="true" />} label="Search" />
          </Tooltip>
          <Tooltip content="Create a post">
            <IconButton variant="tinted" icon={<Plus {...ICON} aria-hidden="true" />} label="Create" />
          </Tooltip>
          <Tooltip content="Confirm choice">
            <IconButton variant="primary" icon={<Check {...ICON} aria-hidden="true" />} label="Confirm" />
          </Tooltip>
          <Tooltip content="Clear filters">
            <IconButton variant="destructive" icon={<X {...ICON} aria-hidden="true" />} label="Clear" />
          </Tooltip>
          <Tooltip content="Remove item" side="bottom">
            <IconButton variant="plain" icon={<Minus {...ICON} aria-hidden="true" />} label="Remove" />
          </Tooltip>
          <IconButton loading label="Working" icon={<Minus {...ICON} aria-hidden="true" />} />
        </div>
        <div className={styles.row}>
          <IconButton size="sm" icon={<Search size={13} strokeWidth={1.75} aria-hidden="true" />} label="Small" />
          <IconButton size="md" icon={<Search {...ICON} aria-hidden="true" />} label="Medium" />
          <IconButton size="lg" icon={<Search size={20} strokeWidth={1.75} aria-hidden="true" />} label="Large" />
        </div>
      </section>

      {/* ── Cards ──────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionName}>Glass cards</h3>
        <div className={styles.grid2}>
          <GlassCard>
            <h4 className={styles.cardTitle}>Default</h4>
            <p className={styles.cardText}>Chrome surface with the house glass recipe.</p>
          </GlassCard>
          <GlassCard variant="elevated">
            <h4 className={styles.cardTitle}>Elevated</h4>
            <p className={styles.cardText}>Same glass with a deeper shadow for emphasis.</p>
          </GlassCard>
          <GlassCard
            variant="interactive"
            onClick={() => undefined}
          >
            <h4 className={styles.cardTitle}>Interactive</h4>
            <p className={styles.cardText}>Hover lift and press feedback are on.</p>
          </GlassCard>
        </div>
      </section>

      {/* ── Fields ──────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionName}>Fields</h3>
        <div className={styles.col}>
          <Input placeholder="Full name" aria-label="Full name" />
          <Input size="sm" placeholder="Small size" aria-label="Small size" />
          <Input
            iconLeft={<Search {...ICON} aria-hidden="true" />}
            placeholder="Search alumni"
            aria-label="Search alumni"
          />
          <Input invalid defaultValue="aniket@@college.edu" aria-label="Invalid input demo" />
          <Textarea placeholder="About you" rows={3} aria-label="About you" />
          <Select aria-label="Branch demo" defaultValue="">
            <option value="" disabled>
              Pick a branch
            </option>
            <option>Computer Engineering</option>
            <option>Information Technology</option>
            <option>E&amp;TC</option>
            <option>Mechanical Engineering</option>
          </Select>
          <Combobox
            options={COLLEGE_OPTIONS}
            value={college}
            onChange={setCollege}
            placeholder="Find your college…"
          />
          <p className={styles.meta}>{college ? `Selected: ${college}` : 'Try “College of Engineering…”'}</p>
        </div>
      </section>

      {/* ── Checkbox & switch ──────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionName}>Checkbox & switch</h3>
        <div className={styles.row}>
          <label className={styles.checkRow}>
            <Checkbox checked={checkedA} onChange={(e) => setCheckedA(e.target.checked)} />
            Email digests
          </label>
          <label className={styles.checkRow}>
            <Checkbox indeterminate={mixed} onChange={() => setMixed(!mixed)} />
            Mixed state
          </label>
          <label className={styles.checkRow}>
            <Checkbox disabled />
            Disabled
          </label>
        </div>
        <div className={styles.row}>
          <label className={styles.checkRow}>
            <Switch checked={switchOn} onChange={(e) => setSwitchOn(e.target.checked)} />
            Entrance alerts
          </label>
          <label className={styles.checkRow}>
            <Switch disabled />
            Disabled
          </label>
        </div>
      </section>

      {/* ── Segmented control & tabs ───────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionName}>Segmented control & tabs</h3>
        <div className={styles.row}>
          <SegmentedControl
            aria-label="Demo segment"
            options={[
              { value: 'overview', label: 'Overview' },
              { value: 'members', label: 'Members' },
              { value: 'events', label: 'Events' },
            ]}
            value={segment}
            onChange={setSegment}
          />
          <SegmentedControl
            aria-label="Segment with icons"
            size="sm"
            options={[
              { value: 'all', label: 'Sun', icon: <Sun size={14} strokeWidth={1.75} aria-hidden="true" /> },
              { value: 'sys', label: 'System', icon: <Monitor size={14} strokeWidth={1.75} aria-hidden="true" /> },
              { value: 'dark', label: 'Moon', icon: <Moon size={14} strokeWidth={1.75} aria-hidden="true" /> },
            ]}
            value={segment2}
            onChange={setSegment2}
          />
        </div>
        <Tabs
          aria-label="Demo tabs"
          items={[
            { value: 'overview', label: 'Overview' },
            { value: 'members', label: 'Members' },
            { value: 'settings', label: 'Settings' },
          ]}
          value={tab}
          onChange={setTab}
        >
          <TabPanel value="overview">
            Chips ← use arrow keys to move between tabs. Panels announce via
            <code>aria-labelledby</code>.
          </TabPanel>
          <TabPanel value="members">
            <span className={styles.meta}>
              1,204 alumni · 86 verified this month.
            </span>
          </TabPanel>
          <TabPanel value="settings">
            <span className={styles.meta}>Notification and privacy preferences live here.</span>
          </TabPanel>
        </Tabs>
      </section>

      {/* ── Badge & chips ─────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionName}>Badge & chips</h3>
        <div className={styles.row}>
          <Badge>Neutral</Badge>
          <Badge variant="accent">Verified</Badge>
          <Badge variant="success" dot>
            Online
          </Badge>
          <Badge variant="warning">Pending</Badge>
          <Badge variant="danger" dot>
            Suspended
          </Badge>
          <Badge size="sm" variant="accent">
            Small
          </Badge>
        </div>
        <div className={styles.row}>
          {tags.map((tag) => (
            <Chip
              key={tag}
              selected
              onRemove={() => setTags((current) => current.filter((t) => t !== tag))}
            >
              {tag}
            </Chip>
          ))}
          {tags.length === 0 && <span className={styles.meta}>All chips removed</span>}
        </div>
      </section>

      {/* ── Avatar ────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionName}>Avatars</h3>
        <div className={styles.row}>
          <Avatar name="Raunak Shaikh" size="xs" />
          <Avatar name="Priya Deshmukh" size="sm" />
          <Avatar name="Aniket Patil" size="md" online />
          <Avatar name="Sneha Kulkarni Deshmukh-Patil" size="lg" />
          <Avatar name="Extra Long Name For Two Initials" size="xl" online />
        </div>
      </section>

      {/* ── Modal ─────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionName}>Modal & sheet</h3>
        <div className={styles.row}>
          <Button variant="primary" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <span className={styles.meta}>
            Sheet + drag handle below 640px, centered card otherwise.
          </span>
        </div>
      </section>

      {/* ── Toasts ────────────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionName}>Toasts</h3>
        <div className={styles.row}>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toast.show({ title: 'Profile saved', description: 'Your change is live.', variant: 'success' })}
          >
            Success
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toast.show({ title: 'Tip', description: 'Pin your batch channel to find it faster.', variant: 'info' })}
          >
            Info
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toast.show({ title: 'Verification pending', description: 'We will email you within 48 hours.', variant: 'warning' })}
          >
            Warning
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => toast.show({ title: 'Post failed', description: 'Check the channel permissions.', variant: 'danger' })}
          >
            Danger
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              toast.show({
                title: 'Event deleted',
                description: 'You can restore it right away.',
                variant: 'danger',
                duration: 6000,
                action: {
                  label: 'Undo',
                  onClick: () => toast.show({ title: 'Event restored', variant: 'success' }),
                },
              })
            }
          >
            With action
          </Button>
        </div>
        <span className={styles.meta}>Max 3 stack, auto-dismiss in 4s, top-center glass.</span>
      </section>

      {/* ── Skeleton ──────────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionName}>Skeleton</h3>
        <div className={styles.row}>
          <Button size="sm" variant="secondary" onClick={() => setLoading(!loading)}>
            Toggle loading
          </Button>
        </div>
        <GlassCard padding="16px">
          {loading ? (
            <div className={styles.mockRow}>
              <Skeleton width={44} height={44} radius="circle" />
              <div className={styles.stack}>
                <Skeleton width={140} height={14} />
                <Skeleton width={90} height={12} />
              </div>
            </div>
          ) : (
            <div className={styles.mockRow}>
              <Avatar name="Priya Deshmukh" size="md" online />
              <div className={styles.stack}>
                <span className={styles.cardTitle}>Priya Deshmukh</span>
                <span className={styles.meta}>CSE, 2021 · Mumbai</span>
              </div>
            </div>
          )}
          <Divider spacing="sm" />
          <Skeleton width="100%" height={12} />
          <div className={styles.stack} style={{ height: 10 }} />
          <Skeleton width="72%" height={12} />
        </GlassCard>
      </section>

      {/* ── Empty state ───────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionName}>Empty state</h3>
        <GlassCard padding="var(--space-2)">
          <EmptyState
            icon={<GraduationCap size={28} strokeWidth={1.75} aria-hidden="true" />}
            title="No events yet"
            description="Meetups your batch organises will appear here first."
            action={
              <Button
                size="sm"
                variant="secondary"
                onClick={() => toast.show({ title: 'Demo only', description: 'The real action comes with the events redesign.', variant: 'info' })}
              >
                Create event
              </Button>
            }
          />
        </GlassCard>
      </section>

      {/* ── Form fields with meta ─────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionName}>FormField</h3>
        <div className={styles.grid2}>
          <FormField label="Email" hint="Only visible to verified alumni.">
            <Input defaultValue="priya@rkcollege.edu" />
          </FormField>
          <FormField label="Phone" required error="Enter a 10-digit number.">
            <Input defaultValue="98760" />
          </FormField>
        </div>
      </section>

      {/* ── Divider ───────────────────────────────────────────── */}
      <section className={styles.section}>
        <h3 className={styles.sectionName}>Divider</h3>
        <GlassCard padding="16px">
          <p className={styles.cardText}>Content above a plain rule.</p>
          <Divider spacing="sm" />
          <p className={styles.cardText}>…and a labeled one below.</p>
          <Divider label="or continue with" spacing="sm" />
          <div className={styles.row}>
            <span className={styles.meta}>Before</span>
            <span aria-hidden="true">·</span>
            <Divider vertical style={{ height: 28 }} />
            <span className={styles.meta}>After</span>
          </div>
        </GlassCard>
      </section>

      {/* ── Modal (portal renders at document level) ──────────── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Alumni meetup"
        subtitle="RSVP for the December edition"
        footer={
          <>
            <Button variant="plain" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setModalOpen(false);
                toast.show({ title: 'RSVP received', description: 'Check the events page for updates.', variant: 'success' });
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <div className={styles.modalBody}>
          <FormField label="Headcount" hint="Including friends and family.">
            <Input type="number" min={1} max={8} defaultValue={2} />
          </FormField>
          <label className={styles.checkRow}>
            <Checkbox defaultChecked />
            Send me the calendar invite
          </label>
        </div>
      </Modal>
    </>
  );
}

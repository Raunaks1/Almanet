/* TEMP dev-only preview of the app shell — removed before final build. */
import React from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/shell/PageHeader';
import { Button, Divider, GlassCard, Skeleton } from '../components/ui';

export default function ShellPreview() {
  return (
    <div style={{ maxWidth: 920 }}>
      {/* TEMP: lets the pill glide be tested between two preview routes. */}
      <p style={{ margin: '0 0 12px', font: 'var(--type-footnote)', color: 'var(--text-3)' }}>
        <Link to="/forums/preview">Forums preview</Link> · <Link to="/jobs/preview">Jobs preview</Link>
      </p>
      <PageHeader
        title="Dashboard"
        subtitle="Welcome back. Here's what's happening across your network."
        actions={
          <>
            <Button variant="secondary">Invite</Button>
            <Button>New post</Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        <GlassCard>
          <h2 style={{ margin: 0, font: 'var(--type-headline)', color: 'var(--text)' }}>Upcoming events</h2>
          <p style={{ margin: '6px 0 0', font: 'var(--type-footnote)', color: 'var(--text-2)' }}>
            Annual alumni meetup · Dec 14
          </p>
        </GlassCard>
        <GlassCard>
          <h2 style={{ margin: 0, font: 'var(--type-headline)', color: 'var(--text)' }}>New in your batch</h2>
          <p style={{ margin: '6px 0 0', font: 'var(--type-footnote)', color: 'var(--text-2)' }}>
            12 new members joined this week
          </p>
        </GlassCard>
        <GlassCard>
          <h2 style={{ margin: 0, font: 'var(--type-headline)', color: 'var(--text)' }}>Jobs for you</h2>
          <p style={{ margin: '6px 0 0', font: 'var(--type-footnote)', color: 'var(--text-2)' }}>
            6 roles matched your skills
          </p>
        </GlassCard>
      </div>

      <Divider label="loading example" spacing="lg" />

      <GlassCard>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <Skeleton width={44} height={44} radius="circle" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1 }}>
            <Skeleton width={180} height={14} />
            <Skeleton width="60%" height={12} />
          </div>
        </div>
      </GlassCard>

      {/* TEMP filler so the mobile top bar can be tested while scrolled. */}
      {Array.from({ length: 10 }, (_, i) => (
        <GlassCard key={i} style={{ marginTop: 16 }}>
          <h2 style={{ margin: 0, font: 'var(--type-headline)', color: 'var(--text)' }}>Recent activity {i + 1}</h2>
          <p style={{ margin: '6px 0 0', font: 'var(--type-footnote)', color: 'var(--text-2)' }}>
            A member from your batch shared an update with the network.
          </p>
        </GlassCard>
      ))}
    </div>
  );
}

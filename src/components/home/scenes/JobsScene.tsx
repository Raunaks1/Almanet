import React from 'react';
import { Briefcase } from 'lucide-react';
import './scenes.css';

export default function JobsScene() {
  return (
    <div className="fs-scenes sc-jobs sc-loop" aria-hidden="true">
      <div className="sc-card sc-job sc-job-top job-top-card">
        <p className="sc-job-title">
          <Briefcase size={13} strokeWidth={1.75} style={{ display: 'inline', verticalAlign: '-2px', marginRight: 6 }} />
          Backend Engineer Intern
        </p>
        <p className="sc-job-sub sc-muted">Posted by an alumnus</p>
        <div className="sc-job-row">
          <div className="sc-chips">
            <span className="sc-chip">Internship</span>
            <span className="sc-chip">Hybrid</span>
            <span className="sc-pill ref-pill">Referral available</span>
          </div>
          <span className="sc-apply apply-btn">
            <span className="sc-apply-label apply-label">Apply</span>
            <span className="sc-apply-done applied-label">
              <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true">
                <path className="check-path" d="M2.5 6.2L5 8.5L9.5 3.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Applied
            </span>
            <span className="cursor sc-cursor" />
          </span>
        </div>
      </div>
      <div className="sc-card sc-job">
        <p className="sc-job-title">Product Design Intern</p>
        <p className="sc-job-sub sc-muted">Posted by an alumnus</p>
        <div className="sc-chips">
          <span className="sc-chip">Internship</span>
          <span className="sc-chip">Remote</span>
        </div>
      </div>
      <div className="sc-card sc-job">
        <p className="sc-job-title">Data Analyst</p>
        <p className="sc-job-sub sc-muted">Posted by an alumnus</p>
        <div className="sc-chips">
          <span className="sc-chip">Full-time</span>
          <span className="sc-chip">Hybrid</span>
        </div>
      </div>
      <div className="toast sc-toast">
        <span className="sc-toast-dot" />
        Referral requested
      </div>
    </div>
  );
}

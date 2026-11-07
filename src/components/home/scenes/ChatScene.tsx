import React from 'react';
import './scenes.css';

export default function ChatScene() {
  return (
    <div className="fs-scenes sc-chat sc-card sc-loop" aria-hidden="true">
      <div className="sc-chat-header">
        <span className="sc-chat-title">Class of 2019</span>
        <div className="sc-avatars">
          <span className="sc-avatar" style={{ borderColor: 'var(--sc-ring-orange)' }}>A</span>
          <span className="sc-avatar" style={{ borderColor: 'var(--sc-ring-green)' }}>M</span>
          <span className="sc-avatar" style={{ borderColor: 'var(--sc-ring-purple)' }}>R</span>
        </div>
      </div>
      <div className="sc-chat-body">
        <div className="sc-bubble sc-bubble--in m1">Anyone hiring backend interns?</div>
        <div className="sc-bubble sc-bubble--out m2">Our team is. Sending you the link.</div>
        <div className="sc-bubble sc-bubble--in m3" style={{ padding: 0 }}>
          <span className="sc-typing">
            <span className="sc-dot" />
            <span className="sc-dot" />
            <span className="sc-dot" />
          </span>
        </div>
        <div className="sc-bubble sc-bubble--in m4">Thanks, applying now!</div>
        <span className="sc-read read">Read</span>
      </div>
    </div>
  );
}

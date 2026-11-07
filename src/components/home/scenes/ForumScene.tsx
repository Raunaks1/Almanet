import React from 'react';
import { Heart, MessageCircle } from 'lucide-react';
import './scenes.css';

export default function ForumScene() {
  return (
    <div className="fs-scenes sc-forum sc-loop" aria-hidden="true">
      <div className="sc-card sc-post post">
        <div className="sc-post-head">
          <span className="sc-avatar" style={{ borderColor: 'var(--sc-ring-green)' }}>M</span>
          <div className="sc-post-meta">
            <span className="sc-post-name">Meera</span>
            <span className="sc-post-sub sc-muted">Class of 2018 · Mechanical</span>
          </div>
        </div>
        <p className="sc-post-text">Anyone attending the alumni meet this Saturday?</p>
        <div className="sc-actions">
          <span className="sc-action">
            <MessageCircle size={15} strokeWidth={1.75} />
            <span className="sc-count-swap">
              <span className="rep3">3</span>
              <span className="rep4">4</span>
            </span>
          </span>
          <span className="sc-action">
            <span className="heart">
              <Heart size={15} strokeWidth={1.75} />
            </span>
            <span className="sc-count-swap">
              <span className="like12">12</span>
              <span className="like13">13</span>
            </span>
          </span>
        </div>
      </div>
      <div className="sc-card sc-reply reply">
        <b>Rohan:</b> <span className="sc-muted">See you there!</span>
      </div>
      <div className="sc-card sc-post post2" style={{ padding: '10px 14px' }}>
        <div className="sc-post-head" style={{ marginBottom: 4 }}>
          <span className="sc-avatar" style={{ borderColor: 'var(--sc-ring-yellow)', width: 22, height: 22, fontSize: 10 }}>S</span>
          <span className="sc-post-name" style={{ fontSize: 12 }}>Sana</span>
          <span className="sc-post-sub sc-muted">· Class of 2020</span>
        </div>
        <p className="sc-post-text" style={{ margin: 0, fontSize: 12 }}>Sharing photos from last year’s meetup.</p>
      </div>
    </div>
  );
}

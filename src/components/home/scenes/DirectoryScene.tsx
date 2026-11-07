import React from 'react';
import { Search } from 'lucide-react';
import './scenes.css';

const alumni = [
  { name: 'Aarav', meta: 'CS · 2021', skill: 'React', ring: 'var(--sc-ring-blue)', dim: false },
  { name: 'Meera', meta: 'ECE · 2020', skill: 'VLSI', ring: 'var(--sc-ring-green)', dim: true },
  { name: 'Rohan', meta: 'IT · 2022', skill: 'React Native', ring: 'var(--sc-ring-orange)', dim: false, ringCard: true, msg: true },
  { name: 'Sana', meta: 'ME · 2019', skill: 'CAD', ring: 'var(--sc-ring-purple)', dim: true },
];

export default function DirectoryScene() {
  return (
    <div className="fs-scenes sc-dir sc-loop" aria-hidden="true">
      <div className="sc-search">
        <Search size={14} strokeWidth={1.75} className="sc-muted" />
        <span className="ph sc-muted">Search alumni</span>
        <span className="type sc-type-wrap">react</span>
        <span className="sc-caret" />
      </div>
      <div className="sc-filter-row">
        <span className="sc-filter chip-ind">Industry</span>
        <span className="sc-filter">Graduation year</span>
        <span className="sc-count sc-muted">
          <span className="c4">4 alumni</span>
          <span className="c2">2 alumni</span>
        </span>
      </div>
      <div className="sc-grid">
        {alumni.map((a) => (
          <div
            key={a.name}
            className={`sc-card sc-alum${a.dim ? ' dim' : ''}${a.ringCard ? ' ring-card' : ''}`}
          >
            <div className="sc-alum-top">
              <span className="sc-avatar" style={{ borderColor: a.ring }}>{a.name[0]}</span>
              <div>
                <div className="sc-alum-name">{a.name}</div>
              </div>
            </div>
            <p className="sc-alum-meta sc-muted">{a.meta}</p>
            <span className="sc-chip">{a.skill}</span>
            {a.msg && <div className="sc-msg msg">Message</div>}
          </div>
        ))}
      </div>
    </div>
  );
}

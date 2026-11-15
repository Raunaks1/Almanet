/**
 * PDF export for the structured resume model.
 *
 * Renders the parsed ResumeData into a clean, ATS-friendly A4 document using
 * jsPDF's text layout (no canvas, no html2canvas). Runs entirely in the
 * browser; the resume text never leaves the device.
 */

import { jsPDF } from 'jspdf';
import type { ResumeData } from './resumeModel';

const MARGIN = 48;
const PAGE_WIDTH = 595.28; // A4, points
const PAGE_HEIGHT = 841.89;

type FontStyle = 'normal' | 'bold' | 'italic';

export function exportResumePdf(data: ResumeData): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const maxWidth = PAGE_WIDTH - MARGIN * 2;
  let y = MARGIN;

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_HEIGHT - MARGIN) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const write = (
    text: string,
    size: number,
    style: FontStyle = 'normal',
    lineHeight = size * 1.4,
    gapAfter = 0,
  ) => {
    if (!text) return;
    doc.setFontSize(size);
    doc.setFont('helvetica', style);
    const lines = doc.splitTextToSize(text, maxWidth) as string[];
    for (const line of lines) {
      ensureSpace(lineHeight);
      doc.text(line, MARGIN, y);
      y += lineHeight;
    }
    if (gapAfter > 0) y += gapAfter;
  };

  const sectionHeading = (title: string) => {
    ensureSpace(40);
    y += 8;
    doc.setFontSize(10.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(40, 40, 40);
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 5;
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.75);
    doc.line(MARGIN, y, PAGE_WIDTH - MARGIN, y);
    y += 12;
  };

  const writeBullets = (bullets: string[]) => {
    for (const raw of bullets) {
      const bullet = raw.trim();
      if (!bullet) continue;
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'normal');
      const lines = doc.splitTextToSize(bullet, maxWidth - 14) as string[];
      ensureSpace(lines.length * 14);
      doc.text('•', MARGIN + 2, y);
      for (const line of lines) {
        ensureSpace(14);
        doc.text(line, MARGIN + 14, y);
        y += 14;
      }
      y += 2;
    }
  };

  const writeEntryHeader = (title: string, subtitle: string, dates: string) => {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(title, maxWidth - 90) as string[];
    ensureSpace(titleLines.length * 15);
    for (const line of titleLines) {
      ensureSpace(15);
      doc.text(line, MARGIN, y);
      y += 15;
    }
    if (dates) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(110, 110, 110);
      doc.text(dates, PAGE_WIDTH - MARGIN, y - 15, { align: 'right' });
      doc.setTextColor(20, 20, 20);
    }
    if (subtitle) write(subtitle, 10.5, 'italic', 14);
  };

  // ── Header ──
  doc.setTextColor(20, 20, 20);
  write(data.name || 'Your Name', 20, 'bold', 24, 2);
  if (data.headline) write(data.headline, 12, 'normal', 16, 2);
  if (data.contact.length > 0) {
    doc.setTextColor(90, 90, 90);
    write(data.contact.join('  •  '), 9.5, 'normal', 13, 4);
    doc.setTextColor(20, 20, 20);
  }

  // ── Summary ──
  if (data.summary) {
    sectionHeading('Summary');
    write(data.summary, 10.5, 'normal', 15, 4);
  }

  // ── Experience ──
  if (data.experience.length > 0) {
    sectionHeading('Experience');
    for (const e of data.experience) {
      writeEntryHeader(
        e.title,
        [e.company, e.location, e.employmentType].filter(Boolean).join('  ·  '),
        [e.startDate, e.endDate].filter(Boolean).join(' — '),
      );
      if (e.techStack.length > 0) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(90, 90, 90);
        const techLines = doc.splitTextToSize(e.techStack.join('  ·  '), maxWidth) as string[];
        for (const line of techLines) {
          ensureSpace(13);
          doc.text(line, MARGIN, y);
          y += 13;
        }
        doc.setTextColor(20, 20, 20);
      }
      writeBullets(e.bullets);
      y += 8;
    }
  }

  // ── Projects ──
  if (data.projects.length > 0) {
    sectionHeading('Projects');
    for (const p of data.projects) {
      writeEntryHeader(p.title, '', '');
      if (p.techStack.length > 0) {
        doc.setFontSize(9.5);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(90, 90, 90);
        const techLines = doc.splitTextToSize(p.techStack.join('  ·  '), maxWidth) as string[];
        for (const line of techLines) {
          ensureSpace(13);
          doc.text(line, MARGIN, y);
          y += 13;
        }
        doc.setTextColor(20, 20, 20);
      }
      writeBullets(p.bullets);
      y += 8;
    }
  }

  // ── Education ──
  if (data.education.length > 0) {
    sectionHeading('Education');
    for (const e of data.education) {
      writeEntryHeader(e.school, e.degree, e.dates);
      writeBullets(e.details);
      y += 8;
    }
  }

  // ── Skills ──
  if (data.skills.length > 0) {
    sectionHeading('Skills');
    write(data.skills.join('  ·  '), 10.5, 'normal', 15, 4);
  }

  // ── Certifications ──
  if (data.certifications.length > 0) {
    sectionHeading('Certifications');
    for (const c of data.certifications) {
      write(`•  ${c}`, 10.5, 'normal', 15, 2);
    }
  }

  const fileName =
    (data.name || 'resume')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'resume';

  doc.save(`${fileName}.pdf`);
}

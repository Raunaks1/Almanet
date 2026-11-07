// Minimal projection math matching src/components/ui/testimonial-globe.tsx
// so SVG overlays stay glued to the same cobe sphere.

export type Vec3 = [number, number, number];

export const GLOBE_RADIUS = 0.8;
export const THETA = 0.3;

export function toCartesian(lat: number, lng: number): Vec3 {
  const la = (lat * Math.PI) / 180;
  const lo = (lng * Math.PI) / 180 - Math.PI;
  const c = Math.cos(la);
  return [-c * Math.cos(lo), Math.sin(la), c * Math.sin(lo)];
}

export function project([x, y, z]: Vec3, phi: number, theta: number, altitude = 0) {
  const cp = Math.cos(phi);
  const sp = Math.sin(phi);
  const ct = Math.cos(theta);
  const st = Math.sin(theta);
  const radius = GLOBE_RADIUS * (1 + altitude);
  const sx = (cp * x + sp * z) * radius;
  const sy = (sp * st * x + ct * y - cp * st * z) * radius;
  const depth = -sp * ct * x + st * y + cp * ct * z;
  return { x: (sx + 1) / 2, y: (1 - sy) / 2, depth };
}

// Great-circle arc points projected to screen space for the current phi.
export function arcPath(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  phi: number,
  size: number,
  steps = 48,
): { d: string; visible: boolean } {
  const a = toCartesian(from.lat, from.lng);
  const b = toCartesian(to.lat, to.lng);
  const dot = Math.min(1, Math.max(-1, a[0] * b[0] + a[1] * b[1] + a[2] * b[2]));
  const omega = Math.acos(dot);
  const pts: { x: number; y: number; depth: number }[] = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const s0 = omega < 1e-4 ? 1 - t : Math.sin((1 - t) * omega) / Math.sin(omega);
    const s1 = omega < 1e-4 ? t : Math.sin(t * omega) / Math.sin(omega);
    const v: Vec3 = [s0 * a[0] + s1 * b[0], s0 * a[1] + s1 * b[1], s0 * a[2] + s1 * b[2]];
    const p = project(v, phi, THETA, 0.03);
    pts.push({ x: p.x * size, y: p.y * size, depth: p.depth });
  }
  let d = "";
  let pen = false;
  let anyFront = false;
  for (const p of pts) {
    const front = p.depth > -0.05;
    if (front) anyFront = true;
    if (front) {
      d += `${pen ? "L" : "M"}${p.x.toFixed(1)} ${p.y.toFixed(1)} `;
      pen = true;
    } else {
      pen = false;
    }
  }
  return { d: d.trim(), visible: anyFront };
}

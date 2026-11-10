// The creatures and the trainer, drawn in code: feet at 0,0, facing +x, ink outline, warm light top-left.

import { clamp, bz } from './game/rules';
import { SPECIES } from './game/data';
import type { Loose } from './game/types';
import { ctx, setCtx, INK, GOLD, CYAN, B, fs, el, lg, rg, eye, tube, leg, flame } from './screen';

export const DRAW: Record<string, (t: number, o: Loose) => void> = {
  chispin(t: number) {
    const w = Math.sin(t * 11) * 4;
    flame(-22, -30, -52, -96, 9, ['#fff3a0', '#ffb030', '#e2452a'], w);
    flame(-24, -34, -44, -78, 4, ['#fffbe0', '#ffd860', '#ff9a3a'], w * 0.6);
    leg(-17, -14, 9, 15, '#b8401c'); leg(-5, -14, 9, 15, '#b8401c');
    B(); el(0, -27, 29, 17); fs(rg(0, -27, 32, '#ffa060', '#cf4720'));
    B(); el(17, -24, 10, 11); fs('#ffe8c8', 0);
    leg(11, -14, 9, 15, '#e0592a'); leg(23, -14, 9, 15, '#e0592a');
    B(); ctx.moveTo(14, -60); ctx.lineTo(7, -90); ctx.lineTo(28, -66); ctx.closePath(); fs('#e8642c');
    B(); ctx.moveTo(14, -64); ctx.lineTo(11, -80); ctx.lineTo(22, -66); ctx.closePath(); fs('#6a221a', 0);
    B(); ctx.moveTo(31, -66); ctx.lineTo(42, -94); ctx.lineTo(46, -61); ctx.closePath(); fs('#e8642c');
    B(); el(29, -50, 20, 16); fs(rg(29, -50, 22, '#ffb070', '#d4501f'));
    B(); el(46, -45, 10, 6.5); fs('#ffe8c8');
    B(); el(54, -47, 3.2, 2.6); fs(INK, 0);
    eye(34, -55, 4.2);
    B(); ctx.moveTo(22, -46); ctx.lineTo(16, -42); ctx.lineTo(23, -41); fs('#ffd860', 1.5);
  },
  fogaral(t: number) {
    const w = Math.sin(t * 10) * 5;
    flame(-36, -58, -96, -138, 13, ['#fff3a0', '#ffb030', '#d8381e'], w);
    flame(-34, -52, -78, -112, 9, ['#fff3a0', '#ff9a30', '#c83a1e'], -w);
    flame(-36, -56, -66, -100, 5, ['#fffbe0', '#ffe070', '#ffa040'], w * 0.5);
    leg(-28, -36, 11, 36, '#a6381a'); leg(-13, -36, 11, 36, '#a6381a');
    B(); el(0, -54, 44, 23); fs(rg(0, -54, 46, '#ff9a55', '#c4401c'));
    B(); el(24, -48, 14, 15); fs('#ffe8c8', 0);
    leg(20, -36, 11, 36, '#d4501f'); leg(35, -36, 11, 36, '#d4501f');
    for (let k = 0; k < 6; k++) { const a = -2.6 + k * 0.42; flame(32 + Math.cos(a) * 12, -74 + Math.sin(a) * 10, 32 + Math.cos(a) * 34, -74 + Math.sin(a) * 30 - 8, 6, ['#fff3a0', '#ffa030', '#d8381e'], Math.sin(t * 9 + k) * 3); }
    B(); ctx.moveTo(38, -96); ctx.lineTo(30, -134); ctx.lineTo(52, -102); ctx.closePath(); fs('#e8642c');
    B(); ctx.moveTo(52, -100); ctx.lineTo(64, -136); ctx.lineTo(66, -96); ctx.closePath(); fs('#e8642c');
    B(); el(50, -88, 22, 17); fs(rg(50, -88, 24, '#ffb070', '#cc4a1e'));
    B(); el(70, -82, 13, 8); fs('#ffe8c8');
    B(); el(81, -84, 3.6, 3); fs(INK, 0);
    eye(56, -93, 4.6);
    B(); ctx.moveTo(44, -86); ctx.lineTo(36, -80); ctx.lineTo(46, -79); fs('#ffd860', 1.5);
  },
  retoni(t: number) {
    const sw = Math.sin(t * 3) * 0.12;
    B(); el(-12, -3, 11, 5); fs('#3f7a2a', 2.5); B(); el(14, -3, 11, 5); fs('#3f7a2a', 2.5);
    B(); ctx.moveTo(-28, -40); ctx.quadraticCurveTo(-56, -52, -54, -66); ctx.quadraticCurveTo(-38, -60, -24, -48); ctx.closePath(); fs('#5fae3c');
    B(); ctx.moveTo(-30, -10); ctx.bezierCurveTo(-36, -50, -12, -64, 4, -64); ctx.bezierCurveTo(22, -64, 38, -48, 33, -10); ctx.bezierCurveTo(28, 0, -26, 0, -30, -10); fs(rg(2, -34, 40, '#a8e870', '#4a9030'));
    B(); el(7, -20, 17, 13); fs('#dcf6b4', 0);
    B(); ctx.moveTo(30, -42); ctx.quadraticCurveTo(54, -50, 56, -66); ctx.quadraticCurveTo(40, -62, 28, -50); ctx.closePath(); fs('#5fae3c');
    tube(() => { ctx.moveTo(4, -62); ctx.quadraticCurveTo(0, -74, 4, -84); }, 4, '#4f9a35');
    ctx.save(); ctx.translate(4, -84); ctx.rotate(sw);
    B(); el(-10, -4, 12, 6, -0.5); fs('#7ccf4f'); B(); el(10, -6, 12, 6, 0.5); fs('#8fdc5c'); ctx.restore();
    eye(11, -38, 4.6); eye(25, -37, 4.6);
    B(); ctx.arc(18, -30, 4, 0.2, Math.PI - 0.2); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
    B(); el(5, -30, 4, 2.4); fs('rgba(255,120,140,0.6)', 0); B(); el(31, -30, 3.4, 2.2); fs('rgba(255,120,140,0.6)', 0);
  },
  frondalce(t: number) {
    const sw = Math.sin(t * 2) * 0.06;
    leg(-28, -44, 8, 44, '#5a3e26'); leg(-15, -44, 8, 44, '#5a3e26');
    B(); ctx.moveTo(-40, -60); ctx.quadraticCurveTo(-58, -66, -56, -78); ctx.quadraticCurveTo(-46, -70, -36, -66); fs('#5fae3c');
    B(); el(0, -58, 42, 20); fs(rg(0, -58, 44, '#b08a5a', '#6a4a2c'));
    for (let i = 0; i < 6; i++) { B(); el(-30 + i * 11, -74 + Math.abs(i - 2.5) * 1.5, 9, 6.5); fs(i % 2 ? '#6fbe46' : '#5fae3c', 2); }
    B(); el(14, -52, 14, 9); fs('#e8dcc0', 0);
    leg(22, -44, 8, 44, '#6a4a2c'); leg(35, -44, 8, 44, '#6a4a2c');
    B(); ctx.moveTo(24, -66); ctx.lineTo(34, -104); ctx.lineTo(48, -100); ctx.lineTo(40, -62); ctx.closePath(); fs('#8a6a43');
    ctx.save(); ctx.translate(44, -110); ctx.rotate(sw);
    tube(() => { ctx.moveTo(-4, -8); ctx.lineTo(-14, -40); ctx.moveTo(-10, -26); ctx.lineTo(-26, -38); ctx.moveTo(4, -8); ctx.lineTo(14, -42); ctx.moveTo(10, -28); ctx.lineTo(28, -38); }, 4, '#7a5636');
    for (const [lx, ly] of [[-14, -44], [-28, -40], [14, -46], [30, -40], [-4, -34]]) { B(); el(lx, ly, 8, 5, lx * 0.03); fs('#7ccf4f', 2); }
    ctx.restore();
    B(); ctx.moveTo(34, -114); ctx.quadraticCurveTo(24, -126, 22, -112); ctx.closePath(); fs('#5fae3c', 2);
    B(); el(48, -108, 16, 12, 0.15); fs(rg(48, -108, 18, '#c49a66', '#7a5636'));
    B(); el(64, -102, 8, 6); fs('#e8dcc0'); B(); el(70, -103, 2.6, 2.2); fs(INK, 0);
    eye(52, -112, 3.6);
  },
  gotin(t: number) {
    const w = Math.sin(t * 5) * 4;
    B(); ctx.moveTo(-26, -24); ctx.quadraticCurveTo(-52, -42 + w, -70, -32 + w); ctx.quadraticCurveTo(-52, -14 + w * 0.5, -26, -14); ctx.closePath(); fs(lg(-70, 0, -26, 0, ['#9cd8ff', '#2f78c4']));
    for (const lx of [-16, -4, 14, 26]) { B(); el(lx, -4, 6, 4); fs('#2f78c4', 2); }
    B(); el(0, -20, 32, 14); fs(rg(0, -22, 34, '#7cc8ff', '#2a6cbc'));
    B(); el(6, -12, 22, 5); fs('#c8ecff', 0);
    for (let i = 0; i < 3; i++) { B(); el(20 - i * 5, -48 + i * 4, 11, 4, -0.9 + i * 0.4 + Math.sin(t * 4 + i) * 0.1); fs('#ff8fb8', 2); }
    B(); el(32, -28, 19, 15); fs(rg(32, -30, 21, '#88d4ff', '#2f7ccc'));
    eye(40, -31, 3.4);
    B(); ctx.arc(42, -23, 5, 0.1, Math.PI - 0.6); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
  },
  mareon(t: number) {
    const sw = Math.sin(t * 2.2) * 5;
    B(); ctx.moveTo(-44, -14); ctx.quadraticCurveTo(-72, -30 + sw, -80, -16 + sw); ctx.quadraticCurveTo(-66, -2, -44, -6); ctx.closePath(); fs('#9cd8ff');
    tube(() => { ctx.moveTo(-44, -10); ctx.bezierCurveTo(-24, 6, 22, 4, 26, -16); }, 22, '#2f78c4');
    const path = () => { ctx.moveTo(24, -14); ctx.bezierCurveTo(44, -44, -8, -64, 8 + sw, -96); };
    for (let i = 0; i < 6; i++) {
      const u = 0.1 + i * 0.15, x = bz(24, 44, -8, 8 + sw, u), y = bz(-14, -44, -64, -96, u);
      B(); ctx.moveTo(x - 10, y + 4); ctx.lineTo(x - 30, y - 6); ctx.lineTo(x - 8, y - 10); ctx.closePath(); fs('#bfe8ff', 2);
    }
    tube(path, 26, '#2f78c4');
    B(); path(); ctx.lineWidth = 8; ctx.strokeStyle = '#9fd8ff'; ctx.stroke();
    for (let i = 0; i < 3; i++) { B(); el(4 + sw - i * 6, -118 + i * 2, 12, 4, -1.1 + i * 0.4); fs('#ff8fb8', 2); }
    B(); el(16 + sw, -104, 21, 16, 0.1); fs(rg(16 + sw, -106, 22, '#88d4ff', '#2a6cbc'));
    B(); el(32 + sw, -98, 10, 6); fs('#c8ecff', 2);
    eye(22 + sw, -108, 4.4);
  },
  musgorro(t: number) {
    const br = Math.sin(t * 2) * 1.5;
    B(); el(-22, -3, 9, 5); fs('#4a3a2c', 2.5); B(); el(20, -3, 9, 5); fs('#4a3a2c', 2.5);
    B(); ctx.moveTo(-44, -6); ctx.bezierCurveTo(-48, -52 - br, 30, -64 - br, 42, -12); ctx.closePath(); fs(rg(-4, -30, 46, '#a39e86', '#4c473a'));
    for (let i = 0; i < 7; i++) { const a = Math.PI + 0.35 + i * 0.4, x = Math.cos(a) * 36 - 3, y = -14 + Math.sin(a) * 38 - br; B(); el(x, y, 9, 7, a); fs(i % 2 ? '#78b84a' : '#5fa03a', 2); }
    B(); el(-16, -24, 6, 5); fs('#b9b2a2', 2); B(); el(4, -34, 5, 4); fs('#c7c0b0', 2);
    B(); ctx.moveTo(30, -26); ctx.quadraticCurveTo(56, -18, 44, -8); ctx.lineTo(28, -8); ctx.closePath(); fs('#c9b896');
    B(); el(50, -16, 3.4, 3.4); fs(INK, 0);
    eye(31, -22, 3.2);
  },
  charquillo(t: number) {
    const pf = (Math.sin(t * 4) + 1) * 2;
    B(); el(-18, -15, 18, 12, -0.3); fs('#2b8f8f'); B(); el(-6, -3, 15, 4); fs('#237777', 2.5);
    B(); ctx.moveTo(-30, -8); ctx.bezierCurveTo(-34, -42, 32, -48, 40, -16); ctx.bezierCurveTo(42, -4, -20, -2, -30, -8); fs(rg(2, -26, 40, '#6ee0cc', '#1f7f86'));
    B(); el(29, -12, 8 + pf, 6 + pf * 0.6); fs('#e6fff2', 2);
    leg(22, -14, 7, 14, '#2b8f8f');
    for (const [ex, ey] of [[7, -38], [25, -41]]) { B(); el(ex, ey, 9, 9); fs('#4fcab8'); eye(ex + 2, ey - 1, 4.2); }
    B(); el(-10, -28, 4, 3); fs('#176a70', 0); B(); el(2, -20, 3, 2); fs('#176a70', 0); B(); el(-20, -18, 3, 2); fs('#176a70', 0);
    B(); ctx.moveTo(18, -24); ctx.quadraticCurveTo(30, -18, 40, -22); ctx.lineWidth = 2; ctx.strokeStyle = INK; ctx.stroke();
  },
  ascuervo(t: number) {
    const fl = Math.sin(t * 9), by = -46 + Math.sin(t * 3) * 4;
    ctx.save(); ctx.translate(0, by);
    B(); ctx.moveTo(-6, -24); ctx.quadraticCurveTo(-36, -58 - fl * 12, -62, -48 - fl * 18); ctx.lineTo(-50, -40 - fl * 12); ctx.lineTo(-56, -32 - fl * 8); ctx.lineTo(-40, -30 - fl * 5); ctx.lineTo(-42, -20); ctx.closePath(); fs('#2a2232');
    for (const [a, l] of [[-0.2, 30], [0.1, 34], [0.4, 28]]) {
      B(); ctx.moveTo(-18, -14); ctx.lineTo(-18 - Math.cos(a) * l, -10 + Math.sin(a) * l * 0.6 - 6); ctx.lineTo(-14 - Math.cos(a) * l, -6 + Math.sin(a) * l * 0.6); ctx.closePath(); fs('#3a3046', 2);
      B(); el(-18 - Math.cos(a) * l, -8 + Math.sin(a) * l * 0.6 - 3, 5, 3, a); fs('#ff7a3a', 0);
    }
    B(); ctx.moveTo(-22, -14); ctx.bezierCurveTo(-20, -42, 18, -46, 26, -28); ctx.bezierCurveTo(28, -10, 0, 0, -22, -14); fs(rg(0, -26, 30, '#544a60', '#1c1724'));
    B(); el(10, -20, 9, 8); fs(rg(10, -22, 10, '#ffd070', '#ff6a2a'), 0);
    B(); ctx.moveTo(4, -6); ctx.lineTo(2, 4); ctx.moveTo(12, -6); ctx.lineTo(14, 4); ctx.lineWidth = 3; ctx.strokeStyle = GOLD; ctx.stroke();
    flame(20, -40, 14, -60, 4, ['#fff3a0', '#ff9a30', '#d8381e'], Math.sin(t * 12) * 3);
    B(); el(24, -34, 13, 11); fs(rg(24, -36, 14, '#5a5066', '#1c1724'));
    B(); ctx.moveTo(34, -37); ctx.lineTo(52, -32); ctx.lineTo(34, -27); ctx.closePath(); fs(GOLD, 2.5);
    B(); el(28, -37, 3.6, 3.6); fs('#ffb030', 0); B(); el(29, -38, 1.4, 1.4); fs('#fff', 0);
    B(); ctx.moveTo(-2, -26); ctx.quadraticCurveTo(-22, -70 - fl * 14, -2, -82 - fl * 20); ctx.lineTo(4, -66 - fl * 14); ctx.lineTo(10, -70 - fl * 14); ctx.lineTo(12, -54 - fl * 8); ctx.lineTo(18, -54 - fl * 6); ctx.lineTo(12, -30); ctx.closePath(); fs('#3a3046');
    B(); el(-2, -82 - fl * 20, 4, 3); fs('#ff7a3a', 0); B(); el(8, -68 - fl * 14, 3.5, 2.5); fs('#ff7a3a', 0);
    ctx.restore();
  },
  zarzalma(t: number) {
    const sw = Math.sin(t * 2.5) * 5;
    const P0: [number, number] = [-34, -6], P1: [number, number] = [8, 10], P2: [number, number] = [32, -8], P3: [number, number] = [10, -40];
    const Q1: [number, number] = [-12, -64], Q2: [number, number] = [-6, -84], Q3: [number, number] = [14 + sw, -100];
    const path = () => { ctx.moveTo(...P0); ctx.bezierCurveTo(...P1, ...P2, ...P3); ctx.bezierCurveTo(...Q1, ...Q2, ...Q3); };
    tube(path, 17, '#2f6b3a');
    B(); path(); ctx.lineWidth = 5; ctx.strokeStyle = '#4f9a4a'; ctx.stroke();
    for (let i = 1; i < 12; i++) {
      const u = i / 12, seg = u < 0.5 ? 0 : 1, v = seg ? (u - 0.5) * 2 : u * 2;
      const pts = seg ? [P3, Q1, Q2, Q3] : [P0, P1, P2, P3];
      const x = bz(pts[0][0], pts[1][0], pts[2][0], pts[3][0], v), y = bz(pts[0][1], pts[1][1], pts[2][1], pts[3][1], v);
      const s = i % 2 ? 1 : -1;
      B(); ctx.moveTo(x - 3, y); ctx.lineTo(x + s * 12, y - 6); ctx.lineTo(x + 3, y - 3); ctx.closePath(); fs('#e6edc0', 1.5);
    }
    B(); el(-14, -52, 12, 5, -0.6); fs('#5fae3c', 2); B(); el(24, -22, 11, 5, 0.6); fs('#6fbe46', 2);
    const cx = 14 + sw, cy = -106;
    for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3 + 0.3 + Math.sin(t * 3) * 0.05; B(); el(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15, 13, 7, a); fs(rg(cx + Math.cos(a) * 15, cy + Math.sin(a) * 15, 14, '#ff8fc0', '#b0246a'), 2.5); }
    B(); el(cx, cy, 11, 10); fs('#f6d36b');
    eye(cx + 3, cy - 2, 3.2);
    B(); ctx.moveTo(cx + 2, cy + 5); ctx.lineTo(cx + 10, cy + 4); ctx.lineTo(cx + 7, cy + 9); ctx.closePath(); fs('#fff', 1.5);
  },
  golem(t: number, o: Loose) {
    const ph2 = o.phase === 2, br = Math.sin(t * 1.5) * 3;
    const core = ph2 ? '#5ff2ff' : '#ffb030';
    tube(() => { ctx.moveTo(-40, -70); ctx.quadraticCurveTo(-64, -30, -92, 0); ctx.moveTo(28, -70); ctx.quadraticCurveTo(44, -30, 76, 0); ctx.moveTo(-6, -60); ctx.quadraticCurveTo(-10, -24, 4, 0); }, 15, '#5a3e2a');
    tube(() => { ctx.moveTo(-58, -176 + br); ctx.bezierCurveTo(-110, -170, -120, -120, -104, -78); ctx.moveTo(-50, -166 + br); ctx.bezierCurveTo(-96, -150, -96, -112, -90, -80); }, 11, '#6a4a30');
    for (const [cx, cy, a] of [[-104, -76, 0.4], [-92, -78, -0.3]]) { B(); ctx.moveTo(cx, cy); ctx.lineTo(cx - 12 + a * 10, cy + 22); ctx.lineTo(cx + 4, cy + 6); ctx.closePath(); fs('#4a3020', 2); }
    B();
    const pts = [[-72, -186], [-22, -214], [50, -200], [82, -150], [62, -78], [-48, -66], [-82, -120]];
    pts.forEach(([x, y], i) => (i ? ctx.lineTo(x, y + br) : ctx.moveTo(x, y + br))); ctx.closePath();
    fs(lg(-80, -210, 80, -70, ['#a29c88', '#6e6a5c', '#3e3c34']), 4);
    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(27,20,38,0.7)';
    B(); ctx.moveTo(-40, -180 + br); ctx.lineTo(-24, -150 + br); ctx.lineTo(-38, -120 + br); ctx.moveTo(40, -170 + br); ctx.lineTo(28, -130 + br); ctx.lineTo(44, -100 + br); ctx.stroke();
    if (ph2) {
      ctx.save(); ctx.shadowColor = CYAN; ctx.shadowBlur = 12; ctx.lineWidth = 4; ctx.strokeStyle = '#7ff6ff';
      B(); ctx.moveTo(-70, -150 + br); ctx.bezierCurveTo(-40, -140 + br, -30, -100 + br, 0, -110 + br); ctx.bezierCurveTo(30, -120 + br, 50, -90 + br, 70, -100 + br); ctx.stroke(); ctx.restore();
    }
    const pulse = 1 + Math.sin(t * 4) * 0.12;
    ctx.save(); ctx.shadowColor = core; ctx.shadowBlur = 24;
    B(); ctx.moveTo(4, -164 + br); ctx.lineTo(22 * pulse, -140 + br); ctx.lineTo(4, -114 + br); ctx.lineTo(-14 * pulse, -140 + br); ctx.closePath(); fs(core, 3); ctx.restore();
    for (let i = 0; i < 6; i++) { B(); el(-60 + i * 14, -192 + Math.abs(i - 2.5) * 3 + br, 11, 8); fs(i % 2 ? '#6fae46' : '#5a9a3a', 2); }
    B(); ctx.moveTo(56, -190 + br); ctx.lineTo(96, -176 + br); ctx.lineTo(108, -118 + br); ctx.lineTo(74, -110 + br); ctx.closePath(); fs('#8a8574', 3.5);
    B(); el(116, -92 + br, 36, 32, 0.2); fs(rg(116, -96 + br, 38, '#b0aa94', '#585446'), 4);
    ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(27,20,38,0.7)';
    B(); ctx.moveTo(128, -116 + br); ctx.lineTo(136, -96 + br); ctx.moveTo(140, -104 + br); ctx.lineTo(146, -86 + br); ctx.stroke();
    B(); ctx.moveTo(-24, -244 + br); ctx.lineTo(28, -240 + br); ctx.lineTo(32, -208 + br); ctx.lineTo(-26, -206 + br); ctx.closePath(); fs('#8f8a78', 3.5);
    ctx.save(); ctx.shadowColor = core; ctx.shadowBlur = 14;
    B(); el(4, -226 + br, 6, 3.5, 0.1); fs(core, 0); B(); el(22, -225 + br, 6, 3.5, -0.1); fs(core, 0); ctx.restore();
    tube(() => { ctx.moveTo(-14, -244 + br); ctx.quadraticCurveTo(-22, -262, -10, -270); }, 3, '#4f9a35');
    B(); el(-8, -272 + br, 9, 5, -0.4); fs('#7ccf4f', 2);
  },
  trainer(t: number, o: Loose) {
    const ph = o.walk || 0, st = Math.sin(ph) * 5, bob = Math.abs(Math.sin(ph)) * 2;
    leg(-6 + (o.walk ? st : 0), -20, 8, 20, '#3a2a30'); leg(5 - (o.walk ? st : 0), -20, 8, 20, '#3a2a30');
    ctx.save(); ctx.translate(0, -bob);
    B(); el(-14, -42, 9, 12, -0.3); fs('#b07a3a', 2); tube(() => { ctx.moveTo(-14, -52); ctx.lineTo(-6, -72); }, 2.5, '#7a5230');
    B(); ctx.moveTo(-16, -16); ctx.lineTo(-11, -54); ctx.quadraticCurveTo(0, -60, 11, -54); ctx.lineTo(16, -16); ctx.quadraticCurveTo(0, -12, -16, -16); fs(lg(0, -58, 0, -16, ['#3a7090', '#244a66']));
    B(); ctx.moveTo(-15, -18); ctx.quadraticCurveTo(0, -14, 15, -18); ctx.lineWidth = 3; ctx.strokeStyle = GOLD; ctx.stroke();
    B(); ctx.moveTo(-10, -54); ctx.quadraticCurveTo(0, -50, 12, -55); ctx.lineTo(14, -48); ctx.quadraticCurveTo(0, -44, -10, -48); ctx.closePath(); fs(GOLD, 2);
    B(); el(1, -66, 11, 11); fs('#f1c9a0');
    B(); ctx.moveTo(-11, -66); ctx.quadraticCurveTo(-10, -82, 4, -80); ctx.quadraticCurveTo(14, -79, 12, -68); ctx.quadraticCurveTo(4, -74, -4, -70); ctx.quadraticCurveTo(-8, -62, -11, -66); fs('#5a3420', 2);
    eye(6, -66, 1.8);
    if (o.play) {
      tube(() => { ctx.moveTo(4, -60); ctx.lineTo(32, -54); }, 4, '#d9b26a');
      leg(14, -58, 7, 12, '#f1c9a0');
    } else {
      leg(11, -46, 7, 18, '#2c5878');
    }
    ctx.restore();
  },
};
export const FIG_W = (sp: string): number => (SPECIES[sp] ? SPECIES[sp].w : 50);
export const FIG_H = (sp: string): number => (SPECIES[sp] ? SPECIES[sp].h : 84);

export const off = document.createElement('canvas'); off.width = 1024; off.height = 1024;
export const offCtx = off.getContext('2d')!;
export function silhouette(sp: string, x: number, y: number, s: number, face: number, col: string, alpha: number, o: Loose = {}) {
  offCtx.setTransform(1, 0, 0, 1, 0, 0); offCtx.clearRect(0, 0, 1024, 1024);
  const saved = ctx; setCtx(offCtx);
  ctx.save(); ctx.translate(512, 960); ctx.scale(2 * s * face, 2 * s); DRAW[sp](o.t || 0, o); ctx.restore();
  ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = col; ctx.fillRect(0, 0, 1024, 1024); ctx.globalCompositeOperation = 'source-over';
  setCtx(saved);
  ctx.save(); ctx.globalAlpha = clamp(alpha, 0, 1); ctx.drawImage(off, x - 256, y - 480, 512, 512); ctx.restore();
}
export function drawFigure(sp: string, x: number, y: number, s: number, face: number, o: Loose = {}) {
  ctx.save(); ctx.translate(x, y);
  if (!o.noShadow) { B(); el(0, 2, FIG_W(sp) * s * 0.5, 10 * s); ctx.fillStyle = 'rgba(8,6,18,0.45)'; ctx.fill(); }
  if (o.side) { B(); el(0, 2, FIG_W(sp) * s * 0.58, 14 * s); ctx.lineWidth = 3; ctx.strokeStyle = o.side === 'team' ? 'rgba(242,193,78,0.9)' : 'rgba(224,49,91,0.9)'; ctx.stroke(); }
  if (o.alpha != null) ctx.globalAlpha = clamp(o.alpha, 0, 1);
  if (o.rot) ctx.rotate(o.rot);
  ctx.scale(s * face, s);
  DRAW[sp](o.t || 0, o);
  ctx.restore();
  if (o.flash > 0) silhouette(sp, x, y, s, face, o.flashCol || '#fff', o.flash * (o.alpha == null ? 1 : o.alpha), o);
}


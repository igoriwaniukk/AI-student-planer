import { useEffect, useId, useRef } from 'react';
import { SUBJECT_ART } from '../lib/taskAuto';

// Hand-drawn animated icons for the focus ring — one per subject, so parts
// can really move (pages turn, bubbles rise, electrons orbit), which an
// emoji glyph can't. Idle loops run while studying, freeze while paused,
// and `finishing` plays the one-off finish animation (book closes, ✓, …).
// Keyframes live in index.css under the `sa-` prefix; reduced motion turns
// them all off.

const O = { stroke: '#2a2150', strokeWidth: 2.6, strokeLinejoin: 'round', strokeLinecap: 'round' };
const star = (x, y, s) => `M${x} ${y - s}l${s * 0.3} ${s * 0.7} ${s * 0.7} ${s * 0.3}-${s * 0.7} ${s * 0.3}-${s * 0.3} ${s * 0.7}-${s * 0.3}-${s * 0.7}-${s * 0.7}-${s * 0.3} ${s * 0.7}-${s * 0.3}z`;

function Sparks() {
  return (
    <>
      <path className="sa-spark" d={star(20, 30, 8)} fill="#fff" />
      <path className="sa-spark" d={star(99, 24, 6)} fill="#fff" style={{ animationDelay: '.42s' }} />
      <path className="sa-spark" d={star(105, 92, 6)} fill="#ffe8a3" style={{ animationDelay: '.5s' }} />
      <path className="sa-spark" d={star(15, 94, 6)} fill="#ffe8a3" style={{ animationDelay: '.58s' }} />
    </>
  );
}

function Book({ cover, spine }) {
  const page = 'M60 34 Q80 28 102 34 L102 88 Q80 82 60 88 Z';
  return (
    <>
      <g className="sa-book-open">
        <rect x="12" y="30" width="96" height="64" rx="7" fill={cover} {...O} />
        <path d="M60 34 Q40 28 18 34 L18 88 Q40 82 60 88 Z" fill="#fffaf0" {...O} />
        <path d={page} fill="#fffaf0" {...O} />
        <path d="M26 46h24M26 55h24M26 64h20M70 46h24M70 55h24M70 64h18" stroke="#c9c2e8" strokeWidth="3" strokeLinecap="round" />
        <path className="sa-page-flip" d={page} fill="#fffaf0" {...O} />
      </g>
      <g className="sa-book-shut">
        <rect x="36" y="26" width="50" height="70" rx="6" fill={cover} {...O} />
        <rect x="36" y="26" width="10" height="70" rx="4" fill={spine} {...O} />
        <path d="M54 44h22M54 52h16" stroke="rgba(255,255,255,.75)" strokeWidth="3" strokeLinecap="round" />
      </g>
      <Sparks />
    </>
  );
}

function Speech() {
  return (
    <>
      <text className="sa-word" x="74" y="22" fontSize="13" fontWeight="800" fill="#fff">hi</text>
      <text className="sa-word" x="18" y="20" fontSize="13" fontWeight="800" fill="#fff" style={{ animationDelay: '1.4s' }}>hello</text>
      <text className="sa-word" x="66" y="16" fontSize="13" fontWeight="800" fill="#fff" style={{ animationDelay: '2.8s' }}>cześć</text>
      <g className="sa-bubble">
        <path d="M34 30h52a18 18 0 0 1 18 18v12a18 18 0 0 1-18 18H56l-16 14v-14h-6a18 18 0 0 1-18-18V48a18 18 0 0 1 18-18z" fill="#fff" {...O} />
        <g className="sa-hide-on-done">
          {[44, 60, 76].map((cx, i) => <circle key={cx} className="sa-dot" cx={cx} cy="54" r="6" fill="#8b6dff" style={{ animationDelay: i * 0.2 + 's' }} />)}
        </g>
        <path className="sa-tick" d="M44 54l11 11 21-22" fill="none" stroke="#35d07f" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  );
}

function MathArt() {
  return (
    <>
      {[['+', 80, 42, 0], ['×', 92, 60, 1], ['÷', 78, 30, 2], ['−', 94, 36, 3]].map(([s, x, y, i]) => (
        <text key={s} className="sa-sym" x={x} y={y} fontSize="18" fontWeight="900" fill="#fff" style={{ animationDelay: i + 's' }}>{s}</text>
      ))}
      <g className="sa-ruler">
        <path d="M22 96V26l70 70z" fill="#ffd166" {...O} />
        <path d="M34 84V56l28 28z" fill="#a58cff" {...O} />
        <path d="M22 36h7M22 46h5M22 56h7M22 66h5M22 76h7M22 86h5" stroke="#2a2150" strokeWidth="2.4" strokeLinecap="round" />
      </g>
      <text className="sa-pop" x="72" y="40" fontSize="26" fontWeight="900" fill="#fff">=</text>
      <path className="sa-tick" d="M88 32l7 7 13-14" fill="none" stroke="#35d07f" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
    </>
  );
}

function Dna() {
  return (
    <>
      <g className="sa-helix">
        {[22, 33, 44, 55, 66, 77, 88, 99].map((y, i) => (
          <g key={y} className="sa-rung" style={{ animationDelay: -i * 0.3 + 's' }}>
            <line x1="38" y1={y} x2="82" y2={y} stroke="#fff" strokeWidth="3" />
            <circle cx="38" cy={y} r="6" fill="#ff7aac" {...O} />
            <circle cx="82" cy={y} r="6" fill="#2ee6c5" {...O} />
          </g>
        ))}
      </g>
      <Sparks />
    </>
  );
}

function Tube() {
  return (
    <>
      <g className="sa-tube">
        <path d="M46 20h28v64a14 14 0 0 1-28 0z" fill="rgba(255,255,255,.85)" {...O} />
        <path d="M48.5 58h23v26a11.5 11.5 0 0 1-23 0z" fill="#2ee6c5" />
        <circle className="sa-bub" cx="55" cy="88" r="3.2" fill="#fff" />
        <circle className="sa-bub" cx="64" cy="90" r="2.6" fill="#fff" style={{ animationDelay: '.8s' }} />
        <circle className="sa-bub" cx="59" cy="86" r="3.6" fill="#fff" style={{ animationDelay: '1.6s' }} />
        <rect x="40" y="15" width="40" height="8" rx="4" fill="#fff" {...O} />
      </g>
      <circle className="sa-puff" cx="52" cy="10" r="10" fill="#ff9cc0" />
      <circle className="sa-puff" cx="68" cy="6" r="12" fill="#c9baff" style={{ animationDelay: '.12s' }} />
      <circle className="sa-puff" cx="60" cy="-4" r="9" fill="#8ff0de" style={{ animationDelay: '.24s' }} />
    </>
  );
}

// Electrons follow their orbits with SMIL <animateMotion>, which moves them
// along the exact ellipse — paused/resumed through the svg element.
function Atom({ uid }) {
  const orbit = 'M-44 0a44 15 0 1 0 88 0a44 15 0 1 0-88 0';
  const electrons = [
    { rot: 0, color: '#ffe8a3', dur: '3s', begin: '0s' },
    { rot: 60, color: '#8ff0de', dur: '4.2s', begin: '-1s' },
    { rot: 120, color: '#ff9cc0', dur: '5.4s', begin: '-2s' },
  ];
  return (
    <g transform="translate(60 60)">
      {electrons.map((e, i) => (
        <g key={i} transform={`rotate(${e.rot})`}>
          <path id={uid + 'o' + i} d={orbit} fill="none" stroke="#fff" strokeWidth="3" />
          <circle r="5.5" fill={e.color} {...O}>
            <animateMotion dur={e.dur} begin={e.begin} repeatCount="indefinite"><mpath href={'#' + uid + 'o' + i} /></animateMotion>
          </circle>
        </g>
      ))}
      <circle className="sa-nucleus" r="10" fill="#ff7aac" {...O} />
      <g stroke="#fff" strokeWidth="4" strokeLinecap="round">
        {['M0-24v-26', 'M0 24v26', 'M-24 0h-26', 'M24 0h26', 'M17-17l18-18', 'M-17 17l-18 18', 'M17 17l18 18', 'M-17-17l-18-18'].map((d) => <path key={d} className="sa-ray" d={d} />)}
      </g>
    </g>
  );
}

function Globe({ uid }) {
  const lands = 'M30 44q10-8 20 0t8 14-14 10-16-6-2-18zM66 70q8-6 16 0t4 14-12 6-10-8 2-12zM48 88q6-4 12 0t0 10-12 2-2-6zM44 52q2-3 6 0z';
  return (
    <>
      <defs><clipPath id={uid + 'g'}><circle cx="60" cy="64" r="40" /></clipPath></defs>
      <circle cx="60" cy="64" r="40" fill="#4fa3ff" {...O} />
      <g clipPath={`url(#${uid}g)`}>
        <g className="sa-lands">
          <path d={lands} fill="#35d07f" />
          <path transform="translate(80 0)" d={lands} fill="#35d07f" />
        </g>
      </g>
      <circle cx="60" cy="64" r="40" fill="none" {...O} />
      <ellipse cx="46" cy="46" rx="9" ry="5" fill="#fff" opacity=".35" transform="rotate(-30 46 46)" />
      <g className="sa-pin">
        <path d="M72 30c0-7 5-12 11-12s11 5 11 12c0 8-11 18-11 18s-11-10-11-18z" fill="#ff5d6c" {...O} />
        <circle cx="83" cy="30" r="4" fill="#fff" />
      </g>
    </>
  );
}

function Scroll() {
  return (
    <>
      <g className="sa-paper">
        <rect x="32" y="30" width="56" height="56" fill="#fff3d6" {...O} />
        {['M40 42h40', 'M40 52h40', 'M40 62h34', 'M40 72h28'].map((d, i) => (
          <path key={d} className="sa-line" d={d} stroke="#b08a5a" strokeWidth="3" strokeLinecap="round" style={{ animationDelay: i * 0.5 + 's' }} />
        ))}
      </g>
      <rect x="24" y="22" width="72" height="13" rx="6.5" fill="#e8c98f" {...O} />
      <rect className="sa-roll-bottom" x="24" y="81" width="72" height="13" rx="6.5" fill="#e8c98f" {...O} />
      <g className="sa-pop">
        <circle cx="60" cy="52" r="15" fill="#e5484d" {...O} />
        <path d="M53 52l5 5 9-10" fill="none" stroke="#fff" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </>
  );
}

export default function SubjectArt({ subject, paused = false, finishing = false, size = 128 }) {
  const uid = useId().replace(/:/g, '');
  const svgRef = useRef(null);
  const kind = SUBJECT_ART[subject];
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg?.pauseAnimations) return;
    if (paused) svg.pauseAnimations();
    else svg.unpauseAnimations();
  }, [paused]);
  if (!kind) return null;
  const art = {
    book: <Book cover={subject === 'Polski' ? '#ef5a5a' : '#3b82f6'} spine={subject === 'Polski' ? '#b93a3a' : '#2458b8'} />,
    speech: <Speech />, math: <MathArt />, dna: <Dna />, tube: <Tube />, atom: <Atom uid={uid} />, globe: <Globe uid={uid} />, scroll: <Scroll />,
  }[kind];
  return (
    <svg
      ref={svgRef} viewBox="0 0 120 120" width={size} height={size} aria-hidden="true"
      className={'sa-art' + (paused ? ' sa-paused' : '') + (finishing ? ' sa-done' : '')} style={{ overflow: 'visible' }}
    >
      {art}
    </svg>
  );
}

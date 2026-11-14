import { useEffect, useMemo, useRef } from 'react';
import { dogSVG } from './dogArt';

// The big dog on a stage: breathes, blinks and wags its tail now and then;
// jumps when tapped or when `happyKey` changes, flips for a trick
// (`trickKey`). Same props as the old 3D view, so screens didn't change.
const CSS = `
.pw-dog .pw-eyes{transform-box:fill-box;transform-origin:50% 50%;animation:pwBlink 4.6s infinite}
.pw-dog .pw-tail{transform-box:fill-box;transform-origin:8% 85%;animation:pwWag 6.5s ease-in-out infinite}
.pw-dog-breathe{transform-origin:50% 92%;animation:pwBreathe 3.2s ease-in-out infinite}
@keyframes pwBlink{0%,93%,100%{transform:scaleY(1)}95.5%{transform:scaleY(.1)}}
@keyframes pwWag{0%,66%,100%{transform:rotate(0)}70%{transform:rotate(16deg)}74%{transform:rotate(-8deg)}78%{transform:rotate(16deg)}82%{transform:rotate(-8deg)}86%{transform:rotate(12deg)}90%{transform:rotate(0)}}
@keyframes pwBreathe{0%,100%{transform:scale(1,1)}50%{transform:scale(1.012,1.022)}}
`;
const JUMP = [
  { transform: 'translateY(0) scale(1,1)' },
  { transform: 'translateY(2%) scale(1.06,.92)', offset: 0.15 },
  { transform: 'translateY(-16%) scale(.96,1.05)', offset: 0.45 },
  { transform: 'translateY(0) scale(1.05,.94)', offset: 0.8 },
  { transform: 'translateY(0) scale(1,1)' },
];
const FLIP = [
  { transform: 'perspective(600px) translateY(0) rotateY(0)' },
  { transform: 'perspective(600px) translateY(-14%) rotateY(180deg)', offset: 0.45 },
  { transform: 'perspective(600px) translateY(-6%) rotateY(330deg)', offset: 0.75 },
  { transform: 'perspective(600px) translateY(0) rotateY(360deg)' },
];

export default function Dog2D({ dogId, worn, happyKey = 0, trickKey = 0, onReady, style }) {
  const jumper = useRef(null);
  const wornKey = JSON.stringify(worn || {});
  const svg = useMemo(() => dogSVG(dogId, { worn: JSON.parse(wornKey) }), [dogId, wornKey]);
  const play = (frames, ms) => jumper.current?.animate(frames, { duration: ms, easing: 'ease-out' });
  useEffect(() => { onReady?.(); }, [dogId]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (happyKey) play(JUMP, 650); }, [happyKey]);
  useEffect(() => { if (trickKey) play(FLIP, 1000); }, [trickKey]);
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', ...style }}>
      <style>{CSS}</style>
      <div ref={jumper} onClick={() => play(JUMP, 650)} style={{ height: '86%', aspectRatio: '1', maxWidth: '86%', maxHeight: 320, cursor: 'pointer' }}>
        <div className="pw-dog pw-dog-breathe" style={{ width: '100%', height: '100%' }} dangerouslySetInnerHTML={{ __html: svg }} />
      </div>
    </div>
  );
}

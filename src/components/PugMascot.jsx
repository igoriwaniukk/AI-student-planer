import { useState } from 'react';

// The Pulgo pug mascot: a still image, and a looping animation (head tilt,
// tongue, tassel). Versioned URLs so browsers holding an older crop refetch.
const PUG_SRC = '/pug-avatar.webp?v=3';
// The loop is an animated image, not a <video>: on iPhones a small round
// video sometimes drew zoomed in, and Low Power Mode stops video autoplay.
const PUG_LOOP_SRC = '/pug-loop.webp?v=1';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function PugImg({ size, animation, style, src = PUG_SRC }) {
  return (
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={animation ? 'pug-anim' : undefined}
      style={{ width: size, height: size, borderRadius: '50%', display: 'block', objectFit: 'cover', animation, transformOrigin: '50% 80%', ...style }}
    />
  );
}

// Falls back to the still image under reduced motion; `paused` shows the
// still too (e.g. while the chat sheet covers the button). The still sits
// behind the loop, so nothing flashes while it loads.
export function PugLive({ size, paused = false, animation, style }) {
  const [still] = useState(prefersReducedMotion);
  if (still || paused) return <PugImg size={size} animation={animation} style={style} />;
  return (
    <PugImg
      size={size}
      animation={animation}
      src={PUG_LOOP_SRC}
      style={{ background: `center / cover no-repeat url(${PUG_SRC})`, pointerEvents: 'none', ...style }}
    />
  );
}

import { useEffect, useRef, useState } from 'react';

// The Pulgo pug mascot: a still image, and a looping clip (head tilt,
// tongue, tassel). Versioned URLs so browsers holding an older crop refetch.
const PUG_SRC = '/pug-avatar.webp?v=3';

function prefersReducedMotion() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

export function PugImg({ size, animation, style }) {
  return (
    <img
      src={PUG_SRC}
      alt=""
      width={size}
      height={size}
      draggable={false}
      className={animation ? 'pug-anim' : undefined}
      style={{ width: size, height: size, borderRadius: '50%', display: 'block', objectFit: 'cover', animation, transformOrigin: '50% 80%', ...style }}
    />
  );
}

// Falls back to the still image under reduced motion; `paused` freezes it
// (e.g. while the chat sheet covers the button). The still is also the
// video's poster, so nothing flashes while it loads.
export function PugLive({ size, paused = false, animation, style }) {
  const ref = useRef(null);
  const [still] = useState(prefersReducedMotion);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (paused) v.pause();
    else v.play().catch(() => {});
  }, [paused]);
  if (still) return <PugImg size={size} style={style} />;
  return (
    <video
      ref={ref}
      autoPlay
      loop
      muted
      playsInline
      disablePictureInPicture
      poster={PUG_SRC}
      width={size}
      height={size}
      className={animation ? 'pug-anim' : undefined}
      style={{ width: size, height: size, borderRadius: '50%', display: 'block', objectFit: 'cover', animation, transformOrigin: '50% 80%', pointerEvents: 'none', ...style }}
    >
      <source src="/pug-loop.webm?v=3" type="video/webm" />
      <source src="/pug-loop.mp4?v=3" type="video/mp4" />
    </video>
  );
}

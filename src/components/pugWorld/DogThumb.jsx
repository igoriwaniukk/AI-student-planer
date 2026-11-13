import { useEffect, useState } from 'react';

// A still picture of a dog for cards and lists. Pictures are drawn one at a
// time by a single shared 3D renderer (dogModel.dogThumbnail) and cached, so
// a full album doesn't freeze the screen.
const queue = [];
let running = false;
function pump() {
  if (running) return;
  running = true;
  const step = () => {
    const job = queue.shift();
    if (!job) { running = false; return; }
    job();
    setTimeout(step, 0);
  };
  step();
}

export default function DogThumb({ dogId, worn, silhouette = false, size = 96, style }) {
  const [url, setUrl] = useState(null);
  const key = dogId + '|' + (silhouette ? 1 : 0) + '|' + JSON.stringify(worn || {});
  useEffect(() => {
    let alive = true;
    import('./dogModel.js').then((M) => {
      queue.push(() => {
        if (!alive) return;
        try { setUrl(M.dogThumbnail(dogId, { worn, silhouette, size: 256 })); } catch { setUrl('fail'); }
      });
      pump();
    }).catch(() => alive && setUrl('fail'));
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  if (url === 'fail') return <div style={{ width: size, height: size, display: 'grid', placeItems: 'center', fontSize: size * 0.5, ...style }}>🐶</div>;
  return url
    ? <img src={url} alt="" draggable={false} style={{ width: size, height: size, display: 'block', objectFit: 'contain', ...style }} />
    : <div style={{ width: size, height: size, ...style }} />;
}

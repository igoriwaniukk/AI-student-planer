import { useMemo } from 'react';
import { dogSVG } from './dogArt';

// A still picture of a dog for cards and lists; `silhouette` = a dog not
// collected yet (a dark shape).
export default function DogThumb({ dogId, worn, silhouette = false, size = 96, style }) {
  const wornKey = JSON.stringify(worn || {});
  const svg = useMemo(() => dogSVG(dogId, { worn: JSON.parse(wornKey), size }), [dogId, wornKey, size]);
  return (
    <div
      style={{ width: size, height: size, flex: 'none', ...(silhouette ? { filter: 'brightness(0)', opacity: 0.32 } : {}), ...style }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

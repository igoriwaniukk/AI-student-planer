import { useEffect, useRef, useState } from 'react';

// A live 3D dog: calm idle (breathing, a tail wag now and then, blinking),
// drag to spin it, and a jump / trick when `happyKey` / `trickKey` change.
// three.js is loaded only when this mounts. One renderer per mount: a
// different dog or outfit is swapped into the same scene (re-creating the
// renderer on the same canvas fails once its context has been released).
export default function Dog3D({ dogId, worn, happyKey = 0, trickKey = 0, spin = true, zoom = 1, style, onReady }) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const ctx = useRef(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const wornKey = JSON.stringify(worn || {});
  const spinRef = useRef(spin);
  const onReadyRef = useRef(onReady);
  useEffect(() => { spinRef.current = spin; onReadyRef.current = onReady; });

  // The scene, the render loop and dragging — once per mount.
  useEffect(() => {
    let alive = true;
    let cleanup = () => {};
    import('./dogModel.js').then((M) => {
      if (!alive || !canvas.current) return;
      const { THREE } = M;
      let renderer;
      try { renderer = M.makeRenderer(canvas.current); } catch { setFailed(true); return; }
      const { scene, envTexture } = M.makeScene(renderer);
      const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
      const holder = new THREE.Group();
      scene.add(holder);
      const c = {
        M, THREE, renderer, scene, camera, holder, dog: null, shadow: null, zoom: 1,
        st: { yaw: -1.0, vel: 0, drag: null, happy: -10, trick: -10, nextBlink: 2, nextWag: 1, wagUntil: 3 },
      };
      c.fit = () => {
        const el = wrap.current;
        if (!el || !c.dog) return;
        const w = el.clientWidth, h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        holder.rotation.y = -1.0;
        M.fitCamera(camera, holder, { fill: 0.8 * c.zoom });
        holder.rotation.y = c.st.yaw;
      };
      ctx.current = c;
      const ro = new ResizeObserver(() => c.fit());
      ro.observe(wrap.current);
      let visible = true;
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
      io.observe(wrap.current);
      const lost = (e) => { e.preventDefault(); setFailed(true); };
      canvas.current.addEventListener('webglcontextlost', lost);

      const clock = new THREE.Clock();
      c.clock = clock;
      let raf = 0;
      const st = c.st;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!visible || document.hidden || !c.dog) { clock.getDelta(); return; }
        const dt = Math.min(0.05, clock.getDelta());
        const t = clock.elapsedTime;
        const { body, head, tail, eyes } = c.dog.parts;
        const size = c.dog.size;
        body.scale.y = 1 + Math.sin(t * 2.2) * 0.012;
        const happyT = t - st.happy, trickT = t - st.trick;
        if (t > st.nextWag) { st.wagUntil = t + 1.6; st.nextWag = t + 4 + Math.random() * 4; }
        const wagging = t < st.wagUntil || happyT < 1.5;
        tail.rotation.y += ((wagging ? Math.sin(t * (happyT < 1.5 ? 18 : 11)) * 0.45 : 0) - tail.rotation.y) * Math.min(1, dt * 12);
        head.rotation.x = Math.sin(t * 0.6) * 0.07;
        head.rotation.z = 0.05 + Math.sin(t * 0.43) * 0.04;
        if (t > st.nextBlink) { st.blinkAt = t; st.nextBlink = t + 2.5 + Math.random() * 3; }
        const b = t - (st.blinkAt || -1);
        const lid = b >= 0 && b < 0.14 ? 0.15 : 1;
        eyes.forEach((e) => { e.scale.y = lid; });
        let y = 0, extraYaw = 0;
        if (happyT < 0.9) y = Math.sin((happyT / 0.9) * Math.PI) * 0.35 * size.y;
        if (trickT < 1.1) {
          const k = trickT / 1.1;
          y = Math.max(y, Math.sin(k * Math.PI) * 0.3 * size.y);
          extraYaw = (1 - Math.cos(k * Math.PI)) * Math.PI;
        }
        c.dog.root.position.y = y;
        c.shadow.scale.setScalar(1 - (y / size.y) * 0.5);
        if (!st.drag) { st.yaw += st.vel; st.vel *= 0.92; }
        holder.rotation.y = st.yaw + extraYaw;
        renderer.render(scene, camera);
      };
      loop();

      const el = canvas.current;
      const down = (e) => { if (!spinRef.current) return; st.drag = { x: e.clientX, yaw: st.yaw, lastX: e.clientX }; st.vel = 0; el.setPointerCapture?.(e.pointerId); };
      const move = (e) => {
        if (!st.drag) return;
        st.vel = (e.clientX - st.drag.lastX) * 0.01;
        st.drag.lastX = e.clientX;
        st.yaw = st.drag.yaw + (e.clientX - st.drag.x) * 0.01;
      };
      const up = () => { st.drag = null; };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
      setReady(true);

      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect(); io.disconnect();
        el.removeEventListener('webglcontextlost', lost);
        el.removeEventListener('pointerdown', down);
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        c.dog?.dispose();
        c.shadow?.userData.dispose();
        envTexture.dispose();
        renderer.dispose();
        renderer.forceContextLoss?.();
        ctx.current = null;
      };
    }).catch(() => setFailed(true));
    return () => { alive = false; cleanup(); };
  }, []);

  // The dog itself: built (again) when the dog, its outfits or the zoom change.
  useEffect(() => {
    const c = ctx.current;
    if (!ready || !c) return;
    let dog;
    try { dog = c.M.makeDog(dogId, { worn: JSON.parse(wornKey) }); } catch {
      // eslint-disable-next-line react/set-state-in-effect
      setFailed(true);
      return;
    }
    if (c.dog) { c.holder.remove(c.dog.root); c.dog.dispose(); }
    if (c.shadow) { c.scene.remove(c.shadow); c.shadow.userData.dispose(); }
    c.dog = dog;
    c.holder.add(dog.root);
    c.shadow = c.M.makeShadow(Math.max(dog.size.x, dog.size.z) * 0.62);
    c.scene.add(c.shadow);
    c.zoom = zoom;
    c.fit();
    onReadyRef.current?.();
  }, [ready, dogId, wornKey, zoom]);

  useEffect(() => { const c = ctx.current; if (happyKey && c) c.st.happy = c.clock.elapsedTime; }, [happyKey]);
  useEffect(() => { const c = ctx.current; if (trickKey && c) c.st.trick = c.clock.elapsedTime; }, [trickKey]);

  return (
    <div ref={wrap} style={{ position: 'relative', width: '100%', height: '100%', ...style }}>
      {failed ? (
        <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', fontSize: 64 }}>🐶</div>
      ) : (
        <canvas ref={canvas} style={{ width: '100%', height: '100%', display: 'block', touchAction: spin ? 'pan-y' : 'auto', cursor: spin ? 'grab' : 'default' }} />
      )}
    </div>
  );
}

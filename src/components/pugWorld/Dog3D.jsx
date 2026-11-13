import { useEffect, useRef, useState } from 'react';

// A live 3D dog: calm idle (breathing, a tail wag now and then, blinking),
// drag to spin it, and a jump / trick when `happyKey` / `trickKey` change.
// three.js is loaded only when this mounts.
export default function Dog3D({ dogId, worn, happyKey = 0, trickKey = 0, spin = true, zoom = 1, style, onReady }) {
  const wrap = useRef(null);
  const canvas = useRef(null);
  const api = useRef(null);
  const [failed, setFailed] = useState(false);
  const wornKey = JSON.stringify(worn || {});

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
      const dog = M.makeDog(dogId, { worn: JSON.parse(wornKey) });
      const holder = new THREE.Group();
      holder.add(dog.root);
      scene.add(holder);
      const shadow = M.makeShadow(Math.max(dog.size.x, dog.size.z) * 0.62);
      scene.add(shadow);
      holder.rotation.y = -1.0;

      const state = { yaw: -1.0, vel: 0, drag: null, happy: -10, trick: -10, nextBlink: 2, nextWag: 1, wagUntil: 3 };
      const resize = () => {
        const el = wrap.current; if (!el) return;
        const w = el.clientWidth, h = el.clientHeight;
        if (!w || !h) return;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        holder.rotation.y = -1.0;
        M.fitCamera(camera, holder, { fill: 0.8 * zoom });
        holder.rotation.y = state.yaw;
      };
      resize();
      const ro = new ResizeObserver(resize); ro.observe(wrap.current);

      let visible = true;
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
      io.observe(wrap.current);

      const clock = new THREE.Clock();
      let raf = 0;
      const { body, head, tail, eyes } = dog.parts;
      const loop = () => {
        raf = requestAnimationFrame(loop);
        if (!visible || document.hidden) { clock.getDelta(); return; }
        const dt = Math.min(0.05, clock.getDelta());
        const t = clock.elapsedTime;
        // breathing
        body.scale.y = 1 + Math.sin(t * 2.2) * 0.012;
        // tail: wags in short bursts, faster when happy
        const happyT = t - state.happy, trickT = t - state.trick;
        if (t > state.nextWag) { state.wagUntil = t + 1.6; state.nextWag = t + 4 + Math.random() * 4; }
        const wagging = t < state.wagUntil || happyT < 1.5;
        tail.rotation.y += ((wagging ? Math.sin(t * (happyT < 1.5 ? 18 : 11)) * 0.45 : 0) - tail.rotation.y) * Math.min(1, dt * 12);
        // head: a slow look around
        head.rotation.x = Math.sin(t * 0.6) * 0.07;
        head.rotation.z = 0.05 + Math.sin(t * 0.43) * 0.04;
        // blink
        if (t > state.nextBlink) { state.blinkAt = t; state.nextBlink = t + 2.5 + Math.random() * 3; }
        const b = t - (state.blinkAt || -1);
        const lid = b >= 0 && b < 0.14 ? 0.15 : 1;
        eyes.forEach((e) => { e.scale.y = lid; });
        // jump (happy) and spin (trick)
        let y = 0, extraYaw = 0;
        if (happyT < 0.9) y = Math.sin((happyT / 0.9) * Math.PI) * 0.35 * dog.size.y;
        if (trickT < 1.1) {
          const k = trickT / 1.1;
          y = Math.max(y, Math.sin(k * Math.PI) * 0.3 * dog.size.y);
          extraYaw = (1 - Math.cos(k * Math.PI)) * Math.PI; // ease 0 → 2π
        }
        dog.root.position.y = y;
        shadow.scale.setScalar(1 - (y / dog.size.y) * 0.5);
        // drag spin with a little momentum
        if (!state.drag) { state.yaw += state.vel; state.vel *= 0.92; }
        holder.rotation.y = state.yaw + extraYaw;
        renderer.render(scene, camera);
      };
      loop();

      const el = canvas.current;
      const down = (e) => { if (!spin) return; state.drag = { x: e.clientX, yaw: state.yaw, lastX: e.clientX }; state.vel = 0; el.setPointerCapture?.(e.pointerId); };
      const move = (e) => {
        if (!state.drag) return;
        const dx = e.clientX - state.drag.x;
        state.vel = (e.clientX - state.drag.lastX) * 0.01;
        state.drag.lastX = e.clientX;
        state.yaw = state.drag.yaw + dx * 0.01;
      };
      const up = () => { state.drag = null; };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointermove', move);
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);

      api.current = {
        happy: () => { state.happy = clock.elapsedTime; },
        trick: () => { state.trick = clock.elapsedTime; },
      };
      onReady?.();
      cleanup = () => {
        cancelAnimationFrame(raf);
        ro.disconnect(); io.disconnect();
        el.removeEventListener('pointerdown', down);
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerup', up);
        el.removeEventListener('pointercancel', up);
        dog.dispose();
        shadow.userData.dispose();
        envTexture.dispose();
        renderer.dispose();
        renderer.forceContextLoss?.();
        api.current = null;
      };
    }).catch(() => setFailed(true));
    return () => { alive = false; cleanup(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dogId, wornKey, zoom, spin]);

  useEffect(() => { if (happyKey) api.current?.happy(); }, [happyKey]);
  useEffect(() => { if (trickKey) api.current?.trick(); }, [trickKey]);

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

// A slow-pulsing blurred glow sitting behind a screen's content — the same
// purple/teal accents used throughout the app (see PrimaryButton, ProgressBar),
// just diffused into the background instead of flat #08080c. Render as a
// sibling placed BEFORE the screen's own content, with that content given
// `position: relative, zIndex: 1` — a negative z-index here would instead
// compare against .app-shell's own opaque background (it doesn't establish
// a stacking context on its own) and paint invisibly behind it. Reuses the
// existing pulseGlow keyframe (index.css) for the pulse itself.
export default function AmbientGlow() {
  return (
    <div style={{ position: 'absolute', inset: 0, zIndex: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute', top: '-12%', left: '-25%', width: 420, height: 420, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(139,109,255,.35), transparent 70%)',
          animation: 'pulseGlow 7s ease-in-out infinite',
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: '-16%', right: '-20%', width: 380, height: 380, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(46,230,197,.16), transparent 70%)',
          animation: 'pulseGlow 8s ease-in-out infinite 1.5s',
        }}
      />
    </div>
  );
}

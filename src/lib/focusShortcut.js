// Websites can't reach iOS system APIs (Focus mode, Screen Time app-blocking)
// directly — Apple blocks that for any web content. The one real bridge is
// the Shortcuts app: it can expose a user-built automation as a named
// shortcut, launchable via the `shortcuts://run-shortcut` URL scheme. This
// only does anything if the named shortcut already exists on the device.
export function triggerFocusShortcut(settings) {
  if (!settings?.enabled || !settings.name?.trim()) return;
  window.location.href = 'shortcuts://run-shortcut?name=' + encodeURIComponent(settings.name.trim());
}

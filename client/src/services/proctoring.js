/**
 * Proctoring and Fullscreen Utility Services
 */

export function enterFullscreen() {
  const elem = document.documentElement;
  try {
    if (elem.requestFullscreen) {
      return elem.requestFullscreen();
    } else if (elem.webkitRequestFullscreen) {
      return elem.webkitRequestFullscreen();
    } else if (elem.msRequestFullscreen) {
      return elem.msRequestFullscreen();
    }
  } catch (err) {
    console.warn('[PROCTORING] Fullscreen request rejected:', err.message);
  }
  return Promise.resolve();
}

export function exitFullscreen() {
  try {
    if (
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    ) {
      if (document.exitFullscreen) {
        return document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        return document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        return document.msExitFullscreen();
      }
    }
  } catch (err) {
    console.warn('[PROCTORING] Exit fullscreen error:', err.message);
  }
  return Promise.resolve();
}

export function isFullscreenActive() {
  return !!(
    document.fullscreenElement ||
    document.webkitFullscreenElement ||
    document.mozFullScreenElement ||
    document.msFullscreenElement
  );
}

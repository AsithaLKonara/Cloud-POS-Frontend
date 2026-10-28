/**
 * Lightweight, zero-dependency device fingerprinter.
 * Collects non-PII browser characteristics to create a unique hash.
 *
 * Signals collected:
 * - Navigator properties (UA, language, platform, plugins, hardwareConcurrency)
 * - Screen (resolution, color depth, pixel ratio)
 * - Timezone
 * - Canvas 2D rendering (detects virtual browsers, headless Chrome)
 * - WebGL renderer string (GPU-based — very stable, hard to spoof)
 * - Audio context baseline (catches audio processing differences)
 * - Touch capability
 *
 * This is used for:
 *   1. Velocity checks on checkout — blocks device-rotating bots
 *   2. JWT fingerprint binding on login — detects token theft
 *   3. Fraud scoring — factors into risk assessment
 */

async function sha256(message: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Fallback for SSR / very old browsers
  return btoa(message).replace(/=/g, '');
}

/**
 * Canvas 2D fingerprint — renders text and geometric shapes.
 * Different GPU + driver combinations produce measurable pixel differences.
 * Headless Chrome, PhantomJS, and most bots return blank or error canvas.
 */
function getCanvasFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'no-canvas';

    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillStyle = '#f60';
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = '#069';
    ctx.fillText('Xonit🛡️', 2, 15);
    ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
    ctx.fillText('Xonit🛡️', 4, 17);

    return canvas.toDataURL().slice(-50); // last 50 chars — stable diff signal
  } catch {
    return 'canvas-error';
  }
}

/**
 * WebGL renderer fingerprint — identifies the GPU + driver combination.
 * This is the most stable and reliable fingerprint signal.
 * Headless Chrome/Puppeteer often returns 'Google SwiftShader' or empty.
 */
function getWebGLFingerprint(): string {
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl') as WebGLRenderingContext | null;
    if (!gl) return 'no-webgl';

    const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
    if (!debugInfo) return 'no-debug-info';

    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || '';
    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || '';
    return `${vendor}|${renderer}`;
  } catch {
    return 'webgl-error';
  }
}

/**
 * Audio context fingerprint — measures tiny differences in audio processing.
 * Legitimate browsers produce consistent non-zero values.
 * Bots/virtual machines often return exact 0s or throw exceptions.
 */
async function getAudioFingerprint(): Promise<string> {
  // Disabled to prevent ScriptProcessorNode console warnings
  return 'audio-disabled';
}

/**
 * Bot signal detection — checks for known headless/automation tells.
 * Returns a score string to include in the fingerprint.
 */
function getBotSignals(): string {
  if (typeof window === 'undefined') return 'ssr';

  const signals: string[] = [];

  // Webdriver flag (set by Selenium, Puppeteer default)
  if (navigator.webdriver) signals.push('webdriver');

  // No plugins (headless Chrome has 0 plugins)
  if (navigator.plugins && navigator.plugins.length === 0) signals.push('no-plugins');

  // Phantom.js legacy
  if ((window as any).callPhantom || (window as any)._phantom) signals.push('phantom');

  // CasperJS
  if ((window as any).domAutomation || (window as any).domAutomationController) signals.push('automation');

  // Chrome but missing chrome object (Puppeteer without --no-sandbox stealth)
  const userAgent = navigator.userAgent;
  if (userAgent.includes('Chrome') && !(window as any).chrome) signals.push('fake-chrome');

  return signals.length > 0 ? signals.join(',') : 'clean';
}

export async function generateDeviceFingerprint(): Promise<string> {
  if (typeof window === 'undefined') {
    return 'ssr-fallback';
  }

  const { navigator, screen } = window;

  // Collect stable properties in parallel
  const [audioFp] = await Promise.all([
    getAudioFingerprint(),
  ]);

  const canvasFp = getCanvasFingerprint();
  const webglFp = getWebGLFingerprint();
  const botSignals = getBotSignals();

  const properties = [
    // Navigator
    navigator.userAgent,
    navigator.language,
    navigator.languages?.join(',') || '',
    navigator.platform || '',
    navigator.hardwareConcurrency || 0,
    navigator.maxTouchPoints || 0,
    // Screen
    screen.colorDepth,
    screen.width,
    screen.height,
    window.devicePixelRatio || 1,
    // Timezone
    Intl.DateTimeFormat().resolvedOptions().timeZone,
    // Advanced fingerprints
    canvasFp,
    webglFp,
    audioFp,
    // Bot signals (included so bots that fail get a different fingerprint)
    botSignals,
  ];

  const rawString = properties.join('|');
  return sha256(rawString);
}

/**
 * Quick check: returns true if obvious bot signals are detected.
 * Use this for pre-flight checks before allowing sensitive actions.
 */
export function isLikelyBot(): boolean {
  if (typeof window === 'undefined') return false;

  if (navigator.webdriver) return true;
  if ((window as any).callPhantom || (window as any)._phantom) return true;
  if ((window as any).domAutomation || (window as any).domAutomationController) return true;

  return false;
}

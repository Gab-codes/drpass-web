/**
 * Requests browser fullscreen for the document, resolving to whether it
 * succeeded. Every failure mode — unsupported API, user/browser rejection,
 * request failure — resolves gracefully to `false` so the exam can always
 * continue; fullscreen is an enhancement, never a requirement.
 *
 * Must be called directly from a user gesture (e.g. the Start button click)
 * because browsers only grant fullscreen in response to user interaction.
 */
export async function requestFullscreen(): Promise<boolean> {
  const element = document.documentElement;
  if (typeof element.requestFullscreen !== "function") return false;

  try {
    await element.requestFullscreen();
    return true;
  } catch {
    // Rejected (user dismissed the prompt, browser policy, etc.) — not fatal.
    return false;
  }
}

/**
 * True when the viewport is desktop-sized. Fullscreen is only attempted on
 * desktop; mobile exam sessions never trigger a fullscreen request.
 */
export function isDesktopViewport(): boolean {
  return window.matchMedia("(min-width: 768px)").matches;
}

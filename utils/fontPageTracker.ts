/**
 * Module-level tracker for QPC font pages that have been confirmed CSS-rendered.
 *
 * WHY: The QPC font files use SVG/XML format (sfntVersion = "<?xm"), which causes
 * OTS (OpenType Sanitizer) to reject them from the JS FontFace API. This means
 * document.fonts.check() and document.fonts.load() always fail — but CSS @font-face
 * still renders them correctly.
 *
 * SOLUTION: Track "has this page's font been shown to the user" in a Set.
 * Before flushSync in MainReadingInterface, we mark the swiped-to page as rendered
 * (because it WAS showing in the adjacent slot). QuranPage reads this Set
 * synchronously during render to avoid any opacity:0 white flash.
 */
export const renderedFontPages = new Set<number>();

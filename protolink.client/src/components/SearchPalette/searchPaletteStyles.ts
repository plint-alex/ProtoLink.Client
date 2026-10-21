export const SEARCH_PALETTE_STYLE_ID = 'pl-search-palette-styles'

export const SEARCH_PALETTE_CSS = `
.pl-sp-root {
  --pl-accent: #3390EC;
  --pl-accent-soft: #E8F2FD;
  --pl-bg: #FFFFFF;
  --pl-bg-secondary: #F4F4F5;
  --pl-surface: #FFFFFF;
  --pl-text: #0F0F0F;
  --pl-text-secondary: #707579;
  --pl-divider: #E4E4E5;
  --pl-active: #E8F2FD;
  color: var(--pl-text);
  font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
  font-size: 16px;
  line-height: 22px;
}
@media (prefers-color-scheme: dark) {
  .pl-sp-root {
    --pl-accent-soft: #1E2A38;
    --pl-bg: #212121;
    --pl-bg-secondary: #181818;
    --pl-surface: #2C2C2C;
    --pl-text: #FFFFFF;
    --pl-text-secondary: #AAAAAA;
    --pl-divider: #3A3A3A;
    --pl-active: #1E2A38;
  }
}
.pl-sp-scrim {
  position: fixed; inset: 0; z-index: 1400;
  background: rgba(0,0,0,0.45);
  display: flex; align-items: flex-start; justify-content: center;
  padding: 12vh 16px 24px;
}
.pl-sp-panel {
  width: 100%; max-width: 560px;
  background: var(--pl-bg); color: var(--pl-text);
  border-radius: 16px; border: 1px solid var(--pl-divider);
  box-shadow: 0 16px 48px rgba(0,0,0,0.22);
  overflow: hidden; display: flex; flex-direction: column; max-height: min(72vh, 640px);
}
.pl-sp-field-wrap {
  display: flex; align-items: center; gap: 8px;
  padding: 12px 14px; border-bottom: 1px solid var(--pl-divider);
  background: var(--pl-surface);
}
.pl-sp-magnifier { color: var(--pl-text-secondary); flex-shrink: 0; font-size: 18px; }
.pl-sp-input {
  flex: 1; min-width: 0; border: 0; outline: none; background: transparent;
  color: var(--pl-text); font-size: 16px; line-height: 22px;
}
.pl-sp-icon-btn {
  width: 36px; height: 36px; border: 0; border-radius: 50%;
  background: transparent; color: var(--pl-text-secondary); cursor: pointer;
  display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0;
}
.pl-sp-icon-btn:hover { background: var(--pl-bg-secondary); }
.pl-sp-body { overflow: auto; padding: 8px 12px 12px; flex: 1; }
.pl-sp-hint { margin: 8px 4px 12px; color: var(--pl-text-secondary); font-size: 14px; line-height: 20px; }
.pl-sp-section { margin-top: 10px; }
.pl-sp-section-title {
  margin: 0 0 4px; padding: 0 4px;
  font-size: 13px; line-height: 18px; font-weight: 600;
  color: var(--pl-text-secondary);
}
.pl-sp-row {
  display: flex; align-items: center; gap: 12px;
  min-height: 64px; padding: 10px 8px; border-radius: 12px;
  cursor: pointer; border: 0; background: transparent; width: 100%; text-align: left;
  color: inherit; font: inherit;
}
.pl-sp-row:hover { background: var(--pl-bg-secondary); }
.pl-sp-row.is-active { background: var(--pl-active); }
.pl-sp-avatar {
  width: 44px; height: 44px; border-radius: 12px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center; font-size: 20px;
}
.pl-sp-main { flex: 1; min-width: 0; }
.pl-sp-title {
  margin: 0; font-size: 16px; line-height: 22px; white-space: nowrap;
  overflow: hidden; text-overflow: ellipsis;
}
.pl-sp-title .pl-match { font-weight: 500; }
.pl-sp-title .pl-rest { font-weight: 600; }
.pl-sp-crumb {
  margin: 2px 0 0; font-size: 13px; line-height: 18px; color: var(--pl-text-secondary);
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
}
.pl-sp-time {
  flex-shrink: 0; font-size: 13px; line-height: 18px; color: var(--pl-text-secondary);
  min-width: 3.5em; text-align: right;
}
.pl-sp-recent-row {
  display: flex; align-items: center; gap: 8px; min-height: 44px;
  padding: 4px 8px; border-radius: 10px; cursor: pointer;
}
.pl-sp-recent-row:hover, .pl-sp-recent-row.is-active { background: var(--pl-bg-secondary); }
.pl-sp-recent-q { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.pl-sp-banner {
  margin: 8px 0 12px; padding: 10px 12px; border-radius: 10px;
  background: var(--pl-accent-soft); color: var(--pl-text); font-size: 14px; line-height: 20px;
}
.pl-sp-state {
  margin: 16px 4px; color: var(--pl-text-secondary); font-size: 15px; line-height: 22px;
}
.pl-sp-state a { color: var(--pl-accent); }
.pl-sp-details {
  margin-top: 8px; font-size: 13px; color: var(--pl-text-secondary); white-space: pre-wrap;
}
.pl-sp-see-all {
  display: block; width: 100%; margin-top: 8px; min-height: 44px;
  border: 0; border-radius: 12px; background: var(--pl-bg-secondary);
  color: var(--pl-accent); font-weight: 600; font-size: 15px; cursor: pointer;
}
.pl-sp-see-all:hover { filter: brightness(0.97); }
.pl-sp-skel {
  display: flex; gap: 12px; align-items: center; min-height: 64px; padding: 10px 8px;
}
.pl-sp-skel-av {
  width: 44px; height: 44px; border-radius: 12px; background: var(--pl-bg-secondary);
}
.pl-sp-skel-lines { flex: 1; }
.pl-sp-skel-line {
  height: 12px; border-radius: 6px; background: var(--pl-bg-secondary); margin: 6px 0;
  animation: pl-sp-pulse 1.2s ease-in-out infinite;
}
.pl-sp-skel-line.short { width: 55%; }
@keyframes pl-sp-pulse { 0%,100% { opacity: 0.55; } 50% { opacity: 1; } }
@media (max-width: 359px) {
  .pl-sp-time { display: none; }
}
`
export function ensureSearchPaletteStyles(): void {
    if (typeof document === 'undefined') return
    if (document.getElementById(SEARCH_PALETTE_STYLE_ID)) return
    const el = document.createElement('style')
    el.id = SEARCH_PALETTE_STYLE_ID
    el.textContent = SEARCH_PALETTE_CSS
    document.head.appendChild(el)
}

export const AVATAR_STYLES: Record<string, { bg: string; glyph: string }> = {
    folder: { bg: '#fff3e0', glyph: '\uD83D\uDCC1' },
    notes: { bg: '#e8f5e9', glyph: '\uD83D\uDCDD' },
    file: { bg: '#e3f2fd', glyph: '\uD83D\uDCC4' },
    people: { bg: '#f3e5f5', glyph: '\uD83D\uDC64' },
    other: { bg: '#eceff1', glyph: '\uD83D\uDCCE' },
    direct: { bg: '#e8f2fd', glyph: '\uD83D\uDD17' },
}

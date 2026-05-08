/**
 * Theme service — applies the user's appearance preference to the document.
 *
 * Strategy
 * --------
 *  - The "effective" theme is always either 'light' or 'dark'. We resolve it
 *    from the user's mode (`light` | `dark` | `system`) before painting.
 *  - We write `data-theme="dark"` (or remove it) on `<html>`. CSS overrides
 *    keyed off `[data-theme="dark"]` flip the K!dS tokens to dark values.
 *  - We persist the mode to `localStorage` so the next page load can apply
 *    the theme synchronously, before any API call resolves. That avoids the
 *    "flash of light theme" when the user has dark mode picked.
 *  - When mode is `system`, we listen to `prefers-color-scheme` and react.
 */
import { Injectable, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'kipa-theme-mode';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Mode chosen by the user (or system as default). */
  readonly mode = signal<ThemeMode>('light');

  /** Effective theme that's actually applied to the DOM. */
  readonly effective = signal<'light' | 'dark'>('light');

  private _mql: MediaQueryList | null = null;
  private _systemListener: ((e: MediaQueryListEvent) => void) | null = null;

  /**
   * Read the persisted mode (if any) and apply it. Safe to call from app
   * bootstrap — runs before any HTTP request resolves so the user never sees
   * a light flash.
   */
  initFromStorage(): void {
    // Demo build: always start in light mode. The settings page can still
    // switch to dark during the visit, but every fresh page load resets to
    // light so the showcase URL renders identically every time.
    this.setMode('light', /* persist= */ false);
    if (typeof localStorage !== 'undefined') {
      // Drop any leftover preference so existing visitors get reset too.
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  /**
   * Set the user's preference and apply it immediately. Persists to
   * localStorage by default so the choice survives reload. Pass
   * `persist=false` for the initial bootstrap call.
   */
  setMode(mode: ThemeMode, persist = true): void {
    this.mode.set(mode);
    if (persist && typeof localStorage !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, mode);
    }
    this._reapply();
    this._wireSystemListener(mode === 'system');
  }

  /**
   * Sync the mode from a backend preferences response. We treat backend as
   * the source of truth and update localStorage, so the user's choice on a
   * different device propagates here at next login.
   */
  syncFromBackend(mode: ThemeMode): void {
    this.setMode(mode, /* persist= */ true);
  }

  // ── internals ──────────────────────────────────────────────────────────────

  private _reapply(): void {
    const eff = this._resolveEffective(this.mode());
    this.effective.set(eff);
    if (typeof document === 'undefined') return;
    const root = document.documentElement;
    if (eff === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else {
      root.removeAttribute('data-theme');
    }
  }

  private _resolveEffective(mode: ThemeMode): 'light' | 'dark' {
    if (mode === 'system') {
      if (typeof window === 'undefined' || !window.matchMedia) return 'light';
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return mode;
  }

  private _wireSystemListener(active: boolean): void {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    // Tear down any previous listener before deciding whether to attach a new one.
    if (this._mql && this._systemListener) {
      this._mql.removeEventListener('change', this._systemListener);
    }
    this._mql = null;
    this._systemListener = null;

    if (!active) return;

    this._mql = window.matchMedia('(prefers-color-scheme: dark)');
    this._systemListener = () => this._reapply();
    this._mql.addEventListener('change', this._systemListener);
  }
}

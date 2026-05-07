import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  LucideAngularModule,
  ChevronRight,
  User,
  Bell,
  Shield,
  Palette,
  Moon,
  Sun,
  Monitor,
  Eye,
  EyeOff,
  Check,
  Loader,
  LogOut,
  Trash2,
  Monitor as DeviceIcon,
} from 'lucide-angular';

import {
  AccountService,
  AppearancePreferences,
  GeneralPreferences,
  NotificationPreferences,
  ThemeMode,
  UserPreferences,
  UserSession,
} from '../account.service';
import { ThemeService } from '../theme.service';

type Tab = 'general' | 'notifications' | 'security' | 'appearance';

@Component({
  selector: 'kipa-settings',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, TranslocoModule],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
  private readonly account = inject(AccountService);
  private readonly themeSvc = inject(ThemeService);
  private readonly fb = inject(FormBuilder);
  private readonly t = inject(TranslocoService);

  /** Bound to the theme picker — uses the live ThemeService signal so the
   *  selection always reflects what's actually applied on the page. */
  readonly theme = this.themeSvc.mode;

  // Icons
  readonly ChevronRightIcon = ChevronRight;
  readonly UserIcon = User;
  readonly BellIcon = Bell;
  readonly ShieldIcon = Shield;
  readonly PaletteIcon = Palette;
  readonly MoonIcon = Moon;
  readonly SunIcon = Sun;
  readonly MonitorIcon = Monitor;
  readonly EyeIcon = Eye;
  readonly EyeOffIcon = EyeOff;
  readonly CheckIcon = Check;
  readonly LoaderIcon = Loader;
  readonly LogOutIcon = LogOut;
  readonly TrashIcon = Trash2;
  readonly DeviceIcon = DeviceIcon;

  // UI state
  readonly activeTab = signal<Tab>('general');
  readonly showOldPwd = signal(false);
  readonly showNewPwd = signal(false);

  // Loading flags (per-section so spinners don't block unrelated actions)
  readonly loadingPrefs       = signal(true);
  readonly savingGeneral      = signal(false);
  readonly savingNotif        = signal(false);
  readonly savingSecurity     = signal(false);
  readonly savingAppearance   = signal(false);
  readonly loadingSessions    = signal(false);
  readonly revokingSessionId  = signal<string | null>(null);
  readonly revokingAllOthers  = signal(false);

  // Feedback
  readonly toast = signal<{ kind: 'success' | 'error'; msg: string } | null>(null);

  // Sessions
  readonly sessions = signal<UserSession[]>([]);
  readonly otherSessionsCount = computed(
    () => this.sessions().filter((s) => !s.is_current).length,
  );

  // Forms — initialised with defaults; replaced once API resolves.
  readonly generalForm = this.fb.nonNullable.group({
    language:    ['ca'],
    timezone:    ['Europe/Andorra'],
    date_format: ['DD/MM/YYYY'],
    week_start:  ['monday'],
  });

  readonly notifForm = this.fb.nonNullable.group({
    email_new:        [true],
    email_weekly:     [true],
    email_monthly:    [false],
    push_admissions:  [true],
    push_payments:    [true],
    push_messages:    [true],
    push_attendance:  [false],
  });

  readonly securityForm = this.fb.nonNullable.group({
    current_password: ['', Validators.required],
    new_password: ['', [Validators.required, Validators.minLength(8)]],
    confirm_password: ['', Validators.required],
  });

  readonly tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'general',       label: 'General',       icon: User    },
    { id: 'notifications', label: 'Notificacions', icon: Bell    },
    { id: 'security',      label: 'Seguretat',     icon: Shield  },
    { id: 'appearance',    label: 'Aparença',      icon: Palette },
  ];

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    this._loadPreferences();
    this._loadSessions();
  }

  setTab(t: Tab): void { this.activeTab.set(t); }

  /**
   * Switching theme flips the DOM + localStorage instantly via ThemeService.
   * Persistence to the backend happens only when the user clicks "Desar tema"
   * (same UX as the other tabs). Auto-saving on every click is a footgun —
   * an expired access token here would cascade into the auth interceptor
   * redirecting to /login mid-interaction.
   */
  setTheme(t: ThemeMode): void {
    this.themeSvc.setMode(t);
  }

  // ─── Preferences (load) ───────────────────────────────────────────────────
  private _loadPreferences(): void {
    this.loadingPrefs.set(true);
    this.account.getPreferences().subscribe({
      next: (prefs) => {
        this.generalForm.patchValue(prefs.general);
        this.notifForm.patchValue(prefs.notifications);
        // NOTE: we deliberately do NOT call themeSvc.syncFromBackend here.
        // The bootstrap APP_INITIALIZER already applied the persisted theme
        // from localStorage, and the user might be mid-edit (clicked dark
        // but hasn't pressed "Desar tema" yet). Overwriting the live mode
        // with the stored backend value would flicker their selection back.
        // Settings binds the picker to themeSvc.mode() directly so the UI
        // already reflects the live theme.
        this.loadingPrefs.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingPrefs.set(false);
        this._notifyError(this.t.translate('account.settings.errors.loadFailed'), err);
      },
    });
  }

  // ─── Save: general ────────────────────────────────────────────────────────
  saveGeneral(): void {
    if (this.savingGeneral()) return;
    if (this.generalForm.invalid) {
      this.generalForm.markAllAsTouched();
      return;
    }
    this.savingGeneral.set(true);
    const payload = this.generalForm.getRawValue() as GeneralPreferences;
    this.account.updatePreferences({ general: payload }).subscribe({
      next: () => {
        this.savingGeneral.set(false);
        this._notifySuccess(this.t.translate('account.settings.general.savedToast'));
      },
      error: (err: HttpErrorResponse) => {
        this.savingGeneral.set(false);
        this._notifyError(this.t.translate('account.settings.errors.saveFailed'), err);
      },
    });
  }

  // ─── Save: notifications ──────────────────────────────────────────────────
  saveNotifications(): void {
    if (this.savingNotif()) return;
    this.savingNotif.set(true);
    const payload = this.notifForm.getRawValue() as NotificationPreferences;
    this.account.updatePreferences({ notifications: payload }).subscribe({
      next: () => {
        this.savingNotif.set(false);
        this._notifySuccess(this.t.translate('account.settings.notif.savedToast'));
      },
      error: (err: HttpErrorResponse) => {
        this.savingNotif.set(false);
        this._notifyError(this.t.translate('account.settings.errors.saveNotifFailed'), err);
      },
    });
  }

  // ─── Save: appearance (theme) ─────────────────────────────────────────────
  /**
   * The theme is already applied + persisted on click (see `setTheme`). This
   * button just gives the user explicit confirmation that the current choice
   * has been saved on the backend.
   */
  saveAppearance(): void {
    if (this.savingAppearance()) return;
    this.savingAppearance.set(true);
    const payload: AppearancePreferences = { theme: this.theme() };
    this.account.updatePreferences({ appearance: payload }).subscribe({
      next: () => {
        this.savingAppearance.set(false);
        this._notifySuccess(this.t.translate('account.settings.appearance.savedToast'));
      },
      error: (err: HttpErrorResponse) => {
        this.savingAppearance.set(false);
        this._notifyError(this.t.translate('account.settings.errors.saveThemeFailed'), err);
      },
    });
  }

  // ─── Save: security (password) ────────────────────────────────────────────
  saveSecurity(): void {
    if (this.savingSecurity()) return;
    if (this.securityForm.invalid) {
      this.securityForm.markAllAsTouched();
      return;
    }
    const v = this.securityForm.getRawValue();
    if (v.new_password !== v.confirm_password) {
      this.securityForm.get('confirm_password')?.setErrors({ mismatch: true });
      return;
    }

    this.savingSecurity.set(true);
    this.account.changePassword({
      current_password: v.current_password,
      new_password: v.new_password,
    }).subscribe({
      next: () => {
        this.savingSecurity.set(false);
        this.securityForm.reset();
        this._notifySuccess(this.t.translate('account.settings.security.passwordUpdated'));
      },
      error: (err: HttpErrorResponse) => {
        this.savingSecurity.set(false);
        const detail = (err.error && typeof err.error === 'object' && 'detail' in err.error)
          ? String(err.error.detail)
          : this.t.translate('account.settings.errors.passwordFailed');
        this._notify('error', detail);
      },
    });
  }

  // ─── Sessions ─────────────────────────────────────────────────────────────
  private _loadSessions(): void {
    this.loadingSessions.set(true);
    this.account.listSessions().subscribe({
      next: (list) => {
        this.sessions.set(list);
        this.loadingSessions.set(false);
      },
      error: (err: HttpErrorResponse) => {
        this.loadingSessions.set(false);
        this._notifyError(this.t.translate('account.settings.errors.loadSessionsFailed'), err);
      },
    });
  }

  revokeSession(id: string): void {
    if (this.revokingSessionId()) return;
    this.revokingSessionId.set(id);
    this.account.revokeSession(id).subscribe({
      next: () => {
        this.revokingSessionId.set(null);
        this.sessions.update((list) => list.filter((s) => s.id !== id));
        this._notifySuccess(this.t.translate('account.settings.security.sessionRevoked'));
      },
      error: (err: HttpErrorResponse) => {
        this.revokingSessionId.set(null);
        this._notifyError(this.t.translate('account.settings.errors.revokeFailed'), err);
      },
    });
  }

  revokeAllOthers(): void {
    if (this.revokingAllOthers() || this.otherSessionsCount() === 0) return;
    this.revokingAllOthers.set(true);
    this.account.revokeAllOtherSessions().subscribe({
      next: () => {
        this.revokingAllOthers.set(false);
        this.sessions.update((list) => list.filter((s) => s.is_current));
        this._notifySuccess(this.t.translate('account.settings.security.allOthersRevoked'));
      },
      error: (err: HttpErrorResponse) => {
        this.revokingAllOthers.set(false);
        this._notifyError(this.t.translate('account.settings.errors.revokeFailed'), err);
      },
    });
  }

  // ─── Toast helpers ────────────────────────────────────────────────────────
  private _notifySuccess(msg: string): void { this._notify('success', msg); }

  private _notifyError(fallback: string, err: HttpErrorResponse): void {
    const detail =
      err.error && typeof err.error === 'object' && 'detail' in err.error
        ? String(err.error.detail)
        : fallback;
    this._notify('error', detail);
  }

  private _notify(kind: 'success' | 'error', msg: string): void {
    this.toast.set({ kind, msg });
    setTimeout(() => this.toast.set(null), 4000);
  }

  // ─── Display helpers ──────────────────────────────────────────────────────
  /** "Chrome on macOS" — translated via the active language. */
  describeDevice(s: UserSession): string {
    const ua = s.user_agent || '';
    if (!ua) return this.t.translate('account.settings.security.unknownDevice');
    const browser =
      /Edg\//.test(ua) ? 'Edge' :
      /Chrome\//.test(ua) ? 'Chrome' :
      /Firefox\//.test(ua) ? 'Firefox' :
      /Safari\//.test(ua) ? 'Safari' :
      'Browser';
    const os =
      /Mac OS X/.test(ua) ? 'macOS' :
      /Windows/.test(ua)  ? 'Windows' :
      /Linux/.test(ua)    ? 'Linux' :
      /Android/.test(ua)  ? 'Android' :
      /iPhone|iPad/.test(ua) ? 'iOS' :
      'OS';
    return this.t.translate('account.settings.security.browserOn', { browser, os });
  }

  /**
   * Locale-aware "x minutes/hours/days ago" string.
   * Uses `Intl.RelativeTimeFormat` so it tracks the active language without
   * us shipping a per-language template.
   */
  formatRelativeTime(iso: string): string {
    const lang = this.t.getActiveLang();
    const localeMap: Record<string, string> = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' };
    const locale = localeMap[lang] ?? 'ca-ES';
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'long' });

    const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
    const absSec = Math.abs(diffSec);
    if (absSec < 60)        return rtf.format(Math.round(diffSec / 60), 'minute');
    if (absSec < 3600)      return rtf.format(Math.round(diffSec / 60), 'minute');
    if (absSec < 86400)     return rtf.format(Math.round(diffSec / 3600), 'hour');
    if (absSec < 30 * 86400) return rtf.format(Math.round(diffSec / 86400), 'day');
    return new Date(iso).toLocaleDateString(locale);
  }
}

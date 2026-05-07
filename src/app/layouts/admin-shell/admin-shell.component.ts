import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule,
  Home,
  Users,
  FileText,
  DollarSign,
  ClipboardCheck,
  MessageCircle,
  Calendar,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  Bell,
  Settings,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Search,
  User,
  HelpCircle,
  CheckCircle2,
  Wallet,
  CalendarPlus,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthService } from '../../core/auth/auth.service';
import { NotificationsStoreService } from '../../features/notifications/notifications-store.service';
import { KipaLogoComponent } from '../../shared/components/kipa-logo.component';
import { LangSwitcherComponent } from '../../shared/components/lang-switcher.component';

interface NavItem {
  path: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
  disabled?: boolean;
}

const SIDEBAR_KEY = 'kipa-sidebar-collapsed';

@Component({
  selector: 'kipa-admin-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideAngularModule,
    KipaLogoComponent,
    LangSwitcherComponent,
    TranslocoModule,
  ],
  templateUrl: './admin-shell.component.html',
  styleUrl: './admin-shell.component.scss',
})
export class AdminShellComponent {
  protected readonly auth = inject(AuthService);
  protected readonly notif = inject(NotificationsStoreService);
  private readonly router = inject(Router);

  constructor() {
    // Boot the store once per session — fires an initial fetch + 60s poll.
    this.notif.initOnce();
  }

  readonly navItems: NavItem[] = [
    { path: '/a/dashboard',      labelKey: 'nav.home',           icon: Home },
    { path: '/a/alumnos',        labelKey: 'nav.students',       icon: Users },
    { path: '/a/admissions',     labelKey: 'nav.admissions',     icon: FileText },
    { path: '/a/finanzas',       labelKey: 'nav.finances',       icon: DollarSign },
    { path: '/a/asistencia',     labelKey: 'nav.attendance',     icon: ClipboardCheck },
    { path: '/a/comunicaciones', labelKey: 'nav.communications', icon: MessageCircle },
    { path: '/a/contingut',      labelKey: 'nav.content',        icon: Calendar },
  ];

  readonly menuOpen         = signal(false);
  readonly profileMenuOpen  = signal(false);
  readonly notifMenuOpen    = signal(false);
  readonly sidebarCollapsed = signal<boolean>(
    typeof localStorage !== 'undefined' && localStorage.getItem(SIDEBAR_KEY) === '1'
  );


  // Icons
  readonly LogOut       = LogOut;
  readonly Menu         = Menu;
  readonly Close        = X;
  readonly Bell         = Bell;
  readonly Settings     = Settings;
  readonly ChevronLeft  = ChevronLeft;
  readonly ChevronRight = ChevronRight;
  readonly ChevronDown  = ChevronDown;
  readonly Search       = Search;
  readonly User         = User;
  readonly HelpCircle   = HelpCircle;
  readonly CheckCircle  = CheckCircle2;
  readonly Wallet       = Wallet;
  readonly MessageCircle = MessageCircle;
  readonly CalendarPlus = CalendarPlus;

  readonly userInitials = computed(() => {
    const name = this.auth.currentUser()?.full_name ?? '';
    if (!name) return 'KI';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last  = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase().slice(0, 2);
  });

  toggleMenu(): void { this.menuOpen.update((v) => !v); }
  closeMenu(): void  { this.menuOpen.set(false); }

  toggleProfileMenu(): void {
    this.profileMenuOpen.update((v) => !v);
    if (this.profileMenuOpen()) this.notifMenuOpen.set(false);
  }

  toggleNotifMenu(): void {
    this.notifMenuOpen.update((v) => !v);
    if (this.notifMenuOpen()) this.profileMenuOpen.set(false);
  }

  closeAllPopovers(): void {
    this.profileMenuOpen.set(false);
    this.notifMenuOpen.set(false);
  }

  unreadCount(): number {
    return this.notif.unread();
  }

  /**
   * Click on a notification row in the bell dropdown.
   * Marks it read (optimistic, then API) and navigates to its link if any.
   */
  openNotification(id: string, link: string | null): void {
    this.notif.markRead(id);
    this.closeAllPopovers();
    if (link) this.router.navigateByUrl(link);
  }

  /** "Mark all as read" inside the bell popover. */
  markAllNotificationsRead(event: Event): void {
    event.stopPropagation();
    this.notif.markAllRead();
  }

  /** Locale-aware "fa 12 min" / "hace 1 día" / "2 days ago". */
  formatNotifTime(iso: string): string {
    const lang = (typeof document !== 'undefined' && document.documentElement.lang) || 'ca';
    const localeMap: Record<string, string> = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' };
    const locale = localeMap[lang] ?? 'ca-ES';
    const rtf = new Intl.RelativeTimeFormat(locale, { numeric: 'auto', style: 'long' });
    const diffSec = Math.round((new Date(iso).getTime() - Date.now()) / 1000);
    const abs = Math.abs(diffSec);
    if (abs < 3600)         return rtf.format(Math.round(diffSec / 60), 'minute');
    if (abs < 86400)        return rtf.format(Math.round(diffSec / 3600), 'hour');
    if (abs < 30 * 86400)   return rtf.format(Math.round(diffSec / 86400), 'day');
    return new Date(iso).toLocaleDateString(locale);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(SIDEBAR_KEY, this.sidebarCollapsed() ? '1' : '0');
    }
  }

  logout(): void {
    // Stop the notifications poll before logging out so we don't keep
    // hammering /me with a soon-to-be-stale token.
    this.notif.reset();
    this.auth.logout();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}

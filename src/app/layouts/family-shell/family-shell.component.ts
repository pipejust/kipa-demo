import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import {
  LucideAngularModule,
  Home,
  FileText,
  CreditCard,
  Settings,
  CalendarDays,
  FolderOpen,
  LogOut,
  Menu,
  X,
  Bell,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthService } from '../../core/auth/auth.service';
import { KipaLogoComponent } from '../../shared/components/kipa-logo.component';
import { LangSwitcherComponent } from '../../shared/components/lang-switcher.component';

interface FamilyNavItem {
  path: string;
  labelKey: string;
  icon: typeof Home;
}

@Component({
  selector: 'kipa-family-shell',
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
  templateUrl: './family-shell.component.html',
  styleUrl: './family-shell.component.scss',
})
export class FamilyShellComponent {
  protected readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  readonly menuOpen = signal(false);

  readonly LogOut    = LogOut;
  readonly Menu      = Menu;
  readonly Close     = X;
  readonly Bell      = Bell;

  readonly navItems: FamilyNavItem[] = [
    { path: '/f/inicio',       labelKey: 'nav.home',         icon: Home },
    { path: '/f/admisions',    labelKey: 'nav.admissions',   icon: FileText },
    { path: '/f/pagos',        labelKey: 'nav.payments',     icon: CreditCard },
    { path: '/f/preferencias', labelKey: 'nav.preferences',  icon: Settings },
    { path: '/f/agenda',       labelKey: 'nav.agenda',       icon: CalendarDays },
    { path: '/f/documents',    labelKey: 'nav.documents',    icon: FolderOpen },
  ];

  readonly userInitials = computed(() => {
    const name = this.auth.currentUser()?.full_name ?? '';
    if (!name) return 'F';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last  = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase().slice(0, 2);
  });

  toggleMenu(): void { this.menuOpen.update((v) => !v); }
  closeMenu(): void  { this.menuOpen.set(false); }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}

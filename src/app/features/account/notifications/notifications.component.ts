import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  LucideAngularModule,
  ChevronRight,
  CheckCircle2,
  MessageCircle,
  Wallet,
  CalendarPlus,
  Bell,
  Inbox,
  CheckCheck,
  Trash2,
  Plus,
  X,
  Send,
} from 'lucide-angular';

import { AuthService } from '../../../core/auth/auth.service';
import {
  BroadcastScope,
  NotificationKind,
  NotificationOut,
  NotificationsApiService,
} from '../../notifications/notifications-api.service';
import { NotificationsStoreService } from '../../notifications/notifications-store.service';

type NotifFilter = 'all' | 'unread' | 'admission' | 'message' | 'payment';
type Bucket = 'today' | 'yesterday' | 'week' | 'older';

@Component({
  selector: 'kipa-notifications',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, TranslocoModule],
  templateUrl: './notifications.component.html',
  styleUrl: './notifications.component.scss',
})
export class NotificationsComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  protected readonly store = inject(NotificationsStoreService);
  private readonly api = inject(NotificationsApiService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly t = inject(TranslocoService);

  // Icons
  readonly ChevronRightIcon = ChevronRight;
  readonly CheckCircleIcon = CheckCircle2;
  readonly MessageIcon = MessageCircle;
  readonly WalletIcon = Wallet;
  readonly CalendarPlusIcon = CalendarPlus;
  readonly BellIcon = Bell;
  readonly InboxIcon = Inbox;
  readonly CheckCheckIcon = CheckCheck;
  readonly TrashIcon = Trash2;
  readonly PlusIcon = Plus;
  readonly XIcon = X;
  readonly SendIcon = Send;

  // ─── Filter + derived buckets ─────────────────────────────────────────────
  readonly filter = signal<NotifFilter>('all');

  readonly counts = computed(() => {
    const all = this.store.items();
    return {
      total:     this.store.total(),
      unread:    this.store.unread(),
      admission: all.filter((n) => n.kind === 'admission').length,
      message:   all.filter((n) => n.kind === 'message').length,
      payment:   all.filter((n) => n.kind === 'payment').length,
    };
  });

  readonly filtered = computed(() => {
    const all = this.store.items();
    const f = this.filter();
    if (f === 'all')    return all;
    if (f === 'unread') return all.filter((n) => !n.read_at);
    return all.filter((n) => n.kind === f);
  });

  readonly groupedToday     = computed(() => this._bucket('today'));
  readonly groupedYesterday = computed(() => this._bucket('yesterday'));
  readonly groupedWeek      = computed(() => this._bucket('week'));
  readonly groupedOlder     = computed(() => this._bucket('older'));

  // ─── Broadcast modal state ────────────────────────────────────────────────
  readonly broadcastOpen = signal(false);
  readonly broadcasting  = signal(false);

  readonly broadcastForm = this.fb.nonNullable.group({
    title: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(200)]],
    body:  ['', [Validators.maxLength(2000)]],
    link:  [''],
    kind:  ['announcement' as NotificationKind],
    scope: ['admins' as BroadcastScope],
  });

  readonly toast = signal<{ kind: 'success' | 'error'; msg: string } | null>(null);

  // ─── Lifecycle ────────────────────────────────────────────────────────────
  ngOnInit(): void {
    // Boot the store and force a fresh fetch when the user opens this page.
    this.store.initOnce();
    this.store.refresh();
  }

  setFilter(f: NotifFilter): void { this.filter.set(f); }

  // ─── Click handlers ───────────────────────────────────────────────────────
  /** Click an item: mark read + navigate (if it has a link). */
  onItemClick(n: NotificationOut): void {
    this.store.markRead(n.id);
    if (n.link) {
      this.router.navigateByUrl(n.link);
    }
  }

  markAllRead(): void {
    if (this.counts().unread === 0) return;
    this.store.markAllRead();
  }

  remove(n: NotificationOut, event: Event): void {
    event.stopPropagation();
    this.store.remove(n.id);
  }

  markRead(n: NotificationOut, event: Event): void {
    event.stopPropagation();
    this.store.markRead(n.id);
  }

  // ─── Broadcast modal ──────────────────────────────────────────────────────
  openBroadcast(): void {
    this.broadcastForm.reset({
      title: '',
      body: '',
      link: '',
      kind: 'announcement',
      scope: 'admins',
    });
    this.broadcastOpen.set(true);
  }

  closeBroadcast(): void { this.broadcastOpen.set(false); }

  submitBroadcast(): void {
    if (this.broadcasting()) return;
    if (this.broadcastForm.invalid) {
      this.broadcastForm.markAllAsTouched();
      return;
    }
    const v = this.broadcastForm.getRawValue();
    this.broadcasting.set(true);
    this.api.broadcast({
      title: v.title.trim(),
      body:  v.body.trim() || undefined,
      link:  v.link.trim() || null,
      kind:  v.kind,
      scope: v.scope,
    }).subscribe({
      next: (res) => {
        this.broadcasting.set(false);
        this.closeBroadcast();
        this._notify('success',
          this.t.translate('account.notifications.broadcastSent', { count: res.created }),
        );
        this.store.refresh();
      },
      error: () => {
        this.broadcasting.set(false);
        this._notify('error', this.t.translate('account.notifications.broadcastFailed'));
      },
    });
  }

  // ─── Display helpers ──────────────────────────────────────────────────────
  formatRelativeTime(iso: string): string {
    const lang = this.t.getActiveLang();
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

  // ─── internals ────────────────────────────────────────────────────────────
  private _bucket(target: Bucket): NotificationOut[] {
    return this.filtered().filter((n) => this._bucketOf(n.created_at) === target);
  }

  private _bucketOf(iso: string): Bucket {
    const created = new Date(iso);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);
    const startOfWeek = new Date(startOfToday); startOfWeek.setDate(startOfWeek.getDate() - 7);

    if (created >= startOfToday)     return 'today';
    if (created >= startOfYesterday) return 'yesterday';
    if (created >= startOfWeek)      return 'week';
    return 'older';
  }

  private _notify(kind: 'success' | 'error', msg: string): void {
    this.toast.set({ kind, msg });
    setTimeout(() => this.toast.set(null), 4000);
  }
}

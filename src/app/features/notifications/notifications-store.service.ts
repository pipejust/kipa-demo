/**
 * NotificationsStoreService — small reactive cache shared by the bell
 * dropdown and the full inbox page.
 *
 * Holds the last-fetched list and unread count as signals, refreshes them
 * on demand (after a click that mutates server state) and on a periodic
 * 60-second poll. Components subscribe to the signals and stay in sync
 * automatically — no need to coordinate refreshes manually.
 */
import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, interval, switchMap, tap } from 'rxjs';

import {
  NotificationOut,
  NotificationsApiService,
} from './notifications-api.service';

const POLL_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class NotificationsStoreService {
  private readonly api = inject(NotificationsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly items = signal<NotificationOut[]>([]);
  readonly total = signal(0);
  readonly unread = signal(0);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  /** First N items for the bell dropdown — cheap to derive on the fly. */
  readonly bellItems = computed(() => this.items().slice(0, 5));

  /** Manual refresh trigger (callable from anywhere). */
  private readonly refresh$ = new Subject<void>();

  private _initialised = false;

  /**
   * Idempotent bootstrap. Call once when the user is authenticated;
   * subsequent calls are no-ops. Sets up the poll + an initial fetch.
   */
  initOnce(): void {
    if (this._initialised) return;
    this._initialised = true;

    // Initial fetch.
    this.refresh();

    // Periodic poll.
    interval(POLL_MS)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refresh());

    // Manual refresh requests.
    this.refresh$
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        tap(() => this.loading.set(true)),
        switchMap(() => this.api.list({ limit: 50 })),
      )
      .subscribe({
        next: (res) => {
          this.items.set(res.items);
          this.total.set(res.total);
          this.unread.set(res.unread);
          this.loading.set(false);
          this.error.set(null);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set(err?.message ?? 'failed');
        },
      });
  }

  /** Force a refresh now — used after marking read / deleting / broadcasting. */
  refresh(): void {
    this.refresh$.next();
  }

  /** Reset state (e.g. on logout). */
  reset(): void {
    this.items.set([]);
    this.total.set(0);
    this.unread.set(0);
  }

  // ─── Mutations: optimistic updates so the UI reacts instantly,
  //               then refresh from server to reconcile ────────────────────
  markRead(id: string): void {
    // Optimistic
    const now = new Date().toISOString();
    let wasUnread = false;
    this.items.update((list) =>
      list.map((n) => {
        if (n.id === id && n.read_at === null) {
          wasUnread = true;
          return { ...n, read_at: now };
        }
        return n;
      }),
    );
    if (wasUnread) this.unread.update((c) => Math.max(0, c - 1));

    this.api.markRead(id).subscribe({
      // Reconcile in case the optimistic state diverged
      next: () => this.refresh(),
      error: () => this.refresh(),
    });
  }

  markAllRead(): void {
    // Optimistic: every item gets read_at and unread becomes 0
    const now = new Date().toISOString();
    this.items.update((list) =>
      list.map((n) => (n.read_at === null ? { ...n, read_at: now } : n)),
    );
    this.unread.set(0);

    this.api.markAllRead().subscribe({
      next: () => this.refresh(),
      error: () => this.refresh(),
    });
  }

  remove(id: string): void {
    const removed = this.items().find((n) => n.id === id);
    this.items.update((list) => list.filter((n) => n.id !== id));
    if (removed && removed.read_at === null) {
      this.unread.update((c) => Math.max(0, c - 1));
    }
    this.total.update((c) => Math.max(0, c - 1));

    this.api.remove(id).subscribe({
      next: () => this.refresh(),
      error: () => this.refresh(),
    });
  }
}

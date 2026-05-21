import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, Plus, CalendarDays, Users, MapPin, Clock, MoreVertical } from 'lucide-angular';

interface KidsEvent {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: 'classroom' | 'family' | 'school' | 'health';
  participantsAssigned: number;
  participantsConfirmed: number;
  participantsCapacity: number;
  price: number | null;
  status: 'draft' | 'published' | 'closed';
}

@Component({
  selector: 'kipa-events-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslocoModule],
  template: `
    <section class="kds-page events-page">
      <header class="kds-page-header">
        <div>
          <h1 class="kds-page-title">{{ 'events.title' | transloco }}</h1>
          <p class="kds-page-subtitle">{{ 'events.subtitle' | transloco }}</p>
        </div>
        <button type="button" class="k-btn k-btn--primary" (click)="newEvent()">
          <lucide-icon [img]="PlusIcon" />
          {{ 'events.new' | transloco }}
        </button>
      </header>

      <div class="kds-kpi-grid">
        <div class="kds-stat-card">
          <span class="kds-stat-card__label">{{ 'events.stats.upcoming' | transloco }}</span>
          <span class="kds-stat-card__value">{{ upcoming() }}</span>
        </div>
        <div class="kds-stat-card">
          <span class="kds-stat-card__label">{{ 'events.stats.confirmedRate' | transloco }}</span>
          <span class="kds-stat-card__value">{{ confirmedRate() }}%</span>
        </div>
        <div class="kds-stat-card">
          <span class="kds-stat-card__label">{{ 'events.stats.published' | transloco }}</span>
          <span class="kds-stat-card__value">{{ publishedCount() }}</span>
        </div>
        <div class="kds-stat-card">
          <span class="kds-stat-card__label">{{ 'events.stats.totalRevenue' | transloco }}</span>
          <span class="kds-stat-card__value">{{ totalRevenue() | number:'1.2-2' }} €</span>
        </div>
      </div>

      <nav class="events-tabs">
        @for (s of statuses; track s) {
          <button
            type="button"
            class="events-tab"
            [class.events-tab--active]="filterStatus() === s"
            (click)="filterStatus.set(s)"
          >
            {{ ('events.tabs.' + s) | transloco }}
            <span class="events-tab__count">{{ countOf(s) }}</span>
          </button>
        }
      </nav>

      <ul class="events-grid">
        @for (e of filtered(); track e.id) {
          <li class="event-card">
            <header class="event-card__head">
              <span class="event-card__cat" [ngStyle]="{ background: catColor(e.category), color: '#fff' }">
                {{ ('events.categories.' + e.category) | transloco }}
              </span>
              <button type="button" class="event-card__menu" (click)="actionMenu(e)">
                <lucide-icon [img]="MoreIcon" />
              </button>
            </header>
            <h3 class="event-card__title">{{ e.title }}</h3>
            <p class="event-card__desc">{{ e.description }}</p>
            <dl class="event-card__meta">
              <div><dt><lucide-icon [img]="CalendarIcon" /></dt><dd>{{ e.date }}</dd></div>
              <div><dt><lucide-icon [img]="ClockIcon" /></dt><dd>{{ e.time }}</dd></div>
              <div><dt><lucide-icon [img]="MapIcon" /></dt><dd>{{ e.location }}</dd></div>
            </dl>
            <footer class="event-card__foot">
              <div class="event-card__seats">
                <lucide-icon [img]="UsersIcon" />
                <span>
                  <strong>{{ e.participantsConfirmed }}</strong> / {{ e.participantsCapacity }}
                  · {{ 'events.confirmed' | transloco }}
                </span>
                <div class="event-card__bar">
                  <div class="event-card__bar-fill" [style.width.%]="(e.participantsConfirmed / e.participantsCapacity) * 100"></div>
                </div>
              </div>
              <span class="event-card__price">
                @if (e.price !== null && e.price > 0) {
                  {{ e.price | number:'1.2-2' }} €
                } @else {
                  {{ 'events.free' | transloco }}
                }
              </span>
            </footer>
          </li>
        } @empty {
          <li class="kds-empty">
            <p class="kds-empty__title">{{ 'events.empty' | transloco }}</p>
          </li>
        }
      </ul>
    </section>
  `,
  styles: [`
    :host { display: block; }
    .events-page { display: grid; gap: var(--kids-space-5); padding: var(--kids-space-6) 0; }
    .events-tabs {
      display: flex; gap: 2px;
      border-bottom: 2px solid var(--kids-line);
    }
    .events-tab {
      padding: 10px 16px;
      background: transparent; border: 0; cursor: pointer;
      font-size: var(--kids-text-sm);
      font-weight: var(--kids-w-medium);
      color: var(--kids-slate);
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      display: inline-flex; align-items: center; gap: 6px;
      &__count {
        display: inline-flex; align-items: center; justify-content: center;
        min-width: 22px; padding: 0 6px; height: 20px;
        background: var(--kids-navy-50);
        border-radius: 999px;
        font-size: var(--kids-text-xs);
        font-weight: var(--kids-w-bold);
        color: var(--kids-navy);
      }
      &--active {
        color: var(--kids-navy);
        font-weight: var(--kids-w-semi);
        border-bottom-color: var(--kids-green);
      }
    }
    .events-grid {
      list-style: none; margin: 0; padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: var(--kids-space-4);
    }
    .event-card {
      background: var(--kids-paper);
      border: 1px solid var(--kids-line);
      border-radius: var(--kids-radius-lg);
      padding: var(--kids-space-5);
      box-shadow: var(--kids-shadow-sm);
      display: grid; gap: var(--kids-space-3);
      transition: transform var(--kids-dur) var(--kids-ease), box-shadow var(--kids-dur) var(--kids-ease);
      &:hover { transform: translateY(-2px); box-shadow: var(--kids-shadow-md); }

      &__head {
        display: flex; align-items: center; justify-content: space-between;
      }
      &__cat {
        display: inline-flex; align-items: center;
        padding: 4px 10px; border-radius: 999px;
        font-size: var(--kids-text-xs);
        font-weight: var(--kids-w-semi);
      }
      &__menu {
        background: transparent; border: 0; cursor: pointer;
        color: var(--kids-slate); padding: 4px;
        border-radius: 50%;
        &:hover { background: var(--kids-navy-50); color: var(--kids-navy); }
        lucide-icon { width: 16px; height: 16px; }
      }
      &__title {
        margin: 0;
        font-family: var(--kids-font-display);
        font-size: var(--kids-text-md);
        font-weight: var(--kids-w-semi);
        color: var(--kids-navy);
      }
      &__desc {
        margin: 0; color: var(--kids-slate);
        font-size: var(--kids-text-sm); line-height: 1.5;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      &__meta {
        margin: 0; display: grid; gap: 6px;
        div { display: flex; gap: 8px; align-items: center; color: var(--kids-slate); font-size: var(--kids-text-sm); }
        dt { margin: 0; lucide-icon { width: 14px; height: 14px; color: var(--kids-muted); } }
        dd { margin: 0; }
      }
      &__foot {
        display: grid; gap: 6px;
        padding-top: var(--kids-space-3);
        border-top: 1px solid var(--kids-line);
      }
      &__seats {
        display: grid; gap: 4px;
        font-size: var(--kids-text-sm); color: var(--kids-slate);
        > lucide-icon { width: 14px; height: 14px; color: var(--kids-muted); }
        span { display: inline-flex; gap: 4px; align-items: center; }
        strong { color: var(--kids-navy); }
      }
      &__bar {
        height: 6px; background: var(--kids-line);
        border-radius: 999px; overflow: hidden;
      }
      &__bar-fill {
        height: 100%; background: var(--kids-green);
        border-radius: 999px;
      }
      &__price {
        text-align: right;
        font-family: var(--kids-font-display);
        font-weight: var(--kids-w-semi);
        color: var(--kids-navy);
        font-size: var(--kids-text-md);
      }
    }
  `],
})
export class EventsListComponent {
  readonly PlusIcon = Plus;
  readonly CalendarIcon = CalendarDays;
  readonly UsersIcon = Users;
  readonly MapIcon = MapPin;
  readonly ClockIcon = Clock;
  readonly MoreIcon = MoreVertical;

  readonly statuses = ['all', 'published', 'draft', 'closed'] as const;
  readonly filterStatus = signal<'all' | 'published' | 'draft' | 'closed'>('all');

  readonly events = signal<KidsEvent[]>(this.seed());

  readonly filtered = computed(() => {
    const s = this.filterStatus();
    return s === 'all' ? this.events() : this.events().filter((e) => e.status === s);
  });

  readonly upcoming = computed(() => this.events().filter((e) => e.status === 'published').length);
  readonly publishedCount = computed(() => this.events().filter((e) => e.status === 'published').length);
  readonly confirmedRate = computed(() => {
    const list = this.events().filter((e) => e.status === 'published');
    if (list.length === 0) return 0;
    const total = list.reduce((s, e) => s + e.participantsCapacity, 0);
    const confirmed = list.reduce((s, e) => s + e.participantsConfirmed, 0);
    return Math.round((confirmed / Math.max(1, total)) * 100);
  });
  readonly totalRevenue = computed(() =>
    this.events()
      .filter((e) => e.status === 'published' && e.price !== null)
      .reduce((s, e) => s + (e.price! * e.participantsConfirmed), 0));

  countOf(s: string): number {
    return s === 'all' ? this.events().length : this.events().filter((e) => e.status === s).length;
  }

  catColor(c: string): string {
    return c === 'classroom' ? '#4FB3E6'
         : c === 'family' ? '#E85A9B'
         : c === 'school' ? '#1F8E5A'
                          : '#F3B337';
  }

  newEvent(): void {
    alert('En la versió real, aquí s\'obriria un formulari multistep per crear un esdeveniment nou amb assignació d\'alumnes, professors, acompanyants i pagaments.');
  }

  actionMenu(e: KidsEvent): void {
    alert(`Accions per a "${e.title}":\n· Editar\n· Duplicar\n· Tancar inscripcions\n· Enviar recordatori\n· Eliminar`);
  }

  private seed(): KidsEvent[] {
    const today = new Date();
    const plus = (n: number) => {
      const d = new Date(today); d.setDate(d.getDate() + n);
      return d.toLocaleDateString('ca-ES', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    return [
      { id: 'ev1', title: 'Sortida al bosc', description: 'Activitat de descoberta de la natura amb la classe Butterflies. Inclou pícnic.', date: plus(2),  time: '09:30 - 16:00', location: 'Bosc de la Margineda', category: 'classroom', participantsAssigned: 22, participantsConfirmed: 18, participantsCapacity: 22, price: 15, status: 'published' },
      { id: 'ev2', title: 'Taller de cuina en família', description: 'Pares i mares benvinguts. Galetes de civada amb els petits.', date: plus(5),  time: '17:30 - 19:00', location: 'Aula multifunció', category: 'family',    participantsAssigned: 30, participantsConfirmed: 24, participantsCapacity: 30, price: 0, status: 'published' },
      { id: 'ev3', title: 'Festa de primavera', description: 'Festa anual amb actuacions, berenar i música. Obert a tota la comunitat.', date: plus(12), time: '16:00 - 19:30', location: 'Pati exterior', category: 'school', participantsAssigned: 120, participantsConfirmed: 87, participantsCapacity: 150, price: 0, status: 'published' },
      { id: 'ev4', title: 'Excursió al Museu Nacional', description: 'Visita guiada amb taller didàctic per a P3-P4.', date: plus(20), time: '09:00 - 16:30', location: 'Andorra la Vella', category: 'school', participantsAssigned: 40, participantsConfirmed: 35, participantsCapacity: 40, price: 12, status: 'published' },
      { id: 'ev5', title: 'Setmana del llibre', description: 'Activitats temàtiques de lectura durant tota la setmana.', date: plus(40), time: 'Tot el dia', location: 'Tot el centre', category: 'school', participantsAssigned: 0, participantsConfirmed: 0, participantsCapacity: 150, price: 0, status: 'draft' },
      { id: 'ev6', title: 'Vacuna grip estacional', description: 'Campanya voluntària amb consentiment previ.', date: plus(25), time: '10:00 - 12:00', location: 'Sala mèdica', category: 'health', participantsAssigned: 65, participantsConfirmed: 40, participantsCapacity: 80, price: 0, status: 'published' },
      { id: 'ev7', title: 'Festa de Halloween', description: 'Disfresses, photocall i tallers de manualitats.', date: '31 oct 2024', time: '16:00 - 19:00', location: 'Pati exterior', category: 'school', participantsAssigned: 100, participantsConfirmed: 95, participantsCapacity: 100, price: 5, status: 'closed' },
    ];
  }
}

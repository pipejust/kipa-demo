import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import { LucideAngularModule, CalendarDays, MapPin, Clock, ChevronRight } from 'lucide-angular';

interface AgendaEvent {
  id: string;
  date: string;          // ISO yyyy-mm-dd
  time: string;          // HH:mm
  title: string;
  location: string;
  category: 'classroom' | 'family' | 'school' | 'health';
  description: string;
}

@Component({
  selector: 'kipa-family-agenda',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslocoModule],
  template: `
    <section class="agenda-page">
      <header class="agenda-page__header">
        <h1 class="kds-page-title">{{ 'familyAgenda.title' | transloco }}</h1>
        <p class="kds-page-subtitle">{{ 'familyAgenda.subtitle' | transloco }}</p>
      </header>

      <div class="agenda-toolbar">
        <div class="agenda-filters">
          @for (cat of categories; track cat.key) {
            <button
              type="button"
              class="agenda-chip"
              [class.agenda-chip--active]="activeCategory() === cat.key"
              (click)="toggleCategory(cat.key)"
            >
              <span class="agenda-chip__dot" [ngStyle]="{ background: cat.color }"></span>
              {{ ('familyAgenda.categories.' + cat.key) | transloco }}
            </button>
          }
        </div>
      </div>

      @if (groupedByMonth().length === 0) {
        <div class="kds-empty">
          <lucide-icon class="kds-empty__icon" [img]="Calendar" />
          <p class="kds-empty__title">{{ 'familyAgenda.empty' | transloco }}</p>
        </div>
      } @else {
        @for (group of groupedByMonth(); track group.month) {
          <section class="agenda-month">
            <h2 class="agenda-month__title">{{ group.month }}</h2>
            <ul class="agenda-list">
              @for (e of group.events; track e.id) {
                <li class="agenda-card">
                  <div class="agenda-card__date">
                    <span class="agenda-card__day">{{ dayOf(e.date) }}</span>
                    <span class="agenda-card__dow">{{ dowOf(e.date) }}</span>
                  </div>
                  <div class="agenda-card__body">
                    <header class="agenda-card__head">
                      <h3 class="agenda-card__title">{{ e.title }}</h3>
                      <span class="agenda-card__chip"
                        [ngStyle]="{ background: colorFor(e.category), color: '#fff' }">
                        {{ ('familyAgenda.categories.' + e.category) | transloco }}
                      </span>
                    </header>
                    <p class="agenda-card__meta">
                      <span><lucide-icon [img]="Clock" /> {{ e.time }}</span>
                      <span><lucide-icon [img]="MapPin" /> {{ e.location }}</span>
                    </p>
                    <p class="agenda-card__desc">{{ e.description }}</p>
                  </div>
                </li>
              }
            </ul>
          </section>
        }
      }
    </section>
  `,
  styleUrl: './family-agenda.component.scss',
})
export class FamilyAgendaComponent {
  private readonly transloco = inject(TranslocoService);

  readonly Calendar = CalendarDays;
  readonly Clock = Clock;
  readonly MapPin = MapPin;
  readonly Chevron = ChevronRight;

  readonly categories = [
    { key: 'classroom' as const, color: '#4FB3E6' },
    { key: 'family'    as const, color: '#E85A9B' },
    { key: 'school'    as const, color: '#1F8E5A' },
    { key: 'health'    as const, color: '#F3B337' },
  ];

  readonly activeCategory = signal<string | null>(null);

  /** Synthesise upcoming events relative to today so the agenda always looks fresh. */
  private readonly allEvents = signal<AgendaEvent[]>(this._seed());

  readonly filteredEvents = computed(() => {
    const cat = this.activeCategory();
    const all = this.allEvents();
    return cat ? all.filter((e) => e.category === cat) : all;
  });

  readonly groupedByMonth = computed(() => {
    const lang = this.transloco.getActiveLang();
    const out: { month: string; events: AgendaEvent[] }[] = [];
    const map = new Map<string, AgendaEvent[]>();
    for (const e of this.filteredEvents()) {
      const d = new Date(e.date);
      const key = d.toLocaleDateString(lang, { month: 'long', year: 'numeric' });
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(e);
    }
    for (const [month, events] of map.entries()) out.push({ month, events });
    return out;
  });

  toggleCategory(key: string): void {
    this.activeCategory.update((cur) => (cur === key ? null : key));
  }

  dayOf(iso: string): string {
    return new Date(iso).getDate().toString().padStart(2, '0');
  }
  dowOf(iso: string): string {
    return new Date(iso).toLocaleDateString(this.transloco.getActiveLang(), { weekday: 'short' });
  }
  colorFor(cat: string): string {
    return this.categories.find((c) => c.key === cat)?.color ?? '#1F3A7A';
  }

  private _seed(): AgendaEvent[] {
    const today = new Date();
    const plus = (d: number) => {
      const x = new Date(today); x.setDate(x.getDate() + d); return x.toISOString().slice(0, 10);
    };
    return [
      { id: 'e1', date: plus(2),  time: '09:30', title: 'Sortida al bosc', location: 'Bosc de la Margineda', category: 'classroom', description: 'Activitat de descoberta de la natura amb la classe Butterflies. Cal portar gorra i botella d\'aigua.' },
      { id: 'e2', date: plus(5),  time: '17:30', title: 'Taller de cuina en família', location: 'Aula multifunció', category: 'family',    description: 'Pares i mares benvinguts. Farem galetes de civada amb els petits.' },
      { id: 'e3', date: plus(8),  time: '11:00', title: 'Revisió pediàtrica', location: 'Sala mèdica', category: 'health',    description: 'Control rutinari per als alumnes de P3. Dura aproximadament 15 minuts.' },
      { id: 'e4', date: plus(12), time: '16:00', title: 'Festa de primavera', location: 'Pati exterior', category: 'school',    description: 'Festa anual amb actuacions dels alumnes, berenar i música. Obert a tota la comunitat.' },
      { id: 'e5', date: plus(18), time: '09:00', title: 'Reunió pedagògica', location: 'Sala de mestres', category: 'family',    description: 'Trobada amb la mestra Anna per parlar de l\'evolució del trimestre.' },
      { id: 'e6', date: plus(25), time: '10:00', title: 'Vacuna grip estacional', location: 'Sala mèdica', category: 'health',    description: 'Campanya voluntària amb consentiment previ dels tutors.' },
      { id: 'e7', date: plus(32), time: '15:30', title: 'Excursió al MuseuNacional', location: 'Andorra la Vella', category: 'school',    description: 'Visita guiada al MuseuNacional. Sortida a les 9:00 i tornada a les 16:30.' },
    ];
  }
}

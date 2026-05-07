import { CommonModule, DecimalPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import {
  Component,
  computed,
  inject,
  signal,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';
import {
  LucideAngularModule,
  Users,
  FileText,
  ClipboardCheck,
  Wallet,
  CheckCircle2,
  MessageCircle,
  CalendarPlus,
  ChevronRight,
  ChevronDown,
  ArrowRight,
  UserPlus,
  CalendarCheck,
  Send,
  CreditCard,
  BarChart3,
} from 'lucide-angular';

import { AuthService } from '../../core/auth/auth.service';
import { KpiService, KpiSummary } from './kpi.service';

type ActivityKind = 'attendance' | 'admission' | 'message' | 'payment' | 'interview';

interface ActivityItem {
  kind: ActivityKind;
  title: string;
  meta: string;
  status: 'completed' | 'pending' | 'sent' | 'scheduled';
  avatar?: string;        // avatar initials (admissió shows family avatar)
}

interface UpcomingItem {
  day: string;            // "20"
  month: string;          // "MAI"
  title: string;          // "Emma Rodríguez"
  level: string;          // "P2"
  time: string;           // "9:00"
  family: string;         // "Maria López"
  status: 'confirmed' | 'pending';
}

interface QuickAction {
  titleKey: string;
  subtitleKey: string;
  link: string;
  color: 'sky' | 'green' | 'sky-soft' | 'mustard' | 'pink' | 'purple';
  icon: typeof Users;
}

@Component({
  selector: 'kipa-admin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, DecimalPipe, TranslocoModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrl: './admin-dashboard.component.scss',
})
export class AdminDashboardComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly kpiService = inject(KpiService);
  private readonly transloco = inject(TranslocoService);

  // Icons exposed to the template
  readonly UsersIcon          = Users;
  readonly FileTextIcon       = FileText;
  readonly ClipboardCheckIcon = ClipboardCheck;
  readonly WalletIcon         = Wallet;
  readonly CheckCircleIcon    = CheckCircle2;
  readonly MessageIcon        = MessageCircle;
  readonly CalendarPlusIcon   = CalendarPlus;
  readonly ChevronRightIcon   = ChevronRight;
  readonly ChevronDownIcon    = ChevronDown;
  readonly ArrowRightIcon     = ArrowRight;
  readonly UserPlusIcon       = UserPlus;
  readonly CalendarCheckIcon  = CalendarCheck;
  readonly SendIcon           = Send;
  readonly CreditCardIcon     = CreditCard;
  readonly BarChartIcon       = BarChart3;

  readonly summary    = signal<KpiSummary | null>(null);
  readonly loading    = signal(true);
  readonly error      = signal<string | null>(null);
  readonly refreshing = signal(false);

  // ── Demo data shaped to match the handoff mockup ──────────────────────────
  readonly recentActivity: ActivityItem[] = [
    { kind: 'attendance', title: "Assistència enregistrada", meta: "Classe Butterflies · Avui 09:15", status: 'completed' },
    { kind: 'admission',  title: "Nova admissió rebuda",     meta: "Martina López · P2 · Avui 08:42", status: 'pending', avatar: 'ML' },
    { kind: 'message',    title: "Missatge enviat a famílies", meta: "Recordatori: Reunió de pares · Ahir 17:30", status: 'sent' },
    { kind: 'payment',    title: "Pagament rebut",            meta: "Família Garcia · 120,00 € · Ahir 14:22", status: 'completed' },
    { kind: 'interview',  title: "Entrevista programada",     meta: "Lucas Martín · P3 · 27 maig, 10:00", status: 'scheduled' },
  ];

  readonly upcomingInterviews: UpcomingItem[] = [
    { day: '20', month: 'MAI', title: 'Emma Rodríguez',  level: 'P2', time: '9:00',  family: 'Maria López',    status: 'confirmed' },
    { day: '21', month: 'MAI', title: 'Noah García',      level: 'P3', time: '11:30', family: 'Carlos García',  status: 'pending'   },
    { day: '23', month: 'MAI', title: 'Sofia Torres',     level: 'P2', time: '15:00', family: 'Laura Torres',   status: 'confirmed' },
    { day: '24', month: 'MAI', title: 'Mateo Fernández',  level: 'P1', time: '10:00', family: 'Ana Fernández',  status: 'pending'   },
  ];

  readonly quickActions: QuickAction[] = [
    { titleKey: 'dashActions.addStudent',         subtitleKey: 'dashActions.addStudentSub',         link: '/a/alumnos',        color: 'sky',       icon: UserPlus      },
    { titleKey: 'dashActions.scheduleInterview',  subtitleKey: 'dashActions.scheduleInterviewSub',  link: '/a/admissions',     color: 'green',     icon: CalendarCheck },
    { titleKey: 'dashActions.sendMessage',        subtitleKey: 'dashActions.sendMessageSub',        link: '/a/comunicaciones', color: 'sky-soft',  icon: Send          },
    { titleKey: 'dashActions.attendanceReport',   subtitleKey: 'dashActions.attendanceReportSub',   link: '/a/asistencia',     color: 'mustard',   icon: FileText      },
    { titleKey: 'dashActions.registerPayment',    subtitleKey: 'dashActions.registerPaymentSub',    link: '/a/finanzas',       color: 'pink',      icon: CreditCard    },
    { titleKey: 'dashActions.viewReports',        subtitleKey: 'dashActions.viewReportsSub',        link: '/a/dashboard',      color: 'purple',    icon: BarChart3     },
  ];

  // ── Derived ────────────────────────────────────────────────────────────────
  readonly firstName = computed(() => {
    const name = this.auth.currentUser()?.full_name ?? '';
    return name.trim().split(/\s+/)[0] || 'Hola';
  });

  ngOnInit(): void {
    this._loadSummary();
  }

  private _loadSummary(): void {
    this.loading.set(true);
    this.error.set(null);

    this.kpiService.getSummary().subscribe({
      next: (data) => {
        this.summary.set(data);
        this.loading.set(false);
      },
      error: (err: HttpErrorResponse) => {
        if (err.status === 404) {
          this.summary.set(null);
          this.loading.set(false);
        } else {
          this.error.set(err.message || 'Error desconegut');
          this.loading.set(false);
        }
      },
    });
  }

  triggerRefresh(): void {
    this.refreshing.set(true);
    this.kpiService.refresh().subscribe({
      next: () => {
        this.refreshing.set(false);
        this._loadSummary();
      },
      error: () => this.refreshing.set(false),
    });
  }

  collectionPct(s: KpiSummary): number {
    const total = s.total_cobrado + s.total_pendiente;
    if (!total) return 0;
    return Math.min(100, (s.total_cobrado / total) * 100);
  }

  occupancyDelta(s: KpiSummary): number {
    return Math.max(0, s.matriculados - Math.max(0, s.total_alumnos - s.matriculados));
  }

  attendancePresentToday(s: KpiSummary): number {
    return Math.round(((s.tasa_asistencia_pct ?? 0) / 100) * (s.matriculados || 0));
  }

  pendingInterviews(): number {
    return this.upcomingInterviews.filter(i => i.status === 'pending').length;
  }

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 6)  return 'dashboard.greeting.bonaNit';
    if (hour < 13) return 'dashboard.greeting.bonDia';
    if (hour < 20) return 'dashboard.greeting.bonaTarda';
    return 'dashboard.greeting.bonaNit';
  }

  formatRefreshedAt(ts: string): string {
    const d = new Date(ts);
    const localeMap: Record<string, string> = { ca: 'ca-ES', es: 'es-ES', en: 'en-GB' };
    const locale = localeMap[this.transloco.getActiveLang()] ?? 'ca-ES';
    return d.toLocaleString(locale, {
      day: '2-digit', month: '2-digit',
      hour: '2-digit', minute: '2-digit',
    });
  }
}

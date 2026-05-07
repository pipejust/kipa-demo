import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule, CheckCircle, Clock, XCircle, RefreshCw, AlertTriangle } from 'lucide-angular';

import { BillingService, Cuota, CuotaListResponse, CuotaStatus } from '../billing.service';

const STATUS_LABEL: Record<CuotaStatus, string> = {
  pendiente: 'Pendent',
  en_remesa: 'En remesa',
  cobrada: 'Cobrada',
  devuelta: 'Retornada',
  anulada: 'Anul·lada',
  pagada_manual: 'Pagada',
};

const STATUS_CLASS: Record<CuotaStatus, string> = {
  pendiente: 'tag--warn',
  en_remesa: 'tag--info',
  cobrada: 'tag--ok',
  devuelta: 'tag--error',
  anulada: 'tag--muted',
  pagada_manual: 'tag--ok',
};

@Component({
  selector: 'kipa-cuotas-list',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, CurrencyPipe, DatePipe],
  templateUrl: './cuotas-list.component.html',
  styleUrl: './cuotas-list.component.scss',
})
export class CuotasListComponent implements OnInit {
  private readonly billing = inject(BillingService);

  readonly RefreshCw = RefreshCw;
  readonly CheckCircle = CheckCircle;
  readonly Clock = Clock;
  readonly XCircle = XCircle;
  readonly AlertTriangle = AlertTriangle;

  readonly loading = signal(true);
  readonly paying = signal<string | null>(null);
  readonly resp = signal<CuotaListResponse | null>(null);
  readonly cuotas = signal<Cuota[]>([]);

  filterStatus = '';
  filterAnio = this.currentYear();
  readonly years: string[] = this.buildYears();

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    const params: Record<string, string> = { anio_escolar: this.filterAnio };
    if (this.filterStatus) params['status'] = this.filterStatus;

    this.billing.listCuotas(params as never).subscribe({
      next: (r) => {
        this.resp.set(r);
        this.cuotas.set(r.data);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  markPaid(c: Cuota): void {
    this.paying.set(c.id);
    const today = new Date().toISOString().split('T')[0];
    this.billing.markPaid(c.id, { tipo: 'efectivo', fecha: today }).subscribe({
      next: () => { this.paying.set(null); this.load(); },
      error: () => this.paying.set(null),
    });
  }

  statusLabel(s: CuotaStatus): string { return STATUS_LABEL[s] ?? s; }
  statusClass(s: CuotaStatus): string { return STATUS_CLASS[s] ?? ''; }

  private currentYear(): string {
    const now = new Date();
    const y = now.getMonth() >= 6 ? now.getFullYear() : now.getFullYear() - 1;
    return `${y}-${y + 1}`;
  }
  private buildYears(): string[] {
    const base = new Date().getFullYear();
    return [base - 1, base, base + 1].map(y => `${y}-${y + 1}`);
  }
}

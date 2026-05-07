import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, CreditCard, CheckCircle2, Clock, Download, FileText } from 'lucide-angular';

import { AuthService } from '../../../core/auth/auth.service';
import { BillingService, Cuota, CuotaStatus, Recibo } from '../billing.service';

const STATUS_LABEL: Record<CuotaStatus, string> = {
  pendiente: 'Pendent',
  en_remesa: 'En tramitació',
  cobrada: 'Pagada',
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
  selector: 'kipa-family-payments',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, CurrencyPipe, DatePipe],
  templateUrl: './family-payments.component.html',
  styleUrl: './family-payments.component.scss',
})
export class FamilyPaymentsComponent implements OnInit {
  private readonly billing = inject(BillingService);
  protected readonly auth = inject(AuthService);

  readonly CreditCard = CreditCard;
  readonly CheckCircle2 = CheckCircle2;
  readonly Clock = Clock;
  readonly Download = Download;
  readonly FileText = FileText;

  readonly loading = signal(true);
  readonly loadingRecibos = signal(true);
  readonly paying = signal<string | null>(null);
  readonly cuotas = signal<Cuota[]>([]);
  readonly recibos = signal<Recibo[]>([]);

  readonly pendienteTotal = computed(() =>
    this.cuotas().filter(c => c.status === 'pendiente').reduce((s, c) => s + c.importe_final, 0)
  );
  readonly cobradaTotal = computed(() =>
    this.cuotas().filter(c => c.status === 'cobrada' || c.status === 'pagada_manual').reduce((s, c) => s + c.importe_final, 0)
  );

  ngOnInit(): void {
    this.billing.listCuotas().subscribe({
      next: (r) => { this.cuotas.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
    this.billing.listRecibos().subscribe({
      next: (r) => { this.recibos.set(r.data); this.loadingRecibos.set(false); },
      error: () => this.loadingRecibos.set(false),
    });
  }

  payStripe(c: Cuota): void {
    this.paying.set(c.id);
    this.billing.createPaymentIntent(c.id).subscribe({
      next: (intent) => {
        this.paying.set(null);
        // In a full implementation, open Stripe Elements with intent.client_secret
        alert(`Stripe intent creat. client_secret: ${intent.client_secret.slice(0, 20)}…\n(Integració Stripe Elements pendent de F2 final)`);
      },
      error: () => this.paying.set(null),
    });
  }

  statusLabel(s: CuotaStatus): string { return STATUS_LABEL[s] ?? s; }
  statusClass(s: CuotaStatus): string { return STATUS_CLASS[s] ?? ''; }
}

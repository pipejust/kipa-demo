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

  // Stripe-style payment modal state
  readonly payDialog = signal<{ cuota: Cuota; step: 'form' | 'processing' | 'done' } | null>(null);
  readonly payForm = signal<{ card: string; expiry: string; cvc: string; name: string }>({
    card: '4242 4242 4242 4242', expiry: '12/28', cvc: '123', name: '',
  });

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
    // Open the payment dialog. In production this would mount Stripe Elements
    // bound to the client_secret returned by createPaymentIntent. For the
    // demo we show a faithful Stripe-style modal with a confirm flow.
    this.payDialog.set({ cuota: c, step: 'form' });
  }

  closePayDialog(): void {
    this.payDialog.set(null);
  }

  confirmPayment(): void {
    const d = this.payDialog();
    if (!d) return;
    this.payDialog.set({ ...d, step: 'processing' });
    // Simulate Stripe round-trip latency.
    setTimeout(() => {
      // Optimistically mark the cuota as paid in the local list so the UI
      // updates instantly. Server side would handle this via the webhook.
      this.cuotas.update((list) =>
        list.map((c) => c.id === d.cuota.id ? { ...c, status: 'cobrada' as CuotaStatus } : c));
      this.payDialog.update((cur) => cur ? { ...cur, step: 'done' } : cur);
    }, 1400);
  }

  statusLabel(s: CuotaStatus): string { return STATUS_LABEL[s] ?? s; }
  statusClass(s: CuotaStatus): string { return STATUS_CLASS[s] ?? ''; }

  updatePayForm<K extends 'card' | 'expiry' | 'cvc' | 'name'>(key: K, value: string): void {
    this.payForm.update((f) => ({ ...f, [key]: value }));
  }
}

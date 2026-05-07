import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { LucideAngularModule, FileText, CheckCircle, RefreshCw, Download } from 'lucide-angular';

import { BillingService, RemesaSepa } from '../billing.service';

const STATUS_LABEL: Record<string, string> = {
  borrador: 'Esborrany',
  enviada: 'Enviada',
  procesada: 'Processada',
  parcialmente_devuelta: 'Pars. retornada',
};

const STATUS_CLASS: Record<string, string> = {
  borrador: 'tag--muted',
  enviada: 'tag--info',
  procesada: 'tag--ok',
  parcialmente_devuelta: 'tag--warn',
};

@Component({
  selector: 'kipa-remesas-list',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, CurrencyPipe, DatePipe],
  templateUrl: './remesas-list.component.html',
  styleUrl: './remesas-list.component.scss',
})
export class RemesasListComponent implements OnInit {
  private readonly billing = inject(BillingService);

  readonly FileText = FileText;
  readonly CheckCircle = CheckCircle;
  readonly RefreshCw = RefreshCw;
  readonly Download = Download;

  readonly loading = signal(true);
  readonly confirming = signal<string | null>(null);
  readonly remesas = signal<RemesaSepa[]>([]);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.billing.listRemesas().subscribe({
      next: (r) => { this.remesas.set(r.data); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  confirm(r: RemesaSepa): void {
    this.confirming.set(r.id);
    this.billing.confirmRemesa(r.id).subscribe({
      next: () => { this.confirming.set(null); this.load(); },
      error: () => this.confirming.set(null),
    });
  }

  statusLabel(s: string): string { return STATUS_LABEL[s] ?? s; }
  statusClass(s: string): string { return STATUS_CLASS[s] ?? ''; }
}

import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, TrendingUp, TrendingDown, Clock, FileText, AlertTriangle, RefreshCw } from 'lucide-angular';

import { BillingService, FinancialSummary } from '../billing.service';

@Component({
  selector: 'kipa-finance-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, CurrencyPipe],
  templateUrl: './finance-dashboard.component.html',
  styleUrl: './finance-dashboard.component.scss',
})
export class FinanceDashboardComponent implements OnInit {
  private readonly billing = inject(BillingService);

  readonly TrendingUp = TrendingUp;
  readonly TrendingDown = TrendingDown;
  readonly Clock = Clock;
  readonly FileText = FileText;
  readonly AlertTriangle = AlertTriangle;
  readonly RefreshCw = RefreshCw;

  readonly loading = signal(true);
  readonly summary = signal<FinancialSummary | null>(null);
  readonly anioEscolar = signal(this.currentYear());

  readonly years: string[] = this.buildYears();

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.billing.financialSummary(this.anioEscolar()).subscribe({
      next: (s) => { this.summary.set(s); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  changeYear(event: Event): void {
    const y = (event.target as HTMLSelectElement).value;
    this.anioEscolar.set(y);
    this.load();
  }

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

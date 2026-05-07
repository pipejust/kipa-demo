import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LucideAngularModule, Mail, Building2, ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { AuthService } from '../../../core/auth/auth.service';
import { TenantsService, TenantPublic } from '../../../core/tenants/tenants.service';
import { LangSwitcherComponent } from '../../../shared/components/lang-switcher.component';

/**
 * Password recovery — step 1: user enters email + tenant.
 * On submit, backend sends a reset link to that email (always 204, anti-enumeration).
 */
@Component({
  selector: 'kipa-recover',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, LangSwitcherComponent, TranslocoModule],
  templateUrl: './recover.component.html',
  styleUrl: './recover.component.scss',
})
export class RecoverComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly tenantsSvc = inject(TenantsService);
  private readonly transloco = inject(TranslocoService);

  readonly Mail = Mail;
  readonly Building = Building2;
  readonly ArrowLeft = ArrowLeft;
  readonly ArrowRight = ArrowRight;
  readonly CheckCircle = CheckCircle2;

  readonly tenants = signal<TenantPublic[]>([]);
  readonly tenantsLoading = signal(true);
  readonly submitting = signal(false);
  readonly success = signal(false);
  readonly errorMessage = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    tenant_slug: ['', [Validators.required]],
    email: ['', [Validators.required, Validators.email]],
  });

  ngOnInit(): void {
    this.tenantsSvc.listPublic().subscribe({
      next: (list) => {
        this.tenants.set(list);
        this.tenantsLoading.set(false);
        if (list.length === 1) this.form.patchValue({ tenant_slug: list[0].slug });
      },
      error: () => {
        this.tenantsLoading.set(false);
      },
    });
  }

  fieldHasError(name: 'tenant_slug' | 'email'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.dirty || c.touched);
  }

  submit(): void {
    this.errorMessage.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    this.auth.forgotPassword(this.form.getRawValue()).subscribe({
      next: () => {
        this.submitting.set(false);
        this.success.set(true);
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        if (err instanceof HttpErrorResponse && err.status >= 500) {
          this.errorMessage.set(this.transloco.translate('login.error.serverDown'));
        } else if (err instanceof HttpErrorResponse && err.status === 0) {
          this.errorMessage.set(this.transloco.translate('login.error.noConnection'));
        } else {
          // Per spec: any other status still returns success to avoid email enumeration
          this.success.set(true);
        }
      },
    });
  }
}

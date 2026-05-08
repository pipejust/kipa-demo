import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LucideAngularModule, Mail, Lock, Building2, ArrowRight, Eye, EyeOff } from 'lucide-angular';
import { TranslocoModule, TranslocoService } from '@jsverse/transloco';

import { AuthService } from '../../../core/auth/auth.service';
import { TenantsService, TenantPublic } from '../../../core/tenants/tenants.service';
import { KipaLogoComponent } from '../../../shared/components/kipa-logo.component';
import { LangSwitcherComponent } from '../../../shared/components/lang-switcher.component';

@Component({
  selector: 'kipa-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, KipaLogoComponent, LangSwitcherComponent, TranslocoModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly tenantsSvc = inject(TenantsService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly transloco = inject(TranslocoService);

  readonly Mail = Mail;
  readonly Lock = Lock;
  readonly Building = Building2;
  readonly Arrow = ArrowRight;
  readonly Eye = Eye;
  readonly EyeOff = EyeOff;

  readonly showPassword = signal(false);
  readonly errorMessage = signal<string | null>(null);
  readonly submitting = signal(false);

  /** Centres list — fetched from backend, never hardcoded. */
  readonly tenants = signal<TenantPublic[]>([]);
  readonly tenantsLoading = signal(true);
  readonly tenantsError = signal<string | null>(null);

  @ViewChild('emailInput') emailInput?: ElementRef<HTMLInputElement>;

  readonly form = this.fb.nonNullable.group({
    tenant_slug: ['', [Validators.required, Validators.pattern(/^[a-z0-9-]+$/)]],
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6)]],
    remember_me: [false],
  });

  ngOnInit(): void {
    // Load centres from the backend — never hardcoded.
    this.loadTenants();

    // Pre-fill tenant slug from query string when shared via link
    const slug = this.route.snapshot.queryParamMap.get('tenant');
    if (slug) {
      this.form.patchValue({ tenant_slug: slug });
    }

    // If already signed in, route directly to the proper shell.
    if (this.auth.isAuthenticated()) {
      this.redirectAfterLogin();
    }

    setTimeout(() => this.emailInput?.nativeElement.focus(), 0);
  }

  private loadTenants(): void {
    this.tenantsLoading.set(true);
    this.tenantsError.set(null);
    this.tenantsSvc.listPublic().subscribe({
      next: (list) => {
        this.tenants.set(list);
        this.tenantsLoading.set(false);
        // If only one centre and form is empty, auto-select it.
        if (list.length === 1 && !this.form.controls.tenant_slug.value) {
          this.form.patchValue({ tenant_slug: list[0].slug });
        }
      },
      error: () => {
        this.tenants.set([]);
        this.tenantsLoading.set(false);
        this.tenantsError.set(
          this.transloco.translate('login.error.serverDown'),
        );
      },
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  fieldHasError(name: 'tenant_slug' | 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    this.errorMessage.set(null);
    this.submitting.set(true);
    // Demo build: the mock interceptor accepts anything. If the user clicks
    // "Iniciar sessió" without filling the form, fall back to safe defaults
    // so the click always lands on the dashboard.
    const raw = this.form.getRawValue();
    const tenant_slug = raw.tenant_slug || this.tenants()[0]?.slug || 'kids-andorra';
    const email       = raw.email       || 'demo@kids.app';
    const password    = raw.password    || 'demo1234';
    this.auth.loginAndLoad({ tenant_slug, email, password, remember_me: raw.remember_me }).subscribe({
      next: () => {
        this.submitting.set(false);
        this.redirectAfterLogin();
      },
      error: (err: unknown) => {
        this.submitting.set(false);
        this.errorMessage.set(this.parseError(err));
      },
    });
  }

  private redirectAfterLogin(): void {
    const redirect = this.route.snapshot.queryParamMap.get('redirect');
    if (redirect && redirect.startsWith('/')) {
      this.router.navigateByUrl(redirect);
      return;
    }
    if (this.auth.isFamily()) {
      this.router.navigate(['/f']);
    } else {
      this.router.navigate(['/a']);
    }
  }

  private parseError(err: unknown): string {
    const t = (key: string) => this.transloco.translate(key);
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0)                    return t('login.error.noConnection');
      if (err.status === 401 || err.status === 403) return t('login.error.invalidCredentials');
      if (err.status === 404)                  return t('login.error.centerNotFound');
      if (err.status === 422)                  return t('login.error.checkFields');
      if (err.status >= 500)                   return t('login.error.serverDown');
    }
    return t('login.error.generic');
  }
}

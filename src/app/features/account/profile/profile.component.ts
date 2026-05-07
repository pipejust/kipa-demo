import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import {
  LucideAngularModule,
  ChevronRight,
  Mail,
  Phone,
  Globe,
  Clock,
  Camera,
  Check,
  Pencil,
} from 'lucide-angular';

import { AuthService } from '../../../core/auth/auth.service';

@Component({
  selector: 'kipa-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, LucideAngularModule, TranslocoModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss',
})
export class ProfileComponent {
  protected readonly auth = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly ChevronRightIcon = ChevronRight;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly GlobeIcon = Globe;
  readonly ClockIcon = Clock;
  readonly CameraIcon = Camera;
  readonly CheckIcon = Check;
  readonly PencilIcon = Pencil;

  readonly editing = signal(false);
  readonly savedAt = signal<Date | null>(null);

  readonly form = this.fb.nonNullable.group({
    full_name: [this.auth.currentUser()?.full_name ?? '', [Validators.required, Validators.minLength(2)]],
    email:     [{ value: this.auth.currentUser()?.email ?? '', disabled: true }, [Validators.email]],
    phone:     [''],
    language:  ['ca'],
    timezone:  ['Europe/Andorra'],
  });

  readonly initials = computed(() => {
    const name = this.auth.currentUser()?.full_name ?? '';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? '';
    const last  = parts.length > 1 ? parts[parts.length - 1][0] : '';
    return (first + last).toUpperCase().slice(0, 2) || 'KI';
  });

  startEdit(): void { this.editing.set(true); }

  cancelEdit(): void {
    this.editing.set(false);
    this.form.patchValue({
      full_name: this.auth.currentUser()?.full_name ?? '',
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    // No real backend endpoint yet — save locally for now.
    this.savedAt.set(new Date());
    this.editing.set(false);
    setTimeout(() => this.savedAt.set(null), 4000);
  }
}

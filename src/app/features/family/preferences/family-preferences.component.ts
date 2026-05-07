import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  LucideAngularModule,
  Mail,
  MessageCircle,
  Bell,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-angular';

import { AuthService } from '../../../core/auth/auth.service';
import { CommunicationsService } from '../../communications/communications.service';
import type { Channel, PreferenceOut } from '../../../core/api/types.gen';

interface ChannelOption {
  channel: Channel;
  label: string;
  description: string;
  icon: typeof Mail;
}

const CHANNELS: ChannelOption[] = [
  {
    channel: 'email',
    label: 'Correu electrònic',
    description: 'Notificacions d\'admissions, rebuts i comunicats del centre.',
    icon: Mail,
  },
  {
    channel: 'whatsapp',
    label: 'WhatsApp',
    description: 'Missatges urgents i recordatoris d\'events.',
    icon: MessageCircle,
  },
  {
    channel: 'inapp',
    label: 'Notificacions in-app',
    description: 'Avisos dins del portal familiar.',
    icon: Bell,
  },
];

@Component({
  selector: 'kipa-family-preferences',
  standalone: true,
  imports: [CommonModule, LucideAngularModule],
  templateUrl: './family-preferences.component.html',
  styleUrl: './family-preferences.component.scss',
})
export class FamilyPreferencesComponent implements OnInit {
  private readonly auth = inject(AuthService);
  private readonly svc = inject(CommunicationsService);

  readonly Mail = Mail;
  readonly MessageCircle = MessageCircle;
  readonly Bell = Bell;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly Info = Info;

  readonly channels = CHANNELS;
  readonly loading = signal(true);
  readonly saving = signal<Channel | null>(null);
  readonly preferences = signal<PreferenceOut[]>([]);

  ngOnInit(): void {
    // Use the user's own ID as the preferences entity key for the family portal.
    // (In a multi-alumno context this would be extended to per-alumno selection.)
    const userId = this.auth.currentUser()?.id;
    if (!userId) { this.loading.set(false); return; }

    this.svc.getPreferences(userId).subscribe({
      next: (prefs) => { this.preferences.set(prefs); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  isOptIn(channel: Channel): boolean {
    const pref = this.preferences().find((p) => p.channel === channel);
    // Default opt-in when no explicit preference exists
    return pref ? pref.opt_in : true;
  }

  toggle(channel: Channel): void {
    const userId = this.auth.currentUser()?.id;
    if (!userId || this.saving()) return;
    // Alias userId as alumnoId for the preferences endpoint
    const alumnoId = userId;

    const newValue = !this.isOptIn(channel);
    this.saving.set(channel);

    this.svc.upsertPreference(alumnoId, channel, newValue).subscribe({
      next: (updated) => {
        this.preferences.update((list) => {
          const idx = list.findIndex((p) => p.channel === channel);
          return idx >= 0
            ? list.map((p) => (p.channel === channel ? updated : p))
            : [...list, updated];
        });
        this.saving.set(null);
      },
      error: () => this.saving.set(null),
    });
  }
}

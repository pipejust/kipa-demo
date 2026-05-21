import { CommonModule, DatePipe } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import {
  LucideAngularModule,
  Send,
  Plus,
  MailOpen,
  MessageCircle,
  Bell,
  ChevronRight,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  Loader,
  Search,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { CommunicationsService } from './communications.service';
import type { CampaignOut, TemplateOut } from '../../core/api/types.gen';

type Tab = 'templates' | 'campaigns';

const CHANNEL_LABEL: Record<string, string> = {
  email: 'Email',
  whatsapp: 'WhatsApp',
  inapp: 'In-app',
};

const STATUS_CLASS: Record<string, string> = {
  draft: 'tag--muted',
  scheduled: 'tag--info',
  sending: 'tag--warn',
  done: 'tag--ok',
  failed: 'tag--error',
};

const STATUS_LABEL: Record<string, string> = {
  draft: 'Esborrany',
  scheduled: 'Programada',
  sending: 'Enviant…',
  done: 'Enviada',
  failed: 'Error',
};

@Component({
  selector: 'kipa-comunicaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule, LucideAngularModule, DatePipe, TranslocoModule],
  templateUrl: './comunicaciones.component.html',
  styleUrl: './comunicaciones.component.scss',
})
export class ComunicacionesComponent implements OnInit {
  private readonly svc = inject(CommunicationsService);
  private readonly fb = inject(FormBuilder);

  readonly Send = Send;
  readonly Plus = Plus;
  readonly MailOpen = MailOpen;
  readonly MessageCircle = MessageCircle;
  readonly Bell = Bell;
  readonly ChevronRight = ChevronRight;
  readonly RefreshCw = RefreshCw;
  readonly CheckCircle2 = CheckCircle2;
  readonly XCircle = XCircle;
  readonly Clock = Clock;
  readonly Loader = Loader;
  readonly Search = Search;

  /** UI-only: which template is highlighted in the left panel */
  readonly selectedTemplateId = signal<string | null>(null);

  /** Available channels for the channel picker in the composer */
  get channels() {
    return [
      { value: 'email',    label: 'Email',    icon: this.MailOpen },
      { value: 'whatsapp', label: 'WhatsApp', icon: this.MessageCircle },
      { value: 'inapp',    label: 'In-app',   icon: this.Bell },
    ];
  }

  selectTemplate(t: TemplateOut): void {
    this.selectedTemplateId.set(t.id);
  }

  readonly activeTab = signal<Tab>('templates');
  readonly templates = signal<TemplateOut[]>([]);
  readonly campaigns = signal<CampaignOut[]>([]);

  // Channel toggles (right sidebar). State persists across the session.
  readonly enabledChannels = signal<{ email: boolean; whatsapp: boolean; inApp: boolean }>({
    email: true, whatsapp: true, inApp: false,
  });
  readonly loadingTemplates = signal(true);
  readonly loadingCampaigns = signal(true);
  readonly showCreateDialog = signal(false);
  readonly showCampaignDialog = signal(false);
  readonly selectedTemplate = signal<TemplateOut | null>(null);
  readonly submitting = signal(false);
  readonly formError = signal('');
  readonly campaignFormError = signal('');
  readonly sendingId = signal<string | null>(null);

  readonly templateForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    channel: ['email', Validators.required],
    subject: [''],
    html_body: ['', Validators.required],
    text_body: [''],
  });

  // Placeholders for Jinja2 syntax in textareas — must be class properties to avoid
  // Angular template interpolation of {{ }} syntax.
  readonly htmlBodyPlaceholder = '<p>Hola {{ alumno_id }}!</p>';
  readonly textBodyPlaceholder = 'Hola {{ alumno_id }}!';

  readonly campaignForm = this.fb.group({
    name: ['', [Validators.required, Validators.minLength(1)]],
    segmentType: ['all', Validators.required],
    levels: [''],
  });

  ngOnInit(): void {
    this.loadTemplates();
    this.loadCampaigns();
  }

  loadTemplates(): void {
    this.loadingTemplates.set(true);
    this.svc.listTemplates().subscribe({
      next: (r) => { this.templates.set(r.data); this.loadingTemplates.set(false); },
      error: () => this.loadingTemplates.set(false),
    });
  }

  loadCampaigns(): void {
    this.loadingCampaigns.set(true);
    this.svc.listCampaigns().subscribe({
      next: (r) => { this.campaigns.set(r.data); this.loadingCampaigns.set(false); },
      error: () => this.loadingCampaigns.set(false),
    });
  }

  openCreateDialog(): void {
    this.templateForm.reset({ channel: 'email' });
    this.formError.set('');
    this.showCreateDialog.set(true);
  }

  closeDialog(): void { this.showCreateDialog.set(false); }

  submitTemplate(): void {
    if (this.templateForm.invalid || this.submitting()) return;
    this.submitting.set(true);
    this.formError.set('');
    const v = this.templateForm.value;
    this.svc.createTemplate({
      name: v.name!,
      channel: v.channel as any,
      subject: v.subject || undefined,
      html_body: v.html_body!,
      text_body: v.text_body || undefined,
    }).subscribe({
      next: (t) => {
        this.templates.update((list) => [...list, t]);
        this.submitting.set(false);
        this.closeDialog();
      },
      error: () => {
        this.formError.set('Error en crear la plantilla. Intenta-ho de nou.');
        this.submitting.set(false);
      },
    });
  }

  createCampaign(template: TemplateOut): void {
    this.selectedTemplate.set(template);
    this.campaignForm.reset({ segmentType: 'all' });
    this.campaignFormError.set('');
    this.showCampaignDialog.set(true);
  }

  closeCampaignDialog(): void { this.showCampaignDialog.set(false); }

  /** Toggle one of the right-sidebar delivery channels. */
  toggleChannel(key: 'email' | 'whatsapp' | 'inApp'): void {
    this.enabledChannels.update((c) => ({ ...c, [key]: !c[key] }));
  }

  /** Demo-only "schedule send" — in production this opens a date+time picker. */
  scheduleSend(): void {
    alert('Programar enviament\n\nEn la versió completa s\'obriria un calendari per triar data i hora i un selector de zona horària. La campanya passaria a estat "programada" amb un Celery Beat encarregat-se de disparar-la al moment indicat.');
  }

  submitCampaign(): void {
    if (this.campaignForm.invalid || this.submitting()) return;
    const template = this.selectedTemplate();
    if (!template) return;

    this.submitting.set(true);
    this.campaignFormError.set('');
    const v = this.campaignForm.value;
    const levels = v.levels ? v.levels.split(',').map((s: string) => s.trim()).filter(Boolean) : [];

    this.svc.createCampaign({
      template_id: template.id,
      name: v.name!,
      segment: {
        type: v.segmentType as any,
        levels: v.segmentType === 'grade' ? levels : undefined,
      },
    }).subscribe({
      next: (c) => {
        this.campaigns.update((list) => [c, ...list]);
        this.submitting.set(false);
        this.closeCampaignDialog();
        this.activeTab.set('campaigns');
      },
      error: () => {
        this.campaignFormError.set('Error en crear la campanya.');
        this.submitting.set(false);
      },
    });
  }

  sendCampaign(campaign: CampaignOut): void {
    this.sendingId.set(campaign.id);
    this.svc.sendCampaign(campaign.id).subscribe({
      next: (updated) => {
        this.campaigns.update((list) => list.map((c) => (c.id === updated.id ? updated : c)));
        this.sendingId.set(null);
      },
      error: () => this.sendingId.set(null),
    });
  }

  channelLabel(ch: string): string { return CHANNEL_LABEL[ch] ?? ch; }
  channelIcon(ch: string) {
    if (ch === 'whatsapp') return this.MessageCircle;
    if (ch === 'inapp') return this.Bell;
    return this.MailOpen;
  }
  statusClass(s: string): string { return STATUS_CLASS[s] ?? 'tag--muted'; }
  statusLabel(s: string): string { return STATUS_LABEL[s] ?? s; }
  statusIcon(s: string) {
    if (s === 'done') return this.CheckCircle2;
    if (s === 'failed') return this.XCircle;
    if (s === 'sending') return this.Loader;
    return this.Clock;
  }
}

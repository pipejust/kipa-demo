import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslocoModule } from '@jsverse/transloco';
import {
  LucideAngularModule,
  ChevronRight,
  ChevronDown,
  Search,
  BookOpen,
  Video,
  MessageSquare,
  Mail,
  Phone,
  ExternalLink,
  Lightbulb,
} from 'lucide-angular';

interface FaqItem {
  q: string;
  a: string;
  topic: string;
}

@Component({
  selector: 'kipa-help',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LucideAngularModule, TranslocoModule],
  templateUrl: './help.component.html',
  styleUrl: './help.component.scss',
})
export class HelpComponent {
  readonly ChevronRightIcon = ChevronRight;
  readonly ChevronDownIcon = ChevronDown;
  readonly SearchIcon = Search;
  readonly BookOpenIcon = BookOpen;
  readonly VideoIcon = Video;
  readonly MessageSquareIcon = MessageSquare;
  readonly MailIcon = Mail;
  readonly PhoneIcon = Phone;
  readonly ExternalLinkIcon = ExternalLink;
  readonly LightbulbIcon = Lightbulb;

  readonly query = signal('');
  readonly openFaq = signal<number | null>(0);

  readonly resources = [
    {
      titleKey: 'account.help.resources.guideTitle',
      descKey:  'account.help.resources.guideDesc',
      icon: BookOpen,
      color: 'sky',
      href:  'https://github.com/pipejust/kipa#readme',
    },
    {
      titleKey: 'account.help.resources.videosTitle',
      descKey:  'account.help.resources.videosDesc',
      icon: Video,
      color: 'pink',
      href:  'https://kipa-demo.vercel.app',
    },
    {
      titleKey: 'account.help.resources.supportTitle',
      descKey:  'account.help.resources.supportDesc',
      icon: MessageSquare,
      color: 'green',
      href:  'mailto:hola@kipa.app',
    },
  ];

  readonly faqs: FaqItem[] = [
    {
      topic: 'Admissions',
      q: 'Com puc registrar una nova admissió?',
      a: 'Des del menú lateral, ves a "Admissions" i clica el botó "Nova admissió" a la part superior dreta. Omple el formulari guiat pas a pas. També pots iniciar una admissió des del dashboard amb la targeta "Programar entrevista".',
    },
    {
      topic: 'Famílies',
      q: 'Com envio un missatge a totes les famílies?',
      a: 'Ves a "Comunicacions" i clica "Nova comunicació". Tria el destinatari (totes, una classe, o una família) i compon el missatge. Pots desar-lo com a esborrany o programar-lo.',
    },
    {
      topic: 'Pagaments',
      q: 'Com genero una remesa de cobrament?',
      a: 'A "Finances" → "Remeses", clica "Nova remesa". El sistema genera automàticament el fitxer SEPA amb totes les cuotes pendents. Pots descarregar-lo o enviar-lo directament al banc.',
    },
    {
      topic: 'Assistència',
      q: 'Com registro l\'assistència diària?',
      a: 'Des del dashboard clica la targeta "Assistència" o ves al menú lateral. Selecciona la classe, marca cada alumne com a present, absent, retard o justificat, i desa.',
    },
    {
      topic: 'Compte',
      q: 'Com canvio la meva contrasenya?',
      a: 'Clica el teu avatar a la part superior dreta i tria "Configuració". A la secció "Seguretat" pots actualitzar la contrasenya. Recomanem una contrasenya de mínim 8 caràcters amb números i símbols.',
    },
    {
      topic: 'Compte',
      q: 'Com puc canviar l\'idioma de la plataforma?',
      a: 'Pots canviar l\'idioma des de "Configuració" → "General" → "Idioma", o també des del selector de la part inferior del menú lateral. Suportem català, espanyol i anglès.',
    },
    {
      topic: 'Privadesa',
      q: 'On trobo la política de privadesa i RGPD?',
      a: 'Tots els documents legals (política de privadesa, condicions d\'ús i protecció de dades) estan disponibles al peu de la pàgina de login. També pots demanar una còpia escrivint a privacitat@kids.ad.',
    },
  ];

  readonly filteredFaqs = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.faqs;
    return this.faqs.filter(
      f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q) || f.topic.toLowerCase().includes(q),
    );
  });

  toggleFaq(idx: number): void {
    this.openFaq.set(this.openFaq() === idx ? null : idx);
  }

  contactSupport(): void {
    window.location.href = 'mailto:suport@kids.ad?subject=Suport%20K!dS%20%E2%80%94%20Consulta';
  }
}

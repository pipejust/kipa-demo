import { CommonModule } from '@angular/common';
import { Component, computed, signal } from '@angular/core';
import { TranslocoModule } from '@jsverse/transloco';
import { LucideAngularModule, FileText, Download, Eye, FolderOpen, Filter } from 'lucide-angular';

interface FamilyDocument {
  id: string;
  title: string;
  category: 'admission' | 'health' | 'financial' | 'pedagogical' | 'authorization';
  uploadedAt: string;
  size: string;
  format: 'pdf' | 'docx' | 'jpg';
}

@Component({
  selector: 'kipa-family-documents',
  standalone: true,
  imports: [CommonModule, LucideAngularModule, TranslocoModule],
  template: `
    <section class="docs-page">
      <header class="docs-page__header">
        <h1 class="kds-page-title">{{ 'familyDocuments.title' | transloco }}</h1>
        <p class="kds-page-subtitle">{{ 'familyDocuments.subtitle' | transloco }}</p>
      </header>

      <nav class="docs-filters" aria-label="categories">
        <button
          type="button"
          class="docs-chip"
          [class.docs-chip--active]="activeCat() === 'all'"
          (click)="activeCat.set('all')"
        >
          {{ 'familyDocuments.cats.all' | transloco }}
          <span class="docs-chip__count">{{ all().length }}</span>
        </button>
        @for (cat of cats; track cat) {
          <button
            type="button"
            class="docs-chip"
            [class.docs-chip--active]="activeCat() === cat"
            (click)="activeCat.set(cat)"
          >
            {{ ('familyDocuments.cats.' + cat) | transloco }}
            <span class="docs-chip__count">{{ countOf(cat) }}</span>
          </button>
        }
      </nav>

      @if (filtered().length === 0) {
        <div class="kds-empty">
          <lucide-icon class="kds-empty__icon" [img]="Folder" />
          <p class="kds-empty__title">{{ 'familyDocuments.empty' | transloco }}</p>
        </div>
      } @else {
        <ul class="docs-grid">
          @for (d of filtered(); track d.id) {
            <li class="docs-card">
              <div class="docs-card__icon" [ngClass]="'docs-card__icon--' + d.category">
                <lucide-icon [img]="iconFor(d.format)" />
              </div>
              <div class="docs-card__body">
                <h3 class="docs-card__title">{{ d.title }}</h3>
                <p class="docs-card__meta">
                  <span class="docs-card__cat">{{ ('familyDocuments.cats.' + d.category) | transloco }}</span>
                  <span>·</span>
                  <span>{{ d.format | uppercase }}</span>
                  <span>·</span>
                  <span>{{ d.size }}</span>
                  <span>·</span>
                  <span>{{ d.uploadedAt }}</span>
                </p>
              </div>
              <div class="docs-card__actions">
                <button type="button" class="k-btn k-btn--ghost k-btn--sm" (click)="preview(d)">
                  <lucide-icon [img]="EyeIcon" />
                  {{ 'familyDocuments.preview' | transloco }}
                </button>
                <button type="button" class="k-btn k-btn--primary k-btn--sm" (click)="download(d)">
                  <lucide-icon [img]="DownloadIcon" />
                  {{ 'familyDocuments.download' | transloco }}
                </button>
              </div>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styleUrl: './family-documents.component.scss',
})
export class FamilyDocumentsComponent {
  readonly Folder = FolderOpen;
  readonly DownloadIcon = Download;
  readonly EyeIcon = Eye;
  readonly FilterIcon = Filter;

  readonly cats = ['admission', 'health', 'financial', 'pedagogical', 'authorization'] as const;
  readonly activeCat = signal<'all' | typeof this.cats[number]>('all');

  readonly all = signal<FamilyDocument[]>([
    { id: 'd1', title: 'Sol·licitud d\'admissió 2025-2026',           category: 'admission',     uploadedAt: '02/09/2024', size: '124 KB', format: 'pdf'  },
    { id: 'd2', title: 'Document SEPA — mandat B2B',                  category: 'financial',     uploadedAt: '03/09/2024', size: '88 KB',  format: 'pdf'  },
    { id: 'd3', title: 'Normativa de salut KIPA',                     category: 'health',        uploadedAt: '01/09/2024', size: '210 KB', format: 'pdf'  },
    { id: 'd4', title: 'Tarifes oficials curs 2025-2026',             category: 'financial',     uploadedAt: '01/09/2024', size: '64 KB',  format: 'pdf'  },
    { id: 'd5', title: 'Autorització de fotos i vídeos',              category: 'authorization', uploadedAt: '02/09/2024', size: '42 KB',  format: 'pdf'  },
    { id: 'd6', title: 'Informe trimestral 1r trimestre',             category: 'pedagogical',   uploadedAt: '20/12/2024', size: '156 KB', format: 'docx' },
    { id: 'd7', title: 'Carta de benvinguda',                         category: 'admission',     uploadedAt: '04/09/2024', size: '38 KB',  format: 'pdf'  },
    { id: 'd8', title: 'Foto carnet alumne',                          category: 'admission',     uploadedAt: '05/09/2024', size: '320 KB', format: 'jpg'  },
    { id: 'd9', title: 'Autorització sortida fora del centre',        category: 'authorization', uploadedAt: '15/10/2024', size: '36 KB',  format: 'pdf'  },
    { id: 'd10', title: 'Informe trimestral 2n trimestre',            category: 'pedagogical',   uploadedAt: '28/03/2025', size: '162 KB', format: 'docx' },
  ]);

  readonly filtered = computed(() => {
    const cat = this.activeCat();
    return cat === 'all' ? this.all() : this.all().filter((d) => d.category === cat);
  });

  countOf(cat: string): number {
    return this.all().filter((d) => d.category === cat).length;
  }

  iconFor(_format: 'pdf' | 'docx' | 'jpg') {
    return FileText;
  }

  preview(d: FamilyDocument): void {
    // Demo: in production this would open a modal with PDF.js or an <iframe>.
    alert(`Vista prèvia · ${d.title}\n\n(En la versió real obriria el visor de PDF inline.)`);
  }

  download(d: FamilyDocument): void {
    // Demo: build a tiny in-memory text file so the click feels real.
    const blob = new Blob(
      [`KIPA · Demo download\n\nTítol: ${d.title}\nFormat: ${d.format}\nMida: ${d.size}\nPujat: ${d.uploadedAt}\n\n` +
       `Aquest és un fitxer demo. En producció, descarregaria el document real des de MinIO / S3.`],
      { type: 'text/plain' },
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${d.title.replace(/[\\/:*?"<>|]/g, '-')}.txt`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  }
}

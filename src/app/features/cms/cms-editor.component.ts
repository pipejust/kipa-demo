/**
 * CMS Editor — admin page for editing tenant text content.
 *
 * Presents a list of well-known content keys with their current values.
 * Admins can click "Edit" on any entry, modify the text, and save without
 * requiring a code deployment.
 *
 * Route: /a/contingut
 */
import { CommonModule } from '@angular/common';
import { Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  LucideAngularModule,
  FileText,
  Edit3,
  Check,
  X,
  Trash2,
  Plus,
} from 'lucide-angular';

import { CmsService, ContentEntry } from './cms.service';

interface EditorRow {
  key: string;
  label: string;
  description: string;
  entry: ContentEntry | null;
  editing: boolean;
  draftValue: string;
  saving: boolean;
}

/** Well-known keys with human-readable labels. */
const KNOWN_KEYS: Array<{ key: string; label: string; description: string }> = [
  {
    key: 'home.welcome',
    label: 'Missatge de benvinguda',
    description: 'Text principal mostrat al portal de famílies.',
  },
  {
    key: 'home.description',
    label: 'Descripció del centre',
    description: 'Paràgraf descriptiu de l\'escola a la pàgina d\'inici.',
  },
  {
    key: 'admission.cta',
    label: 'CTA admissions',
    description: 'Text del botó / crida a l\'acció del formulari d\'admissió.',
  },
  {
    key: 'admission.description',
    label: 'Descripció admissions',
    description: 'Text introductori del procés d\'admissió.',
  },
  {
    key: 'family.portal_welcome',
    label: 'Benvinguda portal famílies',
    description: 'Text de benvinguda personalitzat per a famílies.',
  },
  {
    key: 'footer.text',
    label: 'Text peu de pàgina',
    description: 'Informació legal o de contacte al peu.',
  },
  {
    key: 'notifications.footer',
    label: 'Peu de notificacions',
    description: 'Text afegit al peu de tots els correus enviats.',
  },
];

@Component({
  selector: 'kipa-cms-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './cms-editor.component.html',
  styleUrl: './cms-editor.component.scss',
})
export class CmsEditorComponent implements OnInit {
  private readonly cms = inject(CmsService);

  readonly FileTextIcon = FileText;
  readonly EditIcon = Edit3;
  readonly CheckIcon = Check;
  readonly XIcon = X;
  readonly TrashIcon = Trash2;
  readonly PlusIcon = Plus;

  readonly loading = signal(true);
  readonly rows = signal<EditorRow[]>([]);

  ngOnInit(): void {
    this._loadEntries();
  }

  private _loadEntries(): void {
    this.loading.set(true);
    this.cms.listAll().subscribe({
      next: (resp) => {
        const entryMap = new Map(resp.data.map((e) => [e.key, e]));
        this.rows.set(
          KNOWN_KEYS.map((k) => ({
            ...k,
            entry: entryMap.get(k.key) ?? null,
            editing: false,
            draftValue: entryMap.get(k.key)?.value ?? '',
            saving: false,
          }))
        );
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  startEdit(row: EditorRow): void {
    this.rows.update((rows) =>
      rows.map((r) =>
        r.key === row.key
          ? { ...r, editing: true, draftValue: r.entry?.value ?? '' }
          : { ...r, editing: false }
      )
    );
  }

  cancelEdit(row: EditorRow): void {
    this.rows.update((rows) =>
      rows.map((r) => (r.key === row.key ? { ...r, editing: false } : r))
    );
  }

  saveEntry(row: EditorRow): void {
    this.rows.update((rows) =>
      rows.map((r) => (r.key === row.key ? { ...r, saving: true } : r))
    );

    this.cms.upsert(row.key, row.draftValue).subscribe({
      next: (updated) => {
        this.rows.update((rows) =>
          rows.map((r) =>
            r.key === row.key
              ? { ...r, entry: updated, editing: false, saving: false }
              : r
          )
        );
      },
      error: () => {
        this.rows.update((rows) =>
          rows.map((r) => (r.key === row.key ? { ...r, saving: false } : r))
        );
      },
    });
  }

  deleteEntry(row: EditorRow): void {
    this.rows.update((rows) =>
      rows.map((r) => (r.key === row.key ? { ...r, saving: true } : r))
    );

    this.cms.delete(row.key).subscribe({
      next: () => {
        this.rows.update((rows) =>
          rows.map((r) =>
            r.key === row.key
              ? { ...r, entry: null, editing: false, saving: false, draftValue: '' }
              : r
          )
        );
      },
      error: () => {
        this.rows.update((rows) =>
          rows.map((r) => (r.key === row.key ? { ...r, saving: false } : r))
        );
      },
    });
  }

  formatDate(ts: string): string {
    return new Date(ts).toLocaleString('ca-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

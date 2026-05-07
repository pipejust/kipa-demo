import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Translation, TranslocoLoader } from '@jsverse/transloco';
import { Observable } from 'rxjs';

/**
 * Translation HTTP loader.
 *
 * The cache-busting `_v` parameter is set ONCE at app boot. This means:
 *   - Every fresh page load downloads the latest translations from the dev
 *     server, bypassing any stale browser cache (the issue we hit when the
 *     JSON was updated but the browser kept serving an older version,
 *     causing untranslated keys like "students.create.title" to show as
 *     literals in the UI).
 *   - Within a single session, runtime language switches reuse the same
 *     `_v` so they don't re-download what was already fetched.
 *
 * In production this still works — the value is just less meaningful — but
 * the build pipeline already cache-busts via filename hashing, so the dev
 * gain is the main motivation here.
 */
const APP_BOOT_TS = Date.now().toString(36);

@Injectable({ providedIn: 'root' })
export class TranslocoHttpLoader implements TranslocoLoader {
  private readonly http = inject(HttpClient);

  getTranslation(lang: string): Observable<Translation> {
    return this.http.get<Translation>(`/assets/i18n/${lang}.json`, {
      params: new HttpParams().set('_v', APP_BOOT_TS),
    });
  }
}

import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  LucideAngularModule,
  FilePlus,
  GraduationCap,
  Mail,
  ChevronRight,
} from 'lucide-angular';
import { TranslocoModule } from '@jsverse/transloco';

import { AuthService } from '../../../core/auth/auth.service';

interface AlumnoSummary {
  id: string;
  nombre: string;
  apellidos: string;
  status: string;
}

@Component({
  selector: 'kipa-family-home',
  standalone: true,
  imports: [CommonModule, RouterLink, LucideAngularModule, TranslocoModule],
  templateUrl: './family-home.component.html',
  styleUrl: './family-home.component.scss',
})
export class FamilyHomeComponent implements OnInit {
  protected readonly auth = inject(AuthService);
  private readonly http = inject(HttpClient);

  readonly FilePlus = FilePlus;
  readonly Cap = GraduationCap;
  readonly Mail = Mail;
  readonly ChevronRight = ChevronRight;

  readonly alumnes = signal<AlumnoSummary[]>([]);
  readonly alumnesLoading = signal(true);

  readonly firstName = computed(() => {
    const name = this.auth.currentUser()?.full_name ?? '';
    return name.trim().split(/\s+/)[0] || 'Família';
  });

  ngOnInit(): void {
    this.http.get<{ data: AlumnoSummary[] }>('/api/v1/alumnos?limit=20').subscribe({
      next: (resp) => {
        this.alumnes.set(resp.data ?? []);
        this.alumnesLoading.set(false);
      },
      error: () => {
        this.alumnesLoading.set(false);
      },
    });
  }

  greeting(): string {
    const hour = new Date().getHours();
    if (hour < 13) return 'family.greeting.bonDia';
    if (hour < 20) return 'family.greeting.bonaTarda';
    return 'family.greeting.bonaNit';
  }
}

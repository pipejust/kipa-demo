import { Routes } from '@angular/router';

import { authGuard } from '../../core/auth/auth.guard';
import { FamilyShellComponent } from './family-shell.component';

export const FAMILY_SHELL_ROUTES: Routes = [
  {
    path: '',
    component: FamilyShellComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'inicio', pathMatch: 'full' },
      {
        path: 'inicio',
        loadComponent: () =>
          import('../../features/family/home/family-home.component').then((m) => m.FamilyHomeComponent),
        title: 'Inici · KIPA',
      },
      {
        path: 'admisions',
        loadComponent: () =>
          import('../../features/family/admissions/family-admissions.component').then((m) => m.FamilyAdmissionsComponent),
        title: 'Les meves sol·licituds · KIPA',
      },
      {
        path: 'pagos',
        loadComponent: () =>
          import('../../features/billing/family/family-payments.component').then((m) => m.FamilyPaymentsComponent),
        title: 'Els meus pagaments · KIPA',
      },
      {
        path: 'preferencias',
        loadComponent: () =>
          import('../../features/family/preferences/family-preferences.component').then((m) => m.FamilyPreferencesComponent),
        title: 'Preferències · KIPA',
      },
      // F4 — Alumno detail (asistencia, informes, fotos)
      {
        path: 'alumno/:id',
        loadComponent: () =>
          import('../../features/family/alumno/family-alumno.component').then((m) => m.FamilyAlumnoComponent),
        title: 'Seguiment · KIPA',
      },
      {
        path: 'agenda',
        loadComponent: () =>
          import('../../features/family/agenda/family-agenda.component').then((m) => m.FamilyAgendaComponent),
        title: 'Agenda · KIPA',
      },
      {
        path: 'documents',
        loadComponent: () =>
          import('../../features/family/documents/family-documents.component').then((m) => m.FamilyDocumentsComponent),
        title: 'Documents · KIPA',
      },
      {
        path: 'admisions/:id',
        loadComponent: () =>
          import('../../features/family/admissions/family-admission-detail.component').then((m) => m.FamilyAdmissionDetailComponent),
        title: 'Detall admissió · KIPA',
      },
    ],
  },
];

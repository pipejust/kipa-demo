import { Routes } from '@angular/router';

import { authGuard, adminGuard } from '../../core/auth/auth.guard';
import { AdminShellComponent } from './admin-shell.component';

export const ADMIN_SHELL_ROUTES: Routes = [
  {
    path: '',
    component: AdminShellComponent,
    canActivate: [authGuard, adminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('../../features/dashboard/admin-dashboard.component').then((m) => m.AdminDashboardComponent),
        title: 'Inici · KIPA',
      },
      {
        path: 'alumnos',
        loadComponent: () =>
          import('../../features/students/list/students-list.component').then((m) => m.StudentsListComponent),
        title: 'Alumnes · KIPA',
      },
      {
        path: 'alumnos/:id',
        loadComponent: () =>
          import('../../features/students/detail/student-detail.component').then((m) => m.StudentDetailComponent),
        title: 'Detall alumne · KIPA',
      },
      {
        path: 'admissions',
        loadComponent: () =>
          import('../../features/admissions/list/admissions-list.component').then((m) => m.AdmissionsListComponent),
        title: 'Admissions · KIPA',
      },
      {
        path: 'admissions/new',
        loadComponent: () =>
          import('../../features/admissions/form/admission-form.component').then((m) => m.AdmissionFormComponent),
        title: 'Nova admissió · KIPA',
      },
      {
        path: 'admissions/:id',
        loadComponent: () =>
          import('../../features/admissions/form/admission-form.component').then((m) => m.AdmissionFormComponent),
        title: 'Admissió · KIPA',
      },
      // F4 — Assistència
      {
        path: 'asistencia',
        loadComponent: () =>
          import('../../features/attendance/attendance.component').then((m) => m.AttendanceComponent),
        title: 'Assistència · KIPA',
      },
      // F3 — Comunicacions
      {
        path: 'comunicaciones',
        loadComponent: () =>
          import('../../features/communications/comunicaciones.component').then((m) => m.ComunicacionesComponent),
        title: 'Comunicacions · KIPA',
      },
      // F5 — CMS
      {
        path: 'contingut',
        loadComponent: () =>
          import('../../features/cms/cms-editor.component').then((m) => m.CmsEditorComponent),
        title: 'Continguts · KIPA',
      },
      // F2 — Finances
      {
        path: 'finanzas',
        loadComponent: () =>
          import('../../features/billing/admin/finance-dashboard.component').then((m) => m.FinanceDashboardComponent),
        title: 'Finances · KIPA',
      },
      {
        path: 'finanzas/cuotas',
        loadComponent: () =>
          import('../../features/billing/admin/cuotas-list.component').then((m) => m.CuotasListComponent),
        title: 'Cuotes · KIPA',
      },
      {
        path: 'finanzas/remesas',
        loadComponent: () =>
          import('../../features/billing/admin/remesas-list.component').then((m) => m.RemesasListComponent),
        title: 'Remeses SEPA · KIPA',
      },
      // Account / topbar dropdown
      {
        path: 'profile',
        loadComponent: () =>
          import('../../features/account/profile/profile.component').then((m) => m.ProfileComponent),
        title: 'El meu perfil · KIPA',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('../../features/account/settings/settings.component').then((m) => m.SettingsComponent),
        title: 'Configuració · KIPA',
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('../../features/account/notifications/notifications.component').then((m) => m.NotificationsComponent),
        title: 'Notificacions · KIPA',
      },
      {
        path: 'help',
        loadComponent: () =>
          import('../../features/account/help/help.component').then((m) => m.HelpComponent),
        title: 'Ajuda i suport · KIPA',
      },
    ],
  },
];

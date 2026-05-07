import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login/login.component').then((m) => m.LoginComponent),
    title: 'Iniciar sessió · KIPA',
  },
  {
    path: 'recover',
    loadComponent: () =>
      import('./features/auth/recover/recover.component').then((m) => m.RecoverComponent),
    title: 'Recuperar contrasenya · KIPA',
  },
  {
    path: 'reset',
    loadComponent: () =>
      import('./features/auth/reset/reset.component').then((m) => m.ResetComponent),
    title: 'Nova contrasenya · KIPA',
  },
  {
    path: 'privacy',
    loadComponent: () =>
      import('./features/legal/privacy/privacy.component').then((m) => m.PrivacyComponent),
    title: 'Privacitat · KIPA',
  },
  {
    path: 'terms',
    loadComponent: () =>
      import('./features/legal/terms/terms.component').then((m) => m.TermsComponent),
    title: 'Condicions d\'ús · KIPA',
  },
  {
    path: 'a',
    loadChildren: () =>
      import('./layouts/admin-shell/admin-shell.routes').then((m) => m.ADMIN_SHELL_ROUTES),
  },
  {
    path: 'f',
    loadChildren: () =>
      import('./layouts/family-shell/family-shell.routes').then((m) => m.FAMILY_SHELL_ROUTES),
  },
  { path: '**', redirectTo: '/login' },
];

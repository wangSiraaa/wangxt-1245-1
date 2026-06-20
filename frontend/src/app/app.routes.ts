import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/main-layout/main-layout.component').then(m => m.MainLayoutComponent),
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard-redirect/dashboard-redirect.component')
            .then(m => m.DashboardRedirectComponent),
      },
      {
        path: 'owner/dashboard',
        canActivate: [roleGuard],
        data: { roles: ['owner'] },
        loadComponent: () => import('./pages/owner/dashboard/dashboard.component').then(m => m.OwnerDashboardComponent),
      },
      {
        path: 'owner/submit',
        canActivate: [roleGuard],
        data: { roles: ['owner'] },
        loadComponent: () => import('./pages/owner/submit/submit.component').then(m => m.OwnerSubmitComponent),
      },
      {
        path: 'freight/dashboard',
        canActivate: [roleGuard],
        data: { roles: ['freight'] },
        loadComponent: () => import('./pages/freight/dashboard/dashboard.component').then(m => m.FreightDashboardComponent),
      },
      {
        path: 'freight/inspect/:id',
        canActivate: [roleGuard],
        data: { roles: ['freight'] },
        loadComponent: () => import('./pages/freight/inspect/inspect.component').then(m => m.FreightInspectComponent),
      },
      {
        path: 'supervisor/dashboard',
        canActivate: [roleGuard],
        data: { roles: ['supervisor'] },
        loadComponent: () => import('./pages/supervisor/dashboard/dashboard.component').then(m => m.SupervisorDashboardComponent),
      },
      {
        path: 'supervisor/approve',
        canActivate: [roleGuard],
        data: { roles: ['supervisor'] },
        loadComponent: () => import('./pages/supervisor/approve/approve.component').then(m => m.SupervisorApproveComponent),
      },
      {
        path: 'supervisor/records',
        canActivate: [roleGuard],
        data: { roles: ['supervisor'] },
        loadComponent: () => import('./pages/supervisor/records/records.component').then(m => m.SupervisorRecordsComponent),
      },
      {
        path: 'shipment/:id',
        canActivate: [authGuard],
        loadComponent: () => import('./pages/shipment-detail/shipment-detail.component').then(m => m.ShipmentDetailComponent),
      },
      { path: '**', redirectTo: 'dashboard' },
    ],
  },
];

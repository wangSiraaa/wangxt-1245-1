import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router, RouterLink, RouterLinkActive } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { AuthService, UserRole } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
  ],
  template: `
    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav mode="side" opened class="sidenav">
        <div class="brand">
          <mat-icon class="brand-icon">local_shipping</mat-icon>
          <span class="brand-name">铁路危货检查</span>
        </div>
        <mat-nav-list>
          @for (item of menuItems(); track item.route) {
            <a mat-list-item [routerLink]="item.route" routerLinkActive="active">
              <mat-icon matListItemIcon>{{ item.icon }}</mat-icon>
              <span matListItemTitle>{{ item.label }}</span>
            </a>
          }
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <mat-toolbar color="primary" class="toolbar">
          <span class="page-title">{{ pageTitle() }}</span>
          <span class="spacer"></span>
          <button mat-icon-button [matMenuTriggerFor]="userMenu">
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #userMenu="matMenu">
            <div mat-menu-item disabled class="user-info">
              <strong>{{ user()?.name }}</strong>
              <small>{{ roleLabel() }}</small>
            </div>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>退出登录</span>
            </button>
          </mat-menu>
        </mat-toolbar>
        <div class="page-container">
          <router-outlet></router-outlet>
        </div>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [`
    .sidenav-container { height: 100vh; }
    .sidenav {
      width: 240px;
      background: #0f2744;
      color: #fff;
    }
    .brand {
      display: flex; align-items: center; gap: 10px;
      padding: 20px 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);
      margin-bottom: 8px;
    }
    .brand-icon { color: #ffa247; font-size: 32px; width: 32px; height: 32px; }
    .brand-name { font-size: 16px; font-weight: 600; }
    ::ng-deep .mat-mdc-list-item { color: #e2e8f0 !important; }
    ::ng-deep .mat-mdc-list-item.active {
      background: rgba(255,162,71,0.15) !important;
      border-left: 3px solid #ffa247;
    }
    .toolbar { background: #1a365d !important; }
    .page-title { font-size: 16px; font-weight: 500; margin-left: 8px; }
    .user-info { padding: 8px 16px; line-height: 1.4; }
    .user-info small { color: #718096; display: block; }
    .page-container { padding: 24px; min-height: calc(100vh - 64px); background: #f7fafc; }
  `],
})
export class MainLayoutComponent {
  private auth = inject(AuthService);
  private router = inject(Router);

  user = this.auth.user;
  role = this.auth.role;

  menuItems = computed(() => {
    const r = this.role();
    switch (r) {
      case 'owner':
        return [
          { route: '/owner/dashboard', label: '我的申报', icon: 'assignment' },
          { route: '/owner/submit', label: '新建申报', icon: 'add_circle' },
        ];
      case 'freight':
        return [
          { route: '/freight/dashboard', label: '待检任务', icon: 'assignment_turned_in' },
        ];
      case 'supervisor':
        return [
          { route: '/supervisor/dashboard', label: '数据看板', icon: 'dashboard' },
          { route: '/supervisor/approve', label: '禁限运审批', icon: 'how_to_reg' },
          { route: '/supervisor/records', label: '发运记录', icon: 'receipt_long' },
        ];
      default:
        return [];
    }
  });

  pageTitle = computed(() => {
    const url = this.router.url.split('?')[0];
    const menu = this.menuItems();
    const found = menu.find(m => url.startsWith(m.route));
    return found?.label || '铁路危险货物装载检查系统';
  });

  roleLabel(): string {
    const map: Record<UserRole, string> = {
      owner: '货主', freight: '货运员', supervisor: '安全监管员',
    };
    return map[this.role() as UserRole] || '';
  }

  logout() {
    this.auth.logout();
  }
}

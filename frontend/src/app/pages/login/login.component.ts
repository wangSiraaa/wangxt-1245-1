import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService, UserRole } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
  ],
  template: `
    <div class="login-bg">
      <div class="deco-circle deco-1"></div>
      <div class="deco-circle deco-2"></div>

      <mat-card class="login-card">
        <div class="brand-row">
          <mat-icon class="brand-icon">local_shipping</mat-icon>
          <div>
            <h1 class="title">铁路危险货物装载检查系统</h1>
            <p class="subtitle">Railway Dangerous Goods Inspection</p>
          </div>
        </div>

        <mat-tab-group [(selectedIndex)]="tabIndex" animationDuration="0ms">
          @for (tab of tabs; track tab.role) {
            <mat-tab [label]="tab.label">
              <form [formGroup]="form" (ngSubmit)="onSubmit(tab.role)" class="form">
                <mat-form-field appearance="outline" class="full">
                  <mat-label>用户名</mat-label>
                  <mat-icon matPrefix>person</mat-icon>
                  <input matInput formControlName="username" required />
                </mat-form-field>
                <mat-form-field appearance="outline" class="full">
                  <mat-label>密码</mat-label>
                  <mat-icon matPrefix>lock</mat-icon>
                  <input matInput type="password" formControlName="password" required />
                </mat-form-field>

                <button mat-raised-button color="primary" type="submit"
                  class="submit-btn" [disabled]="form.invalid || loading()">
                  @if (loading()) {
                    <mat-icon><span class="spinner"></span></mat-icon>
                  }
                  {{ tab.label }}登录
                </button>

                <div class="demo-tip">
                  <mat-icon>info</mat-icon>
                  <span>演示账号：{{ tab.demoUser }} / 密码：123456</span>
                </div>
              </form>
            </mat-tab>
          }
        </mat-tab-group>
      </mat-card>
    </div>
  `,
  styles: [`
    .login-bg {
      min-height: 100vh;
      background: linear-gradient(135deg, #1a365d 0%, #0e2340 100%);
      display: flex; align-items: center; justify-content: center;
      position: relative; overflow: hidden; padding: 24px;
    }
    .deco-circle {
      position: absolute; border-radius: 50%; filter: blur(60px); opacity: 0.4;
    }
    .deco-1 { width: 400px; height: 400px; background: #dd6b20; top: -100px; left: -100px; }
    .deco-2 { width: 500px; height: 500px; background: #38a169; bottom: -150px; right: -150px; }
    .login-card {
      width: 100%; max-width: 440px; padding: 32px;
      border-radius: 16px; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.4);
      position: relative; z-index: 1;
    }
    .brand-row { display: flex; align-items: center; gap: 16px; margin-bottom: 24px; }
    .brand-icon { font-size: 48px; width: 48px; height: 48px; color: #dd6b20; }
    .title { font-size: 20px; color: #1a365d; margin: 0; font-weight: 700; }
    .subtitle { font-size: 12px; color: #a0aec0; margin: 4px 0 0 0; letter-spacing: 0.5px; }
    .form { padding-top: 24px; display: flex; flex-direction: column; gap: 16px; }
    .full { width: 100%; }
    .submit-btn {
      height: 48px; font-size: 15px; font-weight: 600;
      background: #1a365d !important; border-radius: 8px;
    }
    .demo-tip {
      display: flex; align-items: center; gap: 8px;
      padding: 10px 12px; background: #ebf8ff; color: #2b6cb0;
      border-radius: 8px; font-size: 13px;
    }
    .demo-tip .mat-icon { font-size: 18px; width: 18px; height: 18px; }
    .spinner {
      display: inline-block; width: 16px; height: 16px;
      border: 2px solid #fff; border-top-color: transparent;
      border-radius: 50%; animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  tabIndex = 0;
  loading = signal(false);

  form = this.fb.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  tabs: { label: string; role: UserRole; demoUser: string }[] = [
    { label: '货主', role: 'owner', demoUser: 'owner01' },
    { label: '货运员', role: 'freight', demoUser: 'freight01' },
    { label: '安全监管员', role: 'supervisor', demoUser: 'super01' },
  ];

  ngOnInit() {
    if (this.auth.isAuthenticated()) {
      this.router.navigate([this.auth.getHomeRoute()]);
    }
  }

  async onSubmit(role: UserRole) {
    if (this.form.invalid) return;
    const { username, password } = this.form.value;
    this.loading.set(true);
    try {
      const user = await this.auth.login(username!, password!, role);
      this.snack.open(`欢迎回来，${user.name}`, '关闭', { duration: 2500 });
      this.router.navigate([this.auth.getHomeRoute(user.role)]);
    } catch (e: any) {
      this.snack.open(e?.error?.message || '登录失败', '关闭', {
        duration: 3000, panelClass: 'snack-warn',
      });
    } finally {
      this.loading.set(false);
    }
  }
}

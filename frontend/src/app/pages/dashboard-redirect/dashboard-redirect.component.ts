import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-dashboard-redirect',
  standalone: true,
  template: `<div class="loading">跳转中...</div>`,
  styles: [`.loading { padding: 40px; text-align: center; color: #a0aec0; }`],
})
export class DashboardRedirectComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    this.router.navigateByUrl(this.auth.getHomeRoute(), { replaceUrl: true });
  }
}

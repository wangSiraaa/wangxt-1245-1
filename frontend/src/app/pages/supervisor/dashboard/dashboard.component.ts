import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  ApiService, Statistics, ShipmentStatus,
} from '../../../core/services/api.service';

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  draft: '草稿', submitted: '已提交', inspecting: '检查中', photo_pending: '待补传照片',
  pending_approval: '待审批', approved: '审核通过', rejected: '已驳回', shipped: '已发运',
};

@Component({
  selector: 'app-supervisor-dashboard',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule, RouterLink],
  template: `
    <h2 class="page-title">数据看板</h2>

    <div class="stats-grid">
      <mat-card class="stat-card">
        <div class="stat-label">申报总数</div>
        <div class="stat-value">{{ stats()?.total || 0 }}</div>
        <mat-icon class="stat-icon">assignment</mat-icon>
      </mat-card>
      <mat-card class="stat-card accent">
        <div class="stat-label">本月新增</div>
        <div class="stat-value">{{ stats()?.thisMonth || 0 }}</div>
        <mat-icon class="stat-icon">trending_up</mat-icon>
      </mat-card>
      <mat-card class="stat-card success">
        <div class="stat-label">已发运</div>
        <div class="stat-value">{{ byStatus('shipped') }}</div>
        <mat-icon class="stat-icon">local_shipping</mat-icon>
      </mat-card>
      <mat-card class="stat-card warn">
        <div class="stat-label">待我审批</div>
        <div class="stat-value">{{ byStatus('pending_approval') }}</div>
        <a class="stat-link" routerLink="/supervisor/approve">去处理 <mat-icon>chevron_right</mat-icon></a>
        <mat-icon class="stat-icon">how_to_reg</mat-icon>
      </mat-card>
    </div>

    <div class="charts-row">
      <mat-card class="chart-card">
        <h3 class="card-title">按状态分布</h3>
        <div class="bar-chart">
          @for (item of stats()?.byStatus || []; track item.status) {
            <div class="bar-row">
              <span class="bar-label">{{ STATUS_LABEL[item.status] }}</span>
              <div class="bar-wrap">
                <div class="bar-fill status-{{ item.status }}"
                  [style.width.%]="(item.count / maxCount()) * 100"></div>
              </div>
              <span class="bar-count">{{ item.count }}</span>
            </div>
          }
        </div>
      </mat-card>

      <mat-card class="chart-card">
        <h3 class="card-title">快捷操作</h3>
        <div class="quick-links">
          <a mat-stroked-button routerLink="/supervisor/approve">
            <mat-icon>how_to_reg</mat-icon>禁限运审批
          </a>
          <a mat-stroked-button routerLink="/supervisor/records">
            <mat-icon>receipt_long</mat-icon>全量发运记录
          </a>
        </div>
      </mat-card>
    </div>
  `,
  styles: [`
    .page-title { font-size: 22px; color: #1a365d; margin: 0 0 20px 0; font-weight: 600; }
    .stats-grid {
      display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; margin-bottom: 24px;
    }
    .stat-card {
      position: relative; padding: 20px; border-radius: 12px; overflow: hidden;
    }
    .stat-card::before {
      content: ''; position: absolute; top: 0; left: 0; right: 0; height: 4px; background: #1a365d;
    }
    .stat-card.accent::before { background: #dd6b20; }
    .stat-card.success::before { background: #38a169; }
    .stat-card.warn::before { background: #e53e3e; }
    .stat-label { font-size: 13px; color: #718096; margin-bottom: 8px; }
    .stat-value { font-size: 36px; font-weight: 700; color: #1a365d; line-height: 1; }
    .stat-icon {
      position: absolute; right: 16px; bottom: 12px; font-size: 48px;
      width: 48px; height: 48px; color: rgba(26,54,93,0.1);
    }
    .stat-link {
      position: absolute; right: 16px; bottom: 12px;
      color: #dd6b20; font-size: 13px; display: flex; align-items: center;
    }
    .charts-row { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
    .chart-card { padding: 20px; }
    .card-title { font-size: 16px; color: #1a365d; margin: 0 0 16px 0; font-weight: 600; }
    .bar-chart { display: flex; flex-direction: column; gap: 12px; }
    .bar-row { display: flex; align-items: center; gap: 12px; }
    .bar-label { width: 80px; font-size: 13px; color: #4a5568; }
    .bar-wrap { flex: 1; height: 20px; background: #edf2f7; border-radius: 10px; overflow: hidden; }
    .bar-fill { height: 100%; border-radius: 10px; transition: width 0.5s; }
    .bar-fill.status-submitted { background: #4299e1; }
    .bar-fill.status-approved { background: #38a169; }
    .bar-fill.status-shipped { background: #805ad5; }
    .bar-fill.status-pending_approval { background: #dd6b20; }
    .bar-fill.status-rejected { background: #e53e3e; }
    .bar-fill.status-photo_pending { background: #ed8936; }
    .bar-fill.status-draft, .bar-fill.status-inspecting { background: #a0aec0; }
    .bar-count { width: 40px; font-weight: 600; color: #1a365d; text-align: right; }
    .quick-links { display: flex; flex-direction: column; gap: 12px; }
    .quick-links a { justify-content: flex-start; gap: 8px; }
    @media (max-width: 768px) {
      .charts-row { grid-template-columns: 1fr; }
    }
  `],
})
export class SupervisorDashboardComponent implements OnInit {
  private api = inject(ApiService);
  stats = signal<Statistics | null>(null);

  ngOnInit() { this.load(); }

  async load() {
    this.stats.set(await this.api.getStatistics());
  }

  byStatus(status: ShipmentStatus): number {
    return this.stats()?.byStatus?.find(s => s.status === status)?.count || 0;
  }

  maxCount(): number {
    return Math.max(1, ...(this.stats()?.byStatus?.map(s => s.count) || [1]));
  }
}

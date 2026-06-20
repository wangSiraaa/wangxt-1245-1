import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { ApiService, ShipmentRecord, ShipmentStatus } from '../../../core/services/api.service';

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  draft: '草稿', submitted: '已提交待检查', inspecting: '检查中',
  pending_approval: '待监管审批', approved: '审核通过', rejected: '已驳回', shipped: '已发运',
};

@Component({
  selector: 'app-owner-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, FormsModule,
  ],
  template: `
    <div class="header-row">
      <h2 class="page-title">我的申报</h2>
      <a mat-raised-button color="primary" routerLink="/owner/submit">
        <mat-icon>add</mat-icon>新建申报
      </a>
    </div>

    <mat-card class="filter-card">
      <div class="filter-row">
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>搜索</mat-label>
          <input matInput [(ngModel)]="keyword" (keyup.enter)="load()" placeholder="发运单号 / 品名 / 车牌">
        </mat-form-field>
        <mat-form-field appearance="outline" class="filter-field">
          <mat-label>状态</mat-label>
          <mat-select [(ngModel)]="filterStatus" (selectionChange)="load()">
            <mat-option value="">全部</mat-option>
            @for (s of statusList; track s.value) {
              <mat-option [value]="s.value">{{ s.label }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
        <button mat-stroked-button (click)="load()"><mat-icon>refresh</mat-icon>刷新</button>
      </div>
    </mat-card>

    <mat-card>
      <mat-table [dataSource]="data()" class="table">
        <ng-container matColumnDef="shipmentNo">
          <mat-header-cell *matHeaderCellDef>发运单号</mat-header-cell>
          <mat-cell *matCellDef="let r">{{ r.shipmentNo }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="goodName">
          <mat-header-cell *matHeaderCellDef>品名</mat-header-cell>
          <mat-cell *matCellDef="let r">{{ r.dangerousGood?.chineseName || r.dangerousGood?.name }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="vehicle">
          <mat-header-cell *matHeaderCellDef>车辆</mat-header-cell>
          <mat-cell *matCellDef="let r">{{ r.vehicle?.plateNumber }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="status">
          <mat-header-cell *matHeaderCellDef>状态</mat-header-cell>
          <mat-cell *matCellDef="let r">
            <span class="status-badge {{ r.status }}">{{ STATUS_LABEL[r.status] }}</span>
          </mat-cell>
        </ng-container>
        <ng-container matColumnDef="createdAt">
          <mat-header-cell *matHeaderCellDef>创建时间</mat-header-cell>
          <mat-cell *matCellDef="let r">{{ r.createdAt | slice:0:16 }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef>操作</mat-header-cell>
          <mat-cell *matCellDef="let r">
            <button mat-icon-button color="primary" [routerLink]="['/shipment', r.id]">
              <mat-icon>visibility</mat-icon>
            </button>
            @if (r.status === 'draft') {
              <button mat-icon-button color="accent" (click)="submit(r.id)">
                <mat-icon>send</mat-icon>
              </button>
            }
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="columns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: columns;"></mat-row>
      </mat-table>
      @if (data().length === 0) {
        <div class="empty">暂无申报记录，点击右上角"新建申报"开始</div>
      }
    </mat-card>
  `,
  styles: [`
    .header-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-title { font-size: 22px; color: #1a365d; margin: 0; font-weight: 600; }
    .filter-card { margin-bottom: 16px; }
    .filter-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: end; }
    .filter-field { min-width: 200px; }
    .table { width: 100%; }
    .empty { padding: 40px; text-align: center; color: #a0aec0; }
  `],
})
export class OwnerDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  data = signal<ShipmentRecord[]>([]);
  keyword = '';
  filterStatus = '';
  columns = ['shipmentNo', 'goodName', 'vehicle', 'status', 'createdAt', 'actions'];
  statusList = Object.entries(STATUS_LABEL).map(([value, label]) => ({ value, label }));

  async ngOnInit() {
    await this.load();
  }

  async load() {
    const params: any = {};
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.keyword) params.keyword = this.keyword;
    this.data.set(await this.api.getShipments(params));
  }

  async submit(id: string) {
    try {
      await this.api.submitShipment(id);
      await this.load();
    } catch (e: any) {
      alert(e?.error?.message || '提交失败');
    }
  }
}

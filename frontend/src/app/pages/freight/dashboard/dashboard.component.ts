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
import { MatChipsModule } from '@angular/material/chips';
import {
  ApiService, ShipmentRecord, ShipmentStatus,
} from '../../../core/services/api.service';

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  draft: '草稿', submitted: '待检查', inspecting: '检查中',
  pending_approval: '待监管审批', approved: '审核通过', rejected: '已驳回', shipped: '已发运',
};

@Component({
  selector: 'app-freight-dashboard',
  standalone: true,
  imports: [
    CommonModule, RouterLink, FormsModule,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule,
    MatInputModule, MatFormFieldModule, MatSelectModule, MatChipsModule,
  ],
  template: `
    <div class="header-row">
      <h2 class="page-title">待检任务</h2>
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
            <mat-option value="submitted">待检查</mat-option>
            <mat-option value="approved">审核通过</mat-option>
            <mat-option value="shipped">已发运</mat-option>
            <mat-option value="rejected">已驳回</mat-option>
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
          <mat-cell *matCellDef="let r">
            {{ r.dangerousGood?.chineseName || r.dangerousGood?.name }}
            @if (r.dangerousGood?.isRestricted) { <span class="badge badge-warn">限运</span> }
          </mat-cell>
        </ng-container>
        <ng-container matColumnDef="vehicle">
          <mat-header-cell *matHeaderCellDef>车辆</mat-header-cell>
          <mat-cell *matCellDef="let r">
            {{ r.vehicle?.plateNumber }}
            <span class="badge" [class]="r.vehicle?.cleaned ? 'badge-success' : 'badge-danger'">
              {{ r.vehicle?.cleaned ? '已清洗' : '未清洗' }}
            </span>
          </mat-cell>
        </ng-container>
        <ng-container matColumnDef="checks">
          <mat-header-cell *matHeaderCellDef>检查项</mat-header-cell>
          <mat-cell *matCellDef="let r">
            <span class="check-dot" [class.ok]="r.packingMatched">包装</span>
            <span class="check-dot" [class.ok]="r.vehicleCleanConfirmed">车辆</span>
            <span class="check-dot" [class.ok]="r.photosVerified">照片</span>
          </mat-cell>
        </ng-container>
        <ng-container matColumnDef="status">
          <mat-header-cell *matHeaderCellDef>状态</mat-header-cell>
          <mat-cell *matCellDef="let r">
            <span class="status-badge {{ r.status }}">{{ STATUS_LABEL[r.status] }}</span>
          </mat-cell>
        </ng-container>
        <ng-container matColumnDef="submittedAt">
          <mat-header-cell *matHeaderCellDef>提交时间</mat-header-cell>
          <mat-cell *matCellDef="let r">{{ (r.submittedAt || r.createdAt) | slice:0:16 }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="actions">
          <mat-header-cell *matHeaderCellDef>操作</mat-header-cell>
          <mat-cell *matCellDef="let r">
            <button mat-icon-button color="primary" [routerLink]="['/shipment', r.id]">
              <mat-icon>visibility</mat-icon>
            </button>
            @if (r.status === 'submitted' || r.status === 'inspecting' || r.status === 'pending_approval') {
              <button mat-raised-button color="primary" [routerLink]="['/freight/inspect', r.id]">
                <mat-icon>assignment_turned_in</mat-icon>检查
              </button>
            }
            @if (r.status === 'approved') {
              <button mat-raised-button color="accent" (click)="doShip(r.id)">
                <mat-icon>local_shipping</mat-icon>确认发运
              </button>
            }
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="columns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: columns;"></mat-row>
      </mat-table>
      @if (data().length === 0) {
        <div class="empty">暂无待检查任务</div>
      }
    </mat-card>
  `,
  styles: [`
    .header-row { margin-bottom: 16px; }
    .page-title { font-size: 22px; color: #1a365d; margin: 0; font-weight: 600; }
    .filter-card { margin-bottom: 16px; }
    .filter-row { display: flex; gap: 12px; flex-wrap: wrap; align-items: end; }
    .filter-field { min-width: 200px; }
    .table { width: 100%; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 6px; }
    .badge-warn { background: #feebc8; color: #c05621; }
    .badge-success { background: #c6f6d5; color: #276749; }
    .badge-danger { background: #fed7d7; color: #c53030; }
    .check-dot {
      display: inline-block; padding: 2px 8px; border-radius: 4px;
      font-size: 11px; margin-right: 4px; background: #e2e8f0; color: #4a5568;
    }
    .check-dot.ok { background: #c6f6d5; color: #276749; }
    .empty { padding: 40px; text-align: center; color: #a0aec0; }
  `],
})
export class FreightDashboardComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  data = signal<ShipmentRecord[]>([]);
  keyword = '';
  filterStatus = '';
  columns = ['shipmentNo', 'goodName', 'vehicle', 'checks', 'status', 'submittedAt', 'actions'];

  async ngOnInit() { await this.load(); }

  async load() {
    const params: any = {};
    if (this.filterStatus) params.status = this.filterStatus;
    if (this.keyword) params.keyword = this.keyword;
    this.data.set(await this.api.getShipments(params));
  }

  async doShip(id: string) {
    if (!confirm('确认已完成所有检查，是否标记为已发运？')) return;
    try {
      await this.api.shipShipment(id);
      await this.load();
    } catch (e: any) {
      alert(e?.error?.message || '操作失败');
    }
  }
}

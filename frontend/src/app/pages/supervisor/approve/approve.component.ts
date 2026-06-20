import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ApiService, ShipmentRecord } from '../../../core/services/api.service';

export interface ApproveDialogData {
  record: ShipmentRecord;
  approved: boolean;
}

@Component({
  selector: 'app-approve-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.approved ? '审批通过' : '审批驳回' }} - {{ data.record.shipmentNo }}</h2>
    <mat-dialog-content>
      <div class="info-row">
        <div><label>品名</label><span>{{ data.record.dangerousGood?.chineseName || data.record.dangerousGood?.name }}</span></div>
        <div><label>货主</label><span>{{ data.record.owner?.name }}</span></div>
        <div><label>车辆</label><span>{{ data.record.vehicle?.plateNumber }}</span></div>
      </div>
      <mat-form-field appearance="outline" class="full">
        <mat-label>审批意见</mat-label>
        <textarea matInput rows="4" [formControl]="remarkForm"
          [placeholder]="data.approved ? '填写通过原因（选填）' : '请填写驳回原因'"></textarea>
      </mat-form-field>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-stroked-button [mat-dialog-close]="undefined">取消</button>
      <button mat-raised-button [color]="data.approved ? 'primary' : 'warn'" [mat-dialog-close]="remarkForm.value">
        确认{{ data.approved ? '通过' : '驳回' }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .info-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; margin-bottom: 16px; }
    .info-row label { display: block; font-size: 12px; color: #718096; }
    .info-row span { color: #2d3748; font-weight: 500; }
    .full { width: 100%; }
  `],
})
export class ApproveDialogComponent {
  fb = inject(FormBuilder);
  data = inject<ApproveDialogData>(MAT_DIALOG_DATA);
  remarkForm = this.fb.control('');
}

@Component({
  selector: 'app-supervisor-approve',
  standalone: true,
  imports: [
    CommonModule, RouterLink,
    MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatDialogModule,
  ],
  template: `
    <h2 class="page-title">禁限运审批</h2>

    <mat-card>
      <mat-table [dataSource]="data()" class="table">
        <ng-container matColumnDef="shipmentNo">
          <mat-header-cell *matHeaderCellDef>发运单号</mat-header-cell>
          <mat-cell *matCellDef="let r">
            <a [routerLink]="['/shipment', r.id]" class="link">{{ r.shipmentNo }}</a>
          </mat-cell>
        </ng-container>
        <ng-container matColumnDef="goodName">
          <mat-header-cell *matHeaderCellDef>品名</mat-header-cell>
          <mat-cell *matCellDef="let r">
            {{ r.dangerousGood.chineseName || r.dangerousGood.name }}
            @if (r.dangerousGood.isForbidden) {
              <span class="badge badge-err">禁运</span>
            } @else if (r.dangerousGood.isRestricted) {
              <span class="badge badge-warn">限运</span>
            }
          </mat-cell>
        </ng-container>
        <ng-container matColumnDef="owner">
          <mat-header-cell *matHeaderCellDef>货主</mat-header-cell>
          <mat-cell *matCellDef="let r">{{ r.owner?.name }}</mat-cell>
        </ng-container>
        <ng-container matColumnDef="vehicle">
          <mat-header-cell *matHeaderCellDef>车辆</mat-header-cell>
          <mat-cell *matCellDef="let r">{{ r.vehicle.plateNumber }}</mat-cell>
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
            <button mat-raised-button color="primary" (click)="openDialog(r, true)">
              <mat-icon>check</mat-icon>通过
            </button>
            <button mat-raised-button color="warn" (click)="openDialog(r, false)">
              <mat-icon>close</mat-icon>驳回
            </button>
          </mat-cell>
        </ng-container>

        <mat-header-row *matHeaderRowDef="columns"></mat-header-row>
        <mat-row *matRowDef="let row; columns: columns;"></mat-row>
      </mat-table>
      @if (data().length === 0) {
        <div class="empty">暂无待审批的禁限运品申报</div>
      }
    </mat-card>
  `,
  styles: [`
    .page-title { font-size: 22px; color: #1a365d; margin: 0 0 16px 0; font-weight: 600; }
    .table { width: 100%; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 6px; }
    .badge-warn { background: #feebc8; color: #c05621; }
    .badge-err { background: #fed7d7; color: #c53030; }
    .link { color: #2b6cb0; text-decoration: none; font-weight: 500; }
    .empty { padding: 40px; text-align: center; color: #a0aec0; }
  `],
})
export class SupervisorApproveComponent implements OnInit {
  private api = inject(ApiService);
  private dialog = inject(MatDialog);

  data = signal<ShipmentRecord[]>([]);
  columns = ['shipmentNo', 'goodName', 'owner', 'vehicle', 'submittedAt', 'actions'];

  async ngOnInit() { await this.load(); }

  async load() {
    const all = await this.api.getShipments();
    this.data.set(all.filter(r => r.status === 'pending_approval'));
  }

  openDialog(record: ShipmentRecord, approved: boolean) {
    const ref = this.dialog.open(ApproveDialogComponent, {
      data: { record, approved },
      width: '560px',
    });
    ref.afterClosed().subscribe(async (remark?: string) => {
      if (remark === undefined) return;
      try {
        await this.api.approveShipment(record.id, { approved, remark: remark || undefined });
        await this.load();
      } catch (e: any) {
        alert(e?.error?.message || '操作失败');
      }
    });
  }
}

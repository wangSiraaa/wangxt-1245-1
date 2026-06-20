import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  ApiService, ShipmentRecord, InspectionItem,
} from '../../../core/services/api.service';

@Component({
  selector: 'app-freight-inspect',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule,
    MatStepperModule, MatCardModule, MatFormFieldModule, MatInputModule,
    MatCheckboxModule, MatButtonModule, MatIconModule, MatChipsModule, MatSnackBarModule,
  ],
  template: `
    @if (record()) {
      <div class="top-info">
        <button mat-stroked-button (click)="back()"><mat-icon>arrow_back</mat-icon>返回</button>
        <h2 class="page-title">装载检查 - {{ record()!.shipmentNo }}</h2>
      </div>

      <div class="summary-card">
        <div class="sum-row">
          <div><label>品名</label><strong>{{ record()!.dangerousGood.chineseName || record()!.dangerousGood.name }}</strong></div>
          <div><label>UN编号</label>UN {{ record()!.dangerousGood.unCode }}</div>
          <div><label>危险等级</label>第 {{ record()!.dangerousGood.hazardClass }} 类</div>
          <div><label>包装等级</label>{{ record()!.packingGroup }} 级</div>
          <div><label>车辆</label>{{ record()!.vehicle.plateNumber }}（{{ record()!.vehicle.vehicleType }}）</div>
        </div>
      </div>

      <mat-stepper [linear]="true" #stepper>
        <mat-step [stepControl]="step1">
          <ng-template matStepLabel>装载加固检查</ng-template>
          <mat-card>
            <h3 class="card-title">装载加固检查项</h3>
            <div class="items-list">
              @for (item of inspectionItems(); track item.id) {
                <div class="check-item">
                  <div class="ci-left">
                    <mat-checkbox [formControl]="getItemControl(item.id).get('passed')"></mat-checkbox>
                    <div>
                      <div class="ci-name">
                        {{ item.name }}
                        @if (item.required) { <span class="badge badge-warn">必查</span> }
                        <span class="ci-cat">{{ item.category }}</span>
                      </div>
                      <div class="ci-desc">{{ item.description }}</div>
                    </div>
                  </div>
                  <mat-form-field appearance="outline" class="ci-remark">
                    <mat-label>备注</mat-label>
                    <input matInput [formControl]="getItemControl(item.id).get('remark')">
                  </mat-form-field>
                </div>
              }
            </div>
            <div class="step-actions">
              <button mat-stroked-button matStepperNext>下一步<mat-icon>navigate_next</mat-icon></button>
            </div>
          </mat-card>
        </mat-step>

        <mat-step [stepControl]="step2">
          <ng-template matStepLabel>车辆与照片核验</ng-template>
          <mat-card>
            <h3 class="card-title">车辆清洗确认 & 照片核验</h3>

            <div class="check-block">
              <mat-checkbox formControlName="vehicleCleanConfirmed" color="primary">
                <strong>已确认该车辆（{{ record()!.vehicle.plateNumber }}）已完成清洗</strong>
              </mat-checkbox>
              @if (!record()!.vehicle.cleaned) {
                <div class="warn-tip">
                  <mat-icon>warning</mat-icon>
                  车辆系统状态为"未清洗"，请现场确认后手动勾选，或
                  <a (click)="confirmVehicleClean()">点击确认车辆已清洗</a>
                </div>
              }
            </div>

            <div class="check-block">
              <mat-checkbox formControlName="photosVerified" color="primary">
                <strong>已核验装载照片完整合规</strong>
              </mat-checkbox>
              <div class="photo-grid">
                @for (p of record()!.photos; track p.id) {
                  <div class="photo-item">
                    <img [src]="'/uploads/' + p.filePath.split('/').pop()" [alt]="p.fileName">
                    <small>{{ p.fileName }}</small>
                  </div>
                }
              </div>
            </div>

            <div class="step-actions">
              <button mat-stroked-button matStepperPrevious><mat-icon>navigate_before</mat-icon>上一步</button>
              <button mat-stroked-button matStepperNext
                [disabled]="!step2.controls.vehicleCleanConfirmed.value || !step2.controls.photosVerified.value">
                下一步<mat-icon>navigate_next</mat-icon>
              </button>
            </div>
          </mat-card>
        </mat-step>

        <mat-step>
          <ng-template matStepLabel>审核结论</ng-template>
          <mat-card>
            <h3 class="card-title">审核结论与备注</h3>
            <mat-form-field appearance="outline" class="full">
              <mat-label>检查备注</mat-label>
              <textarea matInput rows="4" formControlName="remark" placeholder="填写整体检查说明、不合格项描述等"></textarea>
            </mat-form-field>

            <div class="result-row">
              <button mat-raised-button color="warn" (click)="submitResult('fail')">
                <mat-icon>close</mat-icon>驳回
              </button>
              <button mat-raised-button color="primary" (click)="submitResult('pass')">
                <mat-icon>check_circle</mat-icon>审核通过
              </button>
            </div>
          </mat-card>
        </mat-step>
      </mat-stepper>
    } @else {
      <div class="empty">加载中...</div>
    }
  `,
  styles: [`
    .top-info { display: flex; align-items: center; gap: 12px; margin-bottom: 16px; }
    .page-title { font-size: 22px; color: #1a365d; margin: 0; font-weight: 600; }
    .summary-card { background: #f7fafc; padding: 16px 24px; border-radius: 8px; margin-bottom: 16px; }
    .sum-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 12px; }
    .sum-row label { display: block; font-size: 12px; color: #718096; }
    .sum-row strong { color: #1a365d; }
    .card-title { font-size: 16px; color: #1a365d; margin: 0 0 16px 0; font-weight: 600; }
    .items-list { display: flex; flex-direction: column; gap: 8px; }
    .check-item {
      display: flex; align-items: center; gap: 16px;
      padding: 12px; background: #fff; border: 1px solid #e2e8f0; border-radius: 6px;
    }
    .ci-left { display: flex; align-items: flex-start; gap: 12px; flex: 1; }
    .ci-name { font-weight: 500; color: #2d3748; display: flex; align-items: center; gap: 8px; }
    .ci-cat { font-size: 11px; color: #718096; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; }
    .ci-desc { font-size: 13px; color: #718096; margin-top: 4px; }
    .ci-remark { width: 240px; }
    .badge { display: inline-block; padding: 2px 6px; border-radius: 4px; font-size: 11px; }
    .badge-warn { background: #feebc8; color: #c05621; }
    .check-block { margin-bottom: 24px; padding: 16px; background: #f7fafc; border-radius: 8px; }
    .warn-tip { margin-top: 8px; display: flex; align-items: center; gap: 8px; color: #c05621; font-size: 13px; }
    .warn-tip a { color: #2b6cb0; text-decoration: underline; cursor: pointer; }
    .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-top: 12px; }
    .photo-item { text-align: center; }
    .photo-item img { width: 100%; height: 120px; object-fit: cover; border-radius: 6px; display: block; }
    .photo-item small { color: #718096; }
    .full { width: 100%; margin-bottom: 16px; }
    .result-row { display: flex; justify-content: flex-end; gap: 12px; }
    .step-actions { display: flex; justify-content: space-between; margin-top: 24px; }
    .empty { padding: 40px; text-align: center; color: #a0aec0; }
  `],
})
export class FreightInspectComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private fb = inject(FormBuilder);
  private snack = inject(MatSnackBar);

  record = signal<ShipmentRecord | null>(null);
  inspectionItems = signal<InspectionItem[]>([]);

  step1 = this.fb.group({ items: this.fb.array([]) });
  step2 = this.fb.group({
    vehicleCleanConfirmed: [false, Validators.requiredTrue],
    photosVerified: [false, Validators.requiredTrue],
  });
  remarkCtrl = this.fb.control('');

  async ngOnInit() {
    const id = this.route.snapshot.params['id'];
    const [r, items] = await Promise.all([
      this.api.getShipment(id),
      this.api.getInspectionItems(),
    ]);
    this.record.set(r);
    this.inspectionItems.set(items);
    const itemsArr = this.step1.controls.items as FormArray;
    items.forEach(it => itemsArr.push(this.fb.group({
      itemId: [it.id], passed: [false], remark: [''],
    })));
    this.step2.controls.vehicleCleanConfirmed.setValue(!!r.vehicleCleanConfirmed);
    this.step2.controls.photosVerified.setValue(!!r.photosVerified);
  }

  getItemControl(itemId: string) {
    const arr = this.step1.controls.items as FormArray;
    return arr.controls.find(c => c.value.itemId === itemId) as any;
  }

  async confirmVehicleClean() {
    try {
      await this.api.confirmVehicleClean(this.record()!.vehicle.id);
      this.snack.open('车辆已标记为已清洗', '关闭', { duration: 2500 });
      this.record.update(r => r ? { ...r, vehicle: { ...r.vehicle, cleaned: true } } : r);
      this.step2.controls.vehicleCleanConfirmed.setValue(true);
    } catch (e: any) {
      this.snack.open(e?.error?.message || '操作失败', '关闭', { duration: 2500 });
    }
  }

  async submitResult(result: 'pass' | 'fail') {
    const items = (this.step1.controls.items as FormArray).value
      .filter((v: any) => v.passed || v.remark);
    try {
      await this.api.inspectShipment(this.record()!.id, {
        inspectionItems: items,
        vehicleCleanConfirmed: this.step2.controls.vehicleCleanConfirmed.value!,
        photosVerified: this.step2.controls.photosVerified.value!,
        overallResult: result,
        remark: this.remarkCtrl.value || undefined,
      });
      this.snack.open(`检查已${result === 'pass' ? '通过' : '驳回'}`, '关闭', { duration: 2500 });
      this.back();
    } catch (e: any) {
      this.snack.open(e?.error?.message || '提交失败', '关闭', { duration: 3000 });
    }
  }

  back() { this.router.navigate(['/freight/dashboard']); }
}

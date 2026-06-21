import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatStepperModule } from '@angular/material/stepper';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  ApiService, DangerousGood, Vehicle,
} from '../../../core/services/api.service';

export interface PhotoItem {
  fileId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

@Component({
  selector: 'app-owner-submit',
  standalone: true,
  imports: [
    CommonModule, ReactiveFormsModule, DatePipe,
    MatStepperModule, MatCardModule, MatFormFieldModule,
    MatInputModule, MatSelectModule, MatButtonModule,
    MatIconModule, MatAutocompleteModule, MatChipsModule, MatSnackBarModule,
  ],
  template: `
    <h2 class="page-title">新建装载申报</h2>

    <mat-stepper [linear]="true" #stepper>
      <!-- Step 1: 选择品名 -->
      <mat-step [stepControl]="goodForm">
        <ng-template matStepLabel>选择危险品</ng-template>
        <mat-card class="step-card">
          <h3 class="card-title">选择危险货物品名</h3>
          <mat-form-field appearance="outline" class="full">
            <mat-label>搜索品名（中文/英文/UN编号）</mat-label>
            <input matInput [matAutocomplete]="auto" [formControl]="goodForm.controls.search">
            <mat-icon matSuffix>search</mat-icon>
          </mat-form-field>
          <mat-autocomplete #auto="matAutocomplete" (optionSelected)="selectGood($event.option.value)">
            @for (g of goodsOptions(); track g.id) {
              <mat-option [value]="g">
                <span class="opt-title">{{ g.chineseName || g.name }}</span>
                <span class="opt-sub">UN{{ g.unCode }} · 危险等级: {{ g.hazardClass }}</span>
                @if (g.isForbidden) {
                  <span class="badge badge-danger">禁运</span>
                }
                @if (g.isRestricted) {
                  <span class="badge badge-warn">限运</span>
                }
              </mat-option>
            }
            @if (goodsOptions().length === 0 && goodForm.controls.search.value) {
              <mat-option disabled>未找到匹配结果</mat-option>
            }
          </mat-autocomplete>

          @if (selectedGood()) {
            <div class="good-detail">
              <div class="gd-header">
                <span class="gd-name">{{ selectedGood()!.chineseName || selectedGood()!.name }}</span>
                <span class="gd-un">UN {{ selectedGood()!.unCode }}</span>
              </div>
              <div class="gd-grid">
                <div><label>危险等级</label><strong>第 {{ selectedGood()!.hazardClass }} 类</strong></div>
                <div>
                  <label>要求包装等级</label>
                  <strong class="pg pg-{{ selectedGood()!.requiredPackingGroup }}">
                    {{ selectedGood()!.requiredPackingGroup }} 级包装
                  </strong>
                </div>
                <div><label>禁运</label><strong [class.red]="selectedGood()!.isForbidden">{{ selectedGood()!.isForbidden ? '是' : '否' }}</strong></div>
                <div><label>限运</label><strong [class.orange]="selectedGood()!.isRestricted">{{ selectedGood()!.isRestricted ? '是（需审批）' : '否' }}</strong></div>
              </div>
              @if (selectedGood()!.remarks) {
                <div class="gd-remarks"><mat-icon>info</mat-icon>{{ selectedGood()!.remarks }}</div>
              }
              @if (selectedGood()!.isForbidden) {
                <div class="alert-danger"><mat-icon>block</mat-icon>该货物品名属于禁运品，不能受理申报</div>
              }
            </div>
          }
          <div class="step-actions">
            <button mat-stroked-button matStepperNext [disabled]="!selectedGood() || selectedGood()?.isForbidden">
              下一步<mat-icon>navigate_next</mat-icon>
            </button>
          </div>
        </mat-card>
      </mat-step>

      <!-- Step 2: 包装与车辆 -->
      <mat-step [stepControl]="detailForm">
        <ng-template matStepLabel>包装与车辆</ng-template>
        <mat-card class="step-card">
          <h3 class="card-title">填写包装与车辆信息</h3>

          <div class="form-grid">
            <mat-form-field appearance="outline">
              <mat-label>实际包装等级</mat-label>
              <mat-select formControlName="packingGroup">
                <mat-option value="I">I 级（最高等级）</mat-option>
                <mat-option value="II">II 级</mat-option>
                <mat-option value="III">III 级</mat-option>
              </mat-select>
              <mat-hint *ngIf="selectedGood()">
                该品名要求：{{ selectedGood()!.requiredPackingGroup }} 级包装
              </mat-hint>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>包装方式</mat-label>
              <input matInput formControlName="packingMethod" placeholder="如：铁桶密封 / 纤维板箱">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>选择车辆</mat-label>
              <mat-select formControlName="vehicleId">
                <mat-option *ngFor="let v of vehicles()" [value]="v.id">
                  <span class="vehicle-opt">
                    <strong>{{ v.plateNumber }}</strong>
                    <small>{{ v.vehicleType || '货车' }}</small>
                    <span class="badge" [class]="v.cleaned ? 'badge-success' : 'badge-danger'">
                      {{ v.cleaned ? '已清洗' : '未清洗' }}
                    </span>
                  </span>
                </mat-option>
              </mat-select>
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>毛重（kg）</mat-label>
              <input matInput type="number" formControlName="grossWeight">
            </mat-form-field>

            <mat-form-field appearance="outline">
              <mat-label>件数</mat-label>
              <input matInput type="number" formControlName="quantity">
            </mat-form-field>
          </div>

          <div class="step-actions">
            <button mat-stroked-button matStepperPrevious><mat-icon>navigate_before</mat-icon>上一步</button>
            <button mat-stroked-button matStepperNext [disabled]="!detailForm.valid">
              下一步<mat-icon>navigate_next</mat-icon>
            </button>
          </div>
        </mat-card>
      </mat-step>

      <!-- Step 3: 照片 -->
      <mat-step>
        <ng-template matStepLabel>装载照片</ng-template>
        <mat-card class="step-card">
          <h3 class="card-title">上传装载照片（至少1张）</h3>
          <div class="upload-area" (drop)="onDrop($event)" (dragover)="onDragOver($event)">
            <input type="file" #fileInput multiple accept="image/*" (change)="onFileChange($event)" hidden>
            <button mat-raised-button color="primary" (click)="fileInput.click()">
              <mat-icon>cloud_upload</mat-icon>选择照片
            </button>
            <p class="upload-hint">或将文件拖拽到此处（支持 JPG/PNG，单张最大 10MB）</p>
          </div>

          <div class="photo-grid">
            @for (p of photos(); track p.fileId) {
              <div class="photo-item">
                <img [src]="p.url" [alt]="p.fileName">
                <button mat-icon-button class="remove-btn" (click)="removePhoto(p.fileId)">
                  <mat-icon>close</mat-icon>
                </button>
                <small class="photo-name">{{ p.fileName }}</small>
              </div>
            }
          </div>
          @if (uploading()) {
            <p class="uploading">上传中...</p>
          }

          <div class="step-actions">
            <button mat-stroked-button matStepperPrevious><mat-icon>navigate_before</mat-icon>上一步</button>
            <button mat-stroked-button matStepperNext [disabled]="photos().length === 0">
              下一步<mat-icon>navigate_next</mat-icon>
            </button>
          </div>
        </mat-card>
      </mat-step>

      <!-- Step 4: 确认 -->
      <mat-step>
        <ng-template matStepLabel>确认提交</ng-template>
        <mat-card class="step-card">
          <h3 class="card-title">确认申报信息</h3>
          <div class="summary">
            <div class="summary-row"><label>品名</label><span>{{ selectedGood()?.chineseName || selectedGood()?.name }}</span></div>
            <div class="summary-row"><label>UN编号</label><span>UN {{ selectedGood()?.unCode }}</span></div>
            <div class="summary-row"><label>包装等级</label><span>{{ detailForm.value.packingGroup }} 级</span></div>
            <div class="summary-row"><label>包装方式</label><span>{{ detailForm.value.packingMethod }}</span></div>
            <div class="summary-row"><label>车辆</label><span>{{ selectedVehicle()?.plateNumber }}（{{ selectedVehicle()?.vehicleType }}）</span></div>
            <div class="summary-row"><label>毛重 / 件数</label><span>{{ detailForm.value.grossWeight }} kg / {{ detailForm.value.quantity }} 件</span></div>
            <div class="summary-row"><label>照片</label><span>{{ photos().length }} 张</span></div>
          </div>

          <div class="step-actions">
            <button mat-stroked-button matStepperPrevious><mat-icon>navigate_before</mat-icon>返回修改</button>
            <button mat-raised-button color="primary" (click)="submit()" [disabled]="submitting()">
              @if (submitting()) { <mat-icon><span class="spinner"></span></mat-icon> }
              提交申报
            </button>
          </div>
        </mat-card>
      </mat-step>
    </mat-stepper>
  `,
  styles: [`
    .page-title { font-size: 22px; color: #1a365d; margin: 0 0 16px 0; font-weight: 600; }
    .step-card { margin-bottom: 16px; }
    .card-title { font-size: 16px; color: #1a365d; margin: 0 0 16px 0; font-weight: 600; }
    .full { width: 100%; }
    .opt-title { display: block; font-weight: 500; color: #1a365d; }
    .opt-sub { display: block; font-size: 12px; color: #718096; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; margin-left: 8px; }
    .badge-danger { background: #fed7d7; color: #c53030; }
    .badge-warn { background: #feebc8; color: #c05621; }
    .badge-success { background: #c6f6d5; color: #276749; }
    .good-detail {
      margin-top: 8px; padding: 16px; background: #f7fafc; border-radius: 8px;
      border: 1px solid #e2e8f0;
    }
    .gd-header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 12px; }
    .gd-name { font-size: 18px; font-weight: 600; color: #1a365d; }
    .gd-un { font-size: 14px; color: #dd6b20; font-weight: 500; }
    .gd-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 12px; }
    .gd-grid label { display: block; font-size: 12px; color: #718096; margin-bottom: 4px; }
    .gd-grid .red { color: #c53030; } .gd-grid .orange { color: #c05621; }
    .pg { padding: 2px 8px; border-radius: 4px; }
    .pg-I { background: #fed7d7; color: #c53030; }
    .pg-II { background: #feebc8; color: #c05621; }
    .pg-III { background: #bee3f8; color: #2b6cb0; }
    .gd-remarks { display: flex; align-items: center; gap: 6px; color: #718096; font-size: 13px; }
    .gd-remarks .mat-icon { font-size: 18px; }
    .alert-danger { margin-top: 12px; padding: 10px 12px; background: #fff5f5; color: #c53030; border-radius: 6px; display: flex; align-items: center; gap: 8px; }
    .form-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 16px; }
    .vehicle-opt { display: flex; align-items: center; gap: 12px; }
    .vehicle-opt small { color: #718096; }
    .upload-area {
      padding: 32px; border: 2px dashed #cbd5e0; border-radius: 8px;
      text-align: center; transition: all 0.2s;
    }
    .upload-area.dragover { border-color: #1a365d; background: #ebf8ff; }
    .upload-hint { color: #a0aec0; font-size: 13px; margin: 8px 0 0 0; }
    .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 12px; margin-top: 16px; }
    .photo-item { position: relative; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
    .photo-item img { width: 100%; height: 120px; object-fit: cover; display: block; }
    .remove-btn { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); color: #fff; }
    .photo-name { display: block; padding: 4px 8px; font-size: 12px; color: #4a5568; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .uploading { color: #c05621; font-size: 13px; margin-top: 12px; }
    .summary { background: #f7fafc; padding: 16px; border-radius: 8px; }
    .summary-row { display: flex; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
    .summary-row:last-child { border-bottom: none; }
    .summary-row label { width: 120px; color: #718096; }
    .summary-row span { flex: 1; color: #1a365d; font-weight: 500; }
    .step-actions { display: flex; justify-content: space-between; margin-top: 24px; }
    .spinner { display: inline-block; width: 16px; height: 16px; border: 2px solid #fff; border-top-color: transparent; border-radius: 50%; animation: spin 0.8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class OwnerSubmitComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private router = inject(Router);
  private snack = inject(MatSnackBar);

  goodsOptions = signal<DangerousGood[]>([]);
  vehicles = signal<Vehicle[]>([]);
  selectedGood = signal<DangerousGood | null>(null);
  photos = signal<PhotoItem[]>([]);
  uploading = signal(false);
  submitting = signal(false);

  goodForm = this.fb.group({
    search: ['', Validators.required],
  });

  detailForm = this.fb.group({
    packingGroup: ['', Validators.required],
    packingMethod: ['', Validators.required],
    vehicleId: ['', Validators.required],
    grossWeight: [0, [Validators.required, Validators.min(0.1)]],
    quantity: [1, [Validators.required, Validators.min(1)]],
  });

  async ngOnInit() {
    this.vehicles.set(await this.api.getVehicles('available'));
    this.goodForm.controls.search.valueChanges.subscribe(async (kw) => {
      if (kw && kw.length >= 1) {
        this.goodsOptions.set(await this.api.searchDangerousGoods(kw as string));
      } else {
        this.goodsOptions.set([]);
      }
    });
  }

  selectGood(g: DangerousGood) {
    this.selectedGood.set(g);
  }

  selectedVehicle(): Vehicle | undefined {
    return this.vehicles().find(v => v.id === this.detailForm.value.vehicleId);
  }

  onDragOver(e: DragEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.add('dragover');
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    (e.currentTarget as HTMLElement).classList.remove('dragover');
    const files = Array.from(e.dataTransfer?.files || []).filter(f => f.type.startsWith('image/'));
    this.handleFiles(files);
  }

  onFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []);
    this.handleFiles(files);
    input.value = '';
  }

  async handleFiles(files: File[]) {
    this.uploading.set(true);
    try {
      for (const f of files) {
        const res = await this.api.uploadPhoto(f);
        this.photos.update(ps => [...ps, {
          fileId: res.fileId, fileName: res.fileName, url: res.url,
          filePath: res.url, fileSize: res.size, mimeType: f.type,
        }]);
      }
    } catch (e) {
      this.snack.open('部分照片上传失败', '关闭', { duration: 2500 });
    } finally {
      this.uploading.set(false);
    }
  }

  removePhoto(fileId: string) {
    this.photos.update(ps => ps.filter(p => p.fileId !== fileId));
  }

  async submit() {
    if (!this.selectedGood() || !this.detailForm.valid || this.photos().length === 0) return;
    this.submitting.set(true);
    try {
      const record = await this.api.createShipment({
        dangerousGoodId: this.selectedGood()!.id,
        packingGroup: this.detailForm.value.packingGroup as 'I' | 'II' | 'III',
        packingMethod: this.detailForm.value.packingMethod!,
        vehicleId: this.detailForm.value.vehicleId!,
        grossWeight: Number(this.detailForm.value.grossWeight),
        quantity: Number(this.detailForm.value.quantity),
        photoFileNames: this.photos().map(p => ({
          fileName: p.fileName, filePath: p.filePath, fileSize: p.fileSize, mimeType: p.mimeType,
        })),
      });
      this.snack.open('申报创建成功！', '查看详情', { duration: 3500 })
        .onAction().subscribe(() => this.router.navigate(['/shipment', record.id]));
      this.router.navigate(['/owner/dashboard']);
    } catch (e: any) {
      this.snack.open(e?.error?.message || '提交失败，请检查', '关闭', { duration: 3500 });
    } finally {
      this.submitting.set(false);
    }
  }
}

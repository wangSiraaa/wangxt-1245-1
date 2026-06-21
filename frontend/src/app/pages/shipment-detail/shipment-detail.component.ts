import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import {
  ApiService, ShipmentRecord, ShipmentStatus,
} from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

const STATUS_LABEL: Record<ShipmentStatus, string> = {
  draft: '草稿', submitted: '已提交', inspecting: '检查中', photo_pending: '待补传照片',
  pending_approval: '待监管审批', approved: '审核通过', rejected: '已驳回', shipped: '已发运',
};

interface TimelineStep {
  key: string;
  title: string;
  time: string | null;
  done: boolean;
  current: boolean;
  desc?: string;
}

interface NewPhoto {
  fileId: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  url: string;
}

const STEP_ORDER: ShipmentStatus[] = ['draft', 'submitted', 'inspecting', 'pending_approval', 'approved', 'shipped'];
const STEP_TITLES: Record<ShipmentStatus, string> = {
  draft: '创建草稿', submitted: '货主提交', inspecting: '货运员检查',
  pending_approval: '监管员审批', approved: '审核通过', rejected: '已驳回', shipped: '已发运',
};

@Component({
  selector: 'app-shipment-detail',
  standalone: true,
  imports: [
    CommonModule, DatePipe, RouterLink,
    MatCardModule, MatIconModule, MatButtonModule,
    MatDividerModule, MatChipsModule, MatListModule, MatSnackBarModule,
  ],
  template: `
    @if (record()) {
      <div class="top-bar">
        <button mat-stroked-button (click)="back()">
          <mat-icon>arrow_back</mat-icon>返回
        </button>
        <h2 class="title">发运记录详情 - {{ record()!.shipmentNo }}</h2>
        <span class="status-badge {{ record()!.status }}">{{ STATUS_LABEL[record()!.status] }}</span>
      </div>

      <div class="detail-grid">
        <div class="main-col">
          <mat-card class="card">
            <h3 class="card-title">
              <mat-icon>info</mat-icon>申报信息
            </h3>
            <div class="info-grid">
              <div><label>品名（中文）</label><span>{{ record()!.dangerousGood.chineseName }}</span></div>
              <div><label>品名（英文）</label><span>{{ record()!.dangerousGood.name }}</span></div>
              <div><label>UN编号</label><span>UN {{ record()!.dangerousGood.unCode }}</span></div>
              <div><label>危险等级</label><span>第 {{ record()!.dangerousGood.hazardClass }} 类</span></div>
              <div>
                <label>要求包装等级</label>
                <span class="pg pg-{{ record()!.dangerousGood.requiredPackingGroup }}">
                  {{ record()!.dangerousGood.requiredPackingGroup }} 级
                </span>
              </div>
              <div>
                <label>实际包装等级</label>
                <span class="pg pg-{{ record()!.packingGroup }}">
                  {{ record()!.packingGroup }} 级
                  @if (record()!.packingMatched) {
                    <mat-icon class="ok">check_circle</mat-icon>
                  } @else {
                    <mat-icon class="err">cancel</mat-icon>
                  }
                </span>
              </div>
              <div><label>包装方式</label><span>{{ record()!.packingMethod }}</span></div>
              <div><label>毛重</label><span>{{ record()!.grossWeight }} kg</span></div>
              <div><label>件数</label><span>{{ record()!.quantity }} 件</span></div>
            </div>
          </mat-card>

          <mat-card class="card">
            <h3 class="card-title">
              <mat-icon>local_shipping</mat-icon>车辆信息
            </h3>
            <div class="info-grid">
              <div><label>车牌号</label><span>{{ record()!.vehicle.plateNumber }}</span></div>
              <div><label>车型</label><span>{{ record()!.vehicle.vehicleType }}</span></div>
              <div>
                <label>清洗状态</label>
                <span>
                  {{ record()!.vehicle.cleaned ? '已清洗' : '未清洗' }}
                  @if (record()!.vehicleCleanConfirmed) {
                    <mat-icon class="ok">check_circle</mat-icon>
                  } @else {
                    <mat-icon class="err">cancel</mat-icon>
                  }
                </span>
              </div>
              <div><label>上次清洗时间</label><span>{{ record()!.vehicle.lastCleanedAt || '-' }}</span></div>
            </div>
          </mat-card>

          <mat-card class="card">
            <h3 class="card-title">
              <mat-icon>photo_library</mat-icon>装载照片
              @if (record()!.photosVerified) {
                <mat-icon class="ok small">check_circle</mat-icon>
              }
            </h3>

            @if (record()!.photoStatus === 'pending_resubmit') {
              <div class="photo-return-banner warn">
                <mat-icon>warning</mat-icon>
                <div class="prb-body">
                  <div class="prb-title">该检查单因装载照片缺失已被退回，待货主补传照片</div>
                  @if (record()!.photoReturnRemark) {
                    <div class="prb-reason">退回原因：{{ record()!.photoReturnRemark }}</div>
                  }
                  <div class="prb-meta">
                    退回人：{{ record()!.photoReturnedBy?.name || '-' }}
                    · 退回时间：{{ record()!.photoReturnedAt | date:'yyyy-MM-dd HH:mm' }}
                  </div>
                </div>
              </div>
            } @else if (record()!.photoResubmittedAt) {
              <div class="photo-return-banner done">
                <mat-icon>check_circle</mat-icon>
                <div class="prb-body">
                  <div class="prb-title">货主已于 {{ record()!.photoResubmittedAt | date:'yyyy-MM-dd HH:mm' }} 补传照片，待货运员重新核验</div>
                  @if (record()!.photoReturnRemark) {
                    <div class="prb-reason">原退回原因：{{ record()!.photoReturnRemark }}</div>
                  }
                </div>
              </div>
            }

            @if (record()!.photos.length > 0) {
              <div class="photo-grid">
                @for (p of record()!.photos; track p.id) {
                  <img [src]="'/uploads/' + p.filePath.split('/').pop()" class="photo">
                }
              </div>
            } @else {
              <div class="empty">暂无照片</div>
            }

            @if (isOwner() && record()!.status === 'photo_pending') {
              <div class="resubmit-area">
                <div class="resubmit-title"><mat-icon>add_a_photo</mat-icon>补传装载照片</div>
                <input type="file" #resubmitInput multiple accept="image/*" (change)="onResubmitFile($event)" hidden>
                <div class="resubmit-actions">
                  <button mat-raised-button color="primary" (click)="resubmitInput.click()" [disabled]="uploading()">
                    <mat-icon>cloud_upload</mat-icon>{{ uploading() ? '上传中...' : '选择补传照片' }}
                  </button>
                </div>
                @if (newPhotos().length > 0) {
                  <div class="photo-grid">
                    @for (p of newPhotos(); track p.fileId) {
                      <div class="photo-item">
                        <img [src]="p.url" [alt]="p.fileName">
                        <button mat-icon-button class="remove-btn" (click)="removeNewPhoto(p.fileId)">
                          <mat-icon>close</mat-icon>
                        </button>
                        <small class="photo-name">{{ p.fileName }}</small>
                      </div>
                    }
                  </div>
                  <div class="resubmit-actions">
                    <button mat-raised-button color="accent" (click)="submitResubmit()" [disabled]="resubmitting()">
                      <mat-icon>send</mat-icon>{{ resubmitting() ? '提交中...' : '提交补传照片' }}
                    </button>
                  </div>
                }
              </div>
            }
          </mat-card>

          @if (record()!.inspectionItemResults?.length > 0) {
            <mat-card class="card">
              <h3 class="card-title">
                <mat-icon>assignment_turned_in</mat-icon>检查项结果
              </h3>
              <div class="check-list">
                @for (it of record()!.inspectionItemResults; track it.id) {
                  <div class="check-row">
                    <mat-icon [class]="it.passed ? 'ok' : 'err'">
                      {{ it.passed ? 'check_circle' : 'cancel' }}
                    </mat-icon>
                    <div class="check-main">
                      <strong>{{ it.inspectionItem.name }}</strong>
                      <small>{{ it.inspectionItem.category }} · {{ it.inspectionItem.description }}</small>
                      @if (it.remark) { <div class="check-remark">备注：{{ it.remark }}</div> }
                    </div>
                  </div>
                }
              </div>
              @if (record()!.inspectionRemark) {
                <div class="remark-block"><strong>货运员备注：</strong>{{ record()!.inspectionRemark }}</div>
              }
            </mat-card>
          }

          @if (record()!.supervisorRemark || record()!.supervisorApproved !== null) {
            <mat-card class="card">
              <h3 class="card-title"><mat-icon>how_to_reg</mat-icon>监管员审批</h3>
              <div class="info-grid">
                <div><label>审批人</label><span>{{ record()!.supervisor?.name || '-' }}</span></div>
                <div>
                  <label>审批结果</label>
                  <span>
                    {{ record()!.supervisorApproved === null ? '-' : (record()!.supervisorApproved ? '通过' : '驳回') }}
                  </span>
                </div>
              </div>
              @if (record()!.supervisorRemark) {
                <div class="remark-block"><strong>审批意见：</strong>{{ record()!.supervisorRemark }}</div>
              }
            </mat-card>
          }
        </div>

        <div class="side-col">
          <mat-card class="card">
            <h3 class="card-title"><mat-icon>timeline</mat-icon>流程进度</h3>
            <div class="timeline">
              @for (s of timeline(); track s.key) {
                <div class="tl-item" [class.current]="s.current" [class.done]="s.done">
                  <div class="tl-dot">
                    <mat-icon>{{ s.done ? 'check' : 'radio_button_unchecked' }}</mat-icon>
                  </div>
                  <div class="tl-content">
                    <div class="tl-title">{{ s.title }}</div>
                    <div class="tl-time">{{ s.time || '-' }}</div>
                    @if (s.desc) { <div class="tl-desc">{{ s.desc }}</div> }
                  </div>
                </div>
              }
              @if (record()!.status === 'rejected') {
                <div class="tl-item rejected">
                  <div class="tl-dot"><mat-icon>close</mat-icon></div>
                  <div class="tl-content">
                    <div class="tl-title">已驳回</div>
                    <div class="tl-time">{{ record()!.inspectedAt || '-' }}</div>
                  </div>
                </div>
              }
            </div>
          </mat-card>

          <mat-card class="card">
            <h3 class="card-title"><mat-icon>people</mat-icon>参与人员</h3>
            <div class="people-list">
              <div class="p-row"><mat-icon>person</mat-icon><div><label>货主</label><span>{{ record()!.owner?.name }}</span></div></div>
              @if (record()!.freightInspector) {
                <div class="p-row"><mat-icon>assignment_turned_in</mat-icon><div><label>货运员</label><span>{{ record()!.freightInspector.name }}</span></div></div>
              }
              @if (record()!.photoReturnedBy) {
                <div class="p-row"><mat-icon>photo_camera</mat-icon><div><label>照片退回人</label><span>{{ record()!.photoReturnedBy.name }}</span></div></div>
              }
              @if (record()!.supervisor) {
                <div class="p-row"><mat-icon>how_to_reg</mat-icon><div><label>监管员</label><span>{{ record()!.supervisor.name }}</span></div></div>
              }
            </div>
          </mat-card>

          <mat-card class="card">
            <h3 class="card-title"><mat-icon>schedule</mat-icon>关键时间</h3>
            <div class="time-list">
              <div class="t-row"><label>创建</label><span>{{ record()!.createdAt }}</span></div>
              @if (record()!.submittedAt) { <div class="t-row"><label>提交</label><span>{{ record()!.submittedAt }}</span></div> }
              @if (record()!.photoReturnedAt) { <div class="t-row"><label>照片退回</label><span>{{ record()!.photoReturnedAt }}</span></div> }
              @if (record()!.photoResubmittedAt) { <div class="t-row"><label>照片补传</label><span>{{ record()!.photoResubmittedAt }}</span></div> }
              @if (record()!.inspectedAt) { <div class="t-row"><label>检查</label><span>{{ record()!.inspectedAt }}</span></div> }
              @if (record()!.approvedAt) { <div class="t-row"><label>审批</label><span>{{ record()!.approvedAt }}</span></div> }
              @if (record()!.shippedAt) { <div class="t-row"><label>发运</label><span>{{ record()!.shippedAt }}</span></div> }
            </div>
          </mat-card>
        </div>
      </div>
    } @else {
      <div class="empty">加载中...</div>
    }
  `,
  styles: [`
    .top-bar { display: flex; align-items: center; gap: 16px; margin-bottom: 20px; }
    .title { flex: 1; font-size: 22px; color: #1a365d; margin: 0; font-weight: 600; }
    .detail-grid { display: grid; grid-template-columns: 2fr 1fr; gap: 16px; }
    .card { margin-bottom: 16px; }
    .card-title {
      display: flex; align-items: center; gap: 8px;
      font-size: 16px; color: #1a365d; margin: 0 0 16px 0; font-weight: 600;
    }
    .info-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px 24px; }
    .info-grid > div { display: flex; flex-direction: column; }
    .info-grid label { font-size: 12px; color: #718096; margin-bottom: 4px; }
    .info-grid span { color: #2d3748; font-weight: 500; }
    .pg { padding: 2px 8px; border-radius: 4px; display: inline-flex; align-items: center; gap: 4px; }
    .pg-I { background: #fed7d7; color: #c53030; }
    .pg-II { background: #feebc8; color: #c05621; }
    .pg-III { background: #bee3f8; color: #2b6cb0; }
    .ok { color: #38a169; } .err { color: #e53e3e; }
    .small { font-size: 18px; }
    .photo-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); gap: 10px; }
    .photo { width: 100%; height: 120px; object-fit: cover; border-radius: 6px; border: 1px solid #e2e8f0; }
    .empty { padding: 30px; text-align: center; color: #a0aec0; }
    .photo-return-banner {
      display: flex; gap: 12px; align-items: flex-start;
      padding: 14px 16px; border-radius: 8px; margin-bottom: 14px;
      border: 1px solid;
    }
    .photo-return-banner.warn { background: #fff5f5; border-color: #feb2b2; }
    .photo-return-banner.warn .mat-icon { color: #e53e3e; }
    .photo-return-banner.done { background: #f0fff4; border-color: #9ae6b4; }
    .photo-return-banner.done .mat-icon { color: #38a169; }
    .photo-return-banner .mat-icon { font-size: 22px; width: 22px; height: 22px; flex-shrink: 0; margin-top: 2px; }
    .prb-title { font-weight: 600; color: #2d3748; font-size: 14px; }
    .prb-reason { margin-top: 6px; font-size: 13px; color: #c53030; }
    .prb-meta { margin-top: 6px; font-size: 12px; color: #718096; }
    .resubmit-area {
      margin-top: 16px; padding: 16px; background: #ebf8ff;
      border: 1px dashed #90cdf4; border-radius: 8px;
    }
    .resubmit-title { display: flex; align-items: center; gap: 6px; font-weight: 600; color: #2b6cb0; margin-bottom: 12px; }
    .resubmit-title .mat-icon { font-size: 20px; }
    .resubmit-actions { display: flex; gap: 12px; margin: 12px 0; }
    .photo-item { position: relative; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; }
    .photo-item img { width: 100%; height: 120px; object-fit: cover; display: block; }
    .remove-btn { position: absolute; top: 4px; right: 4px; background: rgba(0,0,0,0.5); color: #fff; }
    .photo-name { display: block; padding: 4px 8px; font-size: 12px; color: #4a5568; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .check-list { display: flex; flex-direction: column; gap: 10px; }
    .check-row { display: flex; gap: 12px; align-items: flex-start; padding: 10px; background: #f7fafc; border-radius: 6px; }
    .check-row .mat-icon { font-size: 20px; width: 20px; height: 20px; flex-shrink: 0; }
    .check-main { flex: 1; }
    .check-main strong { display: block; color: #2d3748; }
    .check-main small { color: #718096; font-size: 12px; }
    .check-remark { margin-top: 6px; padding: 6px 10px; background: #fff; border-radius: 4px; font-size: 13px; color: #4a5568; }
    .remark-block {
      margin-top: 12px; padding: 12px; background: #fefcbf;
      border-radius: 6px; color: #744210; font-size: 13px;
    }
    .timeline { padding-left: 4px; }
    .tl-item { display: flex; gap: 12px; padding-bottom: 20px; position: relative; }
    .tl-item:not(:last-child)::before {
      content: ''; position: absolute; left: 14px; top: 28px; bottom: 0; width: 2px; background: #e2e8f0;
    }
    .tl-dot {
      width: 28px; height: 28px; border-radius: 50%;
      background: #e2e8f0; color: #a0aec0;
      display: flex; align-items: center; justify-content: center;
      flex-shrink: 0; z-index: 1;
    }
    .tl-dot .mat-icon { font-size: 16px; width: 16px; height: 16px; }
    .tl-item.done .tl-dot { background: #38a169; color: #fff; }
    .tl-item.current .tl-dot { background: #dd6b20; color: #fff; }
    .tl-item.rejected .tl-dot { background: #e53e3e; color: #fff; }
    .tl-title { font-weight: 600; color: #2d3748; }
    .tl-time { font-size: 12px; color: #718096; margin-top: 2px; }
    .tl-desc { font-size: 12px; color: #c05621; margin-top: 4px; }
    .people-list, .time-list { display: flex; flex-direction: column; gap: 12px; }
    .p-row { display: flex; gap: 12px; align-items: center; }
    .p-row .mat-icon { color: #1a365d; }
    .p-row label { display: block; font-size: 12px; color: #718096; }
    .p-row span { font-weight: 500; color: #2d3748; }
    .t-row { display: flex; justify-content: space-between; }
    .t-row label { color: #718096; }
    .t-row span { color: #2d3748; font-size: 13px; }
    @media (max-width: 900px) {
      .detail-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class ShipmentDetailComponent implements OnInit {
  private api = inject(ApiService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(AuthService);
  private snack = inject(MatSnackBar);

  record = signal<ShipmentRecord | null>(null);
  timeline = signal<TimelineStep[]>([]);
  isOwner = signal(false);
  newPhotos = signal<NewPhoto[]>([]);
  uploading = signal(false);
  resubmitting = signal(false);

  async ngOnInit() {
    const id = this.route.snapshot.params['id'];
    this.isOwner.set(this.auth.user()?.role === 'owner');
    const r = await this.api.getShipment(id);
    this.record.set(r);
    this.buildTimeline(r);
  }

  private buildTimeline(r: ShipmentRecord) {
    const isPhotoPending = r.status === 'photo_pending';
    let currentIdx = STEP_ORDER.indexOf(r.status);
    if (currentIdx === -1) currentIdx = STEP_ORDER.indexOf('submitted');
    const steps: TimelineStep[] = STEP_ORDER
      .filter(s => s !== 'rejected')
      .map((key, idx) => {
        let time: string | null = null;
        if (key === 'draft') time = r.createdAt;
        else if (key === 'submitted') time = r.submittedAt;
        else if (key === 'inspecting') time = r.inspectedAt ? r.inspectedAt : r.submittedAt;
        else if (key === 'pending_approval') time = r.submittedAt;
        else if (key === 'approved') time = r.approvedAt || r.inspectedAt;
        else if (key === 'shipped') time = r.shippedAt;
        const done = isPhotoPending
          ? (key === 'draft'
            || (key === 'submitted' && !!r.submittedAt)
            || (key === 'inspecting' && !!r.inspectedAt)
            || (key === 'pending_approval' && !!r.inspectedAt))
          : (currentIdx >= idx && r.status !== 'rejected' ? true : (currentIdx > idx));
        const current = isPhotoPending ? false : (idx === currentIdx && r.status !== 'rejected');
        const desc = isPhotoPending && key === 'submitted' ? '检查单已退回货主补传照片' : undefined;
        return { key, title: STEP_TITLES[key], time, done, current, desc };
      });
    this.timeline.set(steps);
  }

  async onResubmitFile(e: Event) {
    const input = e.target as HTMLInputElement;
    const files = Array.from(input.files || []).filter(f => f.type.startsWith('image/'));
    input.value = '';
    if (files.length === 0) return;
    this.uploading.set(true);
    try {
      for (const f of files) {
        const res = await this.api.uploadPhoto(f);
        this.newPhotos.update(ps => [...ps, {
          fileId: res.fileId, fileName: res.fileName, url: res.url,
          filePath: res.url, fileSize: res.size, mimeType: f.type,
        }]);
      }
    } catch {
      this.snack.open('部分照片上传失败', '关闭', { duration: 2500 });
    } finally {
      this.uploading.set(false);
    }
  }

  removeNewPhoto(fileId: string) {
    this.newPhotos.update(ps => ps.filter(p => p.fileId !== fileId));
  }

  async submitResubmit() {
    if (!this.record() || this.newPhotos().length === 0) return;
    this.resubmitting.set(true);
    try {
      const r = await this.api.resubmitPhotos(this.record()!.id, this.newPhotos().map(p => ({
        fileName: p.fileName, filePath: p.filePath, fileSize: p.fileSize, mimeType: p.mimeType,
      })));
      this.record.set(r);
      this.buildTimeline(r);
      this.newPhotos.set([]);
      this.snack.open('照片已补传，等待货运员重新核验', '关闭', { duration: 3000 });
    } catch (e: any) {
      this.snack.open(e?.error?.message || '补传失败，请重试', '关闭', { duration: 3000 });
    } finally {
      this.resubmitting.set(false);
    }
  }

  back() {
    const home = this.auth.getHomeRoute();
    this.router.navigate([home]);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface DangerousGood {
  id: string;
  unCode: string;
  name: string;
  chineseName: string;
  hazardClass: string;
  requiredPackingGroup: 'I' | 'II' | 'III';
  isForbidden: boolean;
  isRestricted: boolean;
  remarks: string;
}

export interface Vehicle {
  id: string;
  plateNumber: string;
  vehicleType: string;
  cleaned: boolean;
  lastCleanedAt: string | null;
  inService: boolean;
}

export interface InspectionItem {
  id: string;
  category: string;
  name: string;
  description: string;
  required: boolean;
  sortOrder: number;
}

export interface ShipmentPhoto {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  url?: string;
  uploadedAt: string;
}

export interface ShipmentInspectionItemResult {
  id: string;
  inspectionItem: InspectionItem;
  passed: boolean;
  remark: string | null;
}

export type ShipmentStatus =
  | 'draft' | 'submitted' | 'inspecting' | 'photo_pending'
  | 'pending_approval' | 'approved' | 'rejected' | 'shipped';

export type PhotoStatus = 'complete' | 'pending_resubmit';

export interface ShipmentRecord {
  id: string;
  shipmentNo: string;
  ownerId: string;
  dangerousGood: DangerousGood;
  packingGroup: string;
  packingMethod: string;
  vehicle: Vehicle;
  grossWeight: number;
  quantity: number;
  status: ShipmentStatus;
  packingMatched: boolean | null;
  vehicleCleanConfirmed: boolean | null;
  photosVerified: boolean | null;
  photoStatus: PhotoStatus | null;
  photoReturnRemark: string | null;
  photoReturnedAt: string | null;
  photoResubmittedAt: string | null;
  photoReturnedBy?: { name: string } | null;
  inspectionResult: 'pass' | 'fail' | null;
  inspectionRemark: string | null;
  supervisorApproved: boolean | null;
  supervisorRemark: string | null;
  owner?: { name: string };
  freightInspector?: { name: string } | null;
  supervisor?: { name: string } | null;
  photos: ShipmentPhoto[];
  inspectionItemResults: ShipmentInspectionItemResult[];
  createdAt: string;
  submittedAt: string | null;
  inspectedAt: string | null;
  approvedAt: string | null;
  shippedAt: string | null;
}

export interface Statistics {
  total: number;
  thisMonth: number;
  byStatus: { status: ShipmentStatus; count: number }[];
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(private http: HttpClient) {}

  // Dangerous Goods
  searchDangerousGoods(keyword?: string) {
    const params = keyword ? { keyword } : {};
    return firstValueFrom(this.http.get<DangerousGood[]>('/api/dangerous-goods', { params }));
  }

  // Vehicles
  getVehicles(status?: 'cleaned' | 'available') {
    const params = status ? { status } : {};
    return firstValueFrom(this.http.get<Vehicle[]>('/api/vehicles', { params }));
  }

  confirmVehicleClean(id: string) {
    return firstValueFrom(this.http.post(`/api/vehicles/${id}/confirm-clean`, {}));
  }

  // Inspection Items
  getInspectionItems() {
    return firstValueFrom(this.http.get<InspectionItem[]>('/api/inspection-items'));
  }

  // Upload
  async uploadPhoto(file: File): Promise<{ fileId: string; fileName: string; url: string; size: number }> {
    const form = new FormData();
    form.append('file', file);
    return firstValueFrom(
      this.http.post<{ fileId: string; fileName: string; url: string; size: number }>(
        '/api/upload/photo', form,
      ),
    );
  }

  // Shipments
  createShipment(data: {
    dangerousGoodId: string;
    packingGroup: 'I' | 'II' | 'III';
    packingMethod: string;
    vehicleId: string;
    grossWeight: number;
    quantity: number;
    photoFileNames: { fileName: string; filePath: string; fileSize: number; mimeType: string }[];
  }) {
    return firstValueFrom(this.http.post<ShipmentRecord>('/api/shipments', data));
  }

  getShipments(params?: { status?: ShipmentStatus; keyword?: string }) {
    return firstValueFrom(this.http.get<ShipmentRecord[]>('/api/shipments', { params: params || {} }));
  }

  getShipment(id: string) {
    return firstValueFrom(this.http.get<ShipmentRecord>(`/api/shipments/${id}`));
  }

  submitShipment(id: string) {
    return firstValueFrom(this.http.post<ShipmentRecord>(`/api/shipments/${id}/submit`, {}));
  }

  inspectShipment(id: string, data: {
    inspectionItems: { itemId: string; passed: boolean; remark?: string }[];
    vehicleCleanConfirmed: boolean;
    photosVerified: boolean;
    overallResult: 'pass' | 'fail';
    remark?: string;
  }) {
    return firstValueFrom(this.http.post<ShipmentRecord>(`/api/shipments/${id}/inspect`, data));
  }

  returnForPhoto(id: string, remark: string) {
    return firstValueFrom(this.http.post<ShipmentRecord>(`/api/shipments/${id}/return-photos`, { remark }));
  }

  resubmitPhotos(id: string, photoFileNames: { fileName: string; filePath: string; fileSize: number; mimeType: string }[]) {
    return firstValueFrom(this.http.post<ShipmentRecord>(`/api/shipments/${id}/resubmit-photos`, { photoFileNames }));
  }

  approveShipment(id: string, data: { approved: boolean; remark?: string }) {
    return firstValueFrom(this.http.post<ShipmentRecord>(`/api/shipments/${id}/approve`, data));
  }

  shipShipment(id: string) {
    return firstValueFrom(this.http.post<ShipmentRecord>(`/api/shipments/${id}/ship`, {}));
  }

  getStatistics() {
    return firstValueFrom(this.http.get<Statistics>('/api/shipments/statistics'));
  }
}

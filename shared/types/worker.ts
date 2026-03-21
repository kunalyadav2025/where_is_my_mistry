export interface Worker {
  workerId: string;
  name: string;
  mobile: string;
  profilePhotoUrl?: string;
  bio?: string;
  categoryId: string;
  categoryName: string;
  townId: string;
  townName: string;
  tehsilName: string;
  districtName: string;
  stateName: string;
  experienceYears: number;
  isAvailable: boolean;
  isApproved: boolean;
  isRejected: boolean;
  rejectionReason?: string;
  aadhaarHash: string;
  aadhaarLast4: string;
  viewCount: number;
  avgRating: number;
  reviewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface WorkerPhoto {
  photoId: string;
  workerId: string;
  url: string;
  caption?: string;
  order: number;
  createdAt: string;
}

export interface WorkerCreateInput {
  name: string;
  mobile: string;
  categoryId: string;
  townId: string;
  experienceYears: number;
  bio?: string;
  aadhaarNumber: string;
}

export interface WorkerUpdateInput {
  name?: string;
  categoryId?: string;
  townId?: string;
  experienceYears?: number;
  bio?: string;
  isAvailable?: boolean;
}

export interface WorkerSearchFilters {
  categoryId?: string;
  townId?: string;
  tehsilId?: string;
  districtId?: string;
  stateId?: string;
  isAvailable?: boolean;
  minRating?: number;
  query?: string;
}

export interface WorkerListItem {
  workerId: string;
  name: string;
  profilePhotoUrl?: string;
  categoryId: string;
  categoryName: string;
  townName: string;
  districtName: string;
  experienceYears: number;
  avgRating: number;
  reviewCount: number;
  isAvailable: boolean;
}

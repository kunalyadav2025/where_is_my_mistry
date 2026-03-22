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
  /**
   * Full 12-digit Aadhaar number for verification only.
   *
   * SECURITY REQUIREMENTS:
   * - This field is accepted ONLY during registration
   * - MUST be hashed immediately using bcrypt before any storage
   * - The full number is NEVER stored in the database
   * - Only `aadhaarHash` (bcrypt hash) and `aadhaarLast4` (last 4 digits) are persisted
   * - The full number should be cleared from memory after hashing
   *
   * Format: 12 digits (spaces allowed, will be stripped)
   * Example: "1234 5678 9012" or "123456789012"
   */
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

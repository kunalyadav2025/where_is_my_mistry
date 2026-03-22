/**
 * Worker Service
 * Handles worker registration, profile management, and search
 */

import { v4 as uuidv4 } from 'uuid';
import bcrypt from 'bcryptjs';
import { dynamodb, Tables, getItem, updateItem, queryItems, incrementCounter, DuplicateEntryError, createWorkerWithMobileUniqueness } from './dynamodb';
import { QueryCommand } from '@aws-sdk/lib-dynamodb';
import { logger, maskMobile, maskAadhaar } from '../utils/logger';

export interface WorkerRecord {
  pk: string;
  sk: string;
  workerId: string;
  name: string;
  mobile: string;
  profilePhotoUrl?: string;
  bio?: string;
  categoryId: string;
  categoryName: string;
  townId: string;
  townName: string;
  tehsilId: string;
  tehsilName: string;
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  pinCode: string;
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
  totalRatingSum: number;
  // GSI keys
  townCategory: string; // Composite key for TownCategoryIndex: {townId}#{categoryId}
  sortKey: string; // For sorting: padded avgRating or createdAt
  createdAt: string;
  updatedAt: string;
}

export interface CreateWorkerInput {
  name: string;
  mobile: string;
  categoryId: string;
  categoryName: string;
  townId: string;
  townName: string;
  tehsilId: string;
  tehsilName: string;
  districtId: string;
  districtName: string;
  stateId: string;
  stateName: string;
  pinCode: string;
  experienceYears: number;
  bio?: string;
  /** Full Aadhaar for verification only - MUST be hashed immediately, never stored */
  aadhaarNumber: string;
}

export interface UpdateWorkerInput {
  name?: string;
  categoryId?: string;
  categoryName?: string;
  townId?: string;
  townName?: string;
  tehsilId?: string;
  tehsilName?: string;
  districtId?: string;
  districtName?: string;
  stateId?: string;
  stateName?: string;
  experienceYears?: number;
  bio?: string;
  isAvailable?: boolean;
  profilePhotoUrl?: string;
}

export interface WorkerSearchParams {
  townId?: string;
  categoryId?: string;
  isAvailable?: boolean;
  limit?: number;
  cursor?: string;
}

/**
 * Hash Aadhaar number for secure storage
 * Returns both hash and last 4 digits for display
 */
function hashAadhaar(aadhaarNumber: string): { hash: string; last4: string } {
  // Remove spaces and validate
  const cleaned = aadhaarNumber.replace(/\s/g, '');
  if (!/^\d{12}$/.test(cleaned)) {
    throw new Error('Invalid Aadhaar number format');
  }

  const hash = bcrypt.hashSync(cleaned, 10);
  const last4 = cleaned.slice(-4);

  return { hash, last4 };
}

/**
 * Generate composite GSI keys for worker
 */
function generateGsiKeys(townId: string, categoryId: string, avgRating: number): { townCategory: string; sortKey: string } {
  // Composite key for filtering by town and category
  const townCategory = `${townId}#${categoryId}`;

  // Sort key - pad rating to 5 digits for proper string sorting (e.g., "04500" for 4.5)
  // This allows sorting by rating in descending order
  const ratingPadded = Math.floor(avgRating * 1000).toString().padStart(5, '0');
  const sortKey = ratingPadded;

  return { townCategory, sortKey };
}

/**
 * Check if a mobile number is already registered
 */
export async function isMobileRegistered(mobile: string): Promise<boolean> {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: Tables.WORKERS,
      IndexName: 'MobileIndex',
      KeyConditionExpression: 'mobile = :mobile',
      ExpressionAttributeValues: {
        ':mobile': mobile,
      },
      Limit: 1,
    })
  );

  return (result.Items?.length || 0) > 0;
}

/**
 * Create a new worker profile
 * Uses atomic transaction to prevent race conditions on mobile uniqueness
 */
export async function createWorker(input: CreateWorkerInput): Promise<WorkerRecord> {
  // Hash Aadhaar immediately - never store the full number
  const { hash: aadhaarHash, last4: aadhaarLast4 } = hashAadhaar(input.aadhaarNumber);

  logger.info('Creating worker profile', {
    mobile: maskMobile(input.mobile),
    category: input.categoryId,
    town: input.townId,
  });

  const workerId = uuidv4();
  const now = new Date().toISOString();
  const gsiKeys = generateGsiKeys(input.townId, input.categoryId, 0);

  const worker: WorkerRecord = {
    pk: `WORKER#${workerId}`,
    sk: 'PROFILE',
    workerId,
    name: input.name,
    mobile: input.mobile,
    bio: input.bio,
    categoryId: input.categoryId,
    categoryName: input.categoryName,
    townId: input.townId,
    townName: input.townName,
    tehsilId: input.tehsilId,
    tehsilName: input.tehsilName,
    districtId: input.districtId,
    districtName: input.districtName,
    stateId: input.stateId,
    stateName: input.stateName,
    pinCode: input.pinCode,
    experienceYears: input.experienceYears,
    isAvailable: true,
    isApproved: false, // Requires admin approval
    isRejected: false,
    aadhaarHash,
    aadhaarLast4,
    viewCount: 0,
    avgRating: 0,
    reviewCount: 0,
    totalRatingSum: 0,
    townCategory: gsiKeys.townCategory,
    sortKey: gsiKeys.sortKey,
    createdAt: now,
    updatedAt: now,
  };

  // Use atomic transaction to create worker and mobile reservation together
  // This prevents race conditions where two requests for same mobile could both succeed
  await createWorkerWithMobileUniqueness(
    Tables.WORKERS,
    worker as unknown as Record<string, unknown>,
    input.mobile
  );

  logger.info('Worker profile created', { workerId, mobile: maskMobile(input.mobile) });

  return worker;
}

/**
 * Get worker by ID
 */
export async function getWorkerById(workerId: string): Promise<WorkerRecord | null> {
  return getItem<WorkerRecord>(Tables.WORKERS, `WORKER#${workerId}`, 'PROFILE');
}

/**
 * Get worker by mobile number
 */
export async function getWorkerByMobile(mobile: string): Promise<WorkerRecord | null> {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: Tables.WORKERS,
      IndexName: 'MobileIndex',
      KeyConditionExpression: 'mobile = :mobile',
      ExpressionAttributeValues: {
        ':mobile': mobile,
      },
      Limit: 1,
    })
  );

  return (result.Items?.[0] as WorkerRecord) || null;
}

/**
 * Update worker profile
 */
export async function updateWorkerProfile(workerId: string, updates: UpdateWorkerInput): Promise<WorkerRecord | null> {
  const worker = await getWorkerById(workerId);
  if (!worker) {
    return null;
  }

  // If location or category changed, update GSI keys
  const updatedFields: Record<string, unknown> = { ...updates, updatedAt: new Date().toISOString() };

  if (updates.townId || updates.categoryId) {
    const newTownId = updates.townId || worker.townId;
    const newCategoryId = updates.categoryId || worker.categoryId;
    const gsiKeys = generateGsiKeys(newTownId, newCategoryId, worker.avgRating);
    updatedFields.townCategory = gsiKeys.townCategory;
    updatedFields.sortKey = gsiKeys.sortKey;
  }

  await updateItem(Tables.WORKERS, `WORKER#${workerId}`, 'PROFILE', updatedFields);

  logger.info('Worker profile updated', { workerId });

  return { ...worker, ...updatedFields } as WorkerRecord;
}

/**
 * Increment worker view count atomically
 */
export async function incrementViewCount(workerId: string): Promise<number> {
  return incrementCounter(Tables.WORKERS, `WORKER#${workerId}`, 'PROFILE', 'viewCount');
}

/**
 * Search workers by town and category
 */
export async function searchWorkers(params: WorkerSearchParams): Promise<{
  workers: WorkerRecord[];
  nextCursor?: string;
}> {
  const { townId, categoryId, isAvailable, limit = 20, cursor } = params;

  let exclusiveStartKey: Record<string, unknown> | undefined;
  if (cursor) {
    try {
      exclusiveStartKey = JSON.parse(Buffer.from(cursor, 'base64').toString());
    } catch {
      logger.warn('Invalid cursor provided');
    }
  }

  // If both townId and categoryId provided, use TownCategoryIndex
  if (townId && categoryId) {
    const townCategory = `${townId}#${categoryId}`;

    const result = await queryItems<WorkerRecord>(
      Tables.WORKERS,
      'townCategory = :tc',
      { ':tc': townCategory },
      {
        indexName: 'TownCategoryIndex',
        limit,
        scanIndexForward: false, // Highest rating first
        exclusiveStartKey,
      }
    );

    // Apply filter manually - only show approved workers
    // Note: DynamoDB filter expressions run post-query and don't reduce read capacity,
    // so manual filtering achieves the same result with simpler code
    let workers = result.items;
    if (isAvailable !== undefined) {
      workers = workers.filter((w) => w.isAvailable === isAvailable && w.isApproved === true);
    } else {
      workers = workers.filter((w) => w.isApproved === true);
    }

    const nextCursor = result.lastKey
      ? Buffer.from(JSON.stringify(result.lastKey)).toString('base64')
      : undefined;

    return { workers, nextCursor };
  }

  // Fallback to scan (not ideal for large datasets)
  logger.warn('Worker search without townCategory index', { townId, categoryId });

  return { workers: [] };
}

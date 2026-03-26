import { Router, Request, Response, NextFunction } from 'express';
import { successResponse, errorResponse } from '../utils/response';
import {
  createWorker,
  getWorkerById,
  getWorkerByMobile,
  updateWorkerProfile,
  searchWorkers,
  incrementViewCount,
  CreateWorkerInput,
  UpdateWorkerInput,
  WorkerRecord,
} from '../services/worker';
import { DuplicateEntryError } from '../services/dynamodb';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Validate worker creation input
 */
function validateCreateWorkerInput(body: unknown): { valid: boolean; error?: string; data?: CreateWorkerInput } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request body is required' };
  }

  const input = body as Record<string, unknown>;

  // Required string fields
  const requiredFields = [
    'name',
    'mobile',
    'categoryId',
    'categoryName',
    'townId',
    'townName',
    'tehsilId',
    'tehsilName',
    'districtId',
    'districtName',
    'stateId',
    'stateName',
    'pinCode',
  ];

  for (const field of requiredFields) {
    if (!input[field] || typeof input[field] !== 'string' || (input[field] as string).trim() === '') {
      return { valid: false, error: `${field} is required and must be a non-empty string` };
    }
  }

  // Validate mobile number (10 digits, starts with 6-9)
  const mobile = (input.mobile as string).trim();
  if (!/^[6-9]\d{9}$/.test(mobile)) {
    return { valid: false, error: 'Mobile number must be 10 digits starting with 6-9' };
  }

  // Validate Aadhaar if provided (12 digits, spaces allowed)
  let aadhaar: string | undefined;
  if (input.aadhaarNumber && typeof input.aadhaarNumber === 'string' && input.aadhaarNumber.trim() !== '') {
    aadhaar = (input.aadhaarNumber as string).replace(/\s/g, '');
    if (!/^\d{12}$/.test(aadhaar)) {
      return { valid: false, error: 'Aadhaar number must be 12 digits' };
    }
  }

  // Validate experience years
  if (typeof input.experienceYears !== 'number' || input.experienceYears < 0 || input.experienceYears > 50) {
    return { valid: false, error: 'experienceYears must be a number between 0 and 50' };
  }

  // Optional bio validation
  if (input.bio !== undefined && typeof input.bio !== 'string') {
    return { valid: false, error: 'bio must be a string' };
  }

  // Validate pinCode (6 digits)
  const pinCode = (input.pinCode as string).trim();
  if (!/^\d{6}$/.test(pinCode)) {
    return { valid: false, error: 'pinCode must be 6 digits' };
  }

  return {
    valid: true,
    data: {
      name: (input.name as string).trim(),
      mobile,
      categoryId: (input.categoryId as string).trim(),
      categoryName: (input.categoryName as string).trim(),
      townId: (input.townId as string).trim(),
      townName: (input.townName as string).trim(),
      tehsilId: (input.tehsilId as string).trim(),
      tehsilName: (input.tehsilName as string).trim(),
      districtId: (input.districtId as string).trim(),
      districtName: (input.districtName as string).trim(),
      stateId: (input.stateId as string).trim(),
      stateName: (input.stateName as string).trim(),
      pinCode,
      experienceYears: input.experienceYears as number,
      aadhaarNumber: aadhaar,
      bio: input.bio ? (input.bio as string).trim() : undefined,
    } as CreateWorkerInput,
  };
}

/**
 * Convert WorkerRecord to API response format (exclude internal fields)
 */
function toWorkerResponse(worker: WorkerRecord) {
  return {
    workerId: worker.workerId,
    name: worker.name,
    mobile: worker.mobile,
    profilePhotoUrl: worker.profilePhotoUrl,
    bio: worker.bio,
    categoryId: worker.categoryId,
    categoryName: worker.categoryName,
    townId: worker.townId,
    townName: worker.townName,
    tehsilName: worker.tehsilName,
    districtName: worker.districtName,
    stateName: worker.stateName,
    pinCode: worker.pinCode,
    experienceYears: worker.experienceYears,
    isAvailable: worker.isAvailable,
    isApproved: worker.isApproved,
    isRejected: worker.isRejected,
    rejectionReason: worker.rejectionReason,
    aadhaarLast4: worker.aadhaarLast4,
    viewCount: worker.viewCount,
    avgRating: worker.avgRating,
    reviewCount: worker.reviewCount,
    createdAt: worker.createdAt,
    updatedAt: worker.updatedAt,
  };
}

// GET /api/workers - List/search workers
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { townId, categoryId, isAvailable, limit, cursor } = req.query;

    // Parse query parameters
    const searchParams = {
      townId: townId as string | undefined,
      categoryId: categoryId as string | undefined,
      isAvailable: isAvailable === 'true' ? true : isAvailable === 'false' ? false : undefined,
      limit: limit ? Math.min(parseInt(limit as string, 10), 50) : 20,
      cursor: cursor as string | undefined,
    };

    // Require at least townId and categoryId for efficient search
    if (!searchParams.townId || !searchParams.categoryId) {
      return errorResponse(
        res,
        'VALIDATION_ERROR',
        'Both townId and categoryId are required for search',
        400
      );
    }

    const result = await searchWorkers(searchParams);

    return successResponse(res, {
      workers: result.workers.map(toWorkerResponse),
      nextCursor: result.nextCursor,
    });
  } catch (error) {
    logger.error('Error listing workers', error as Error);
    next(error);
  }
});

// GET /api/workers/mobile/:mobile - Get worker by mobile number
// IMPORTANT: This route MUST be defined BEFORE /:workerId to avoid "mobile" being captured as workerId
router.get('/mobile/:mobile', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { mobile } = req.params;

    if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
      return errorResponse(res, 'VALIDATION_ERROR', 'Valid 10-digit mobile number is required', 400);
    }

    const worker = await getWorkerByMobile(mobile);

    if (!worker) {
      return errorResponse(res, 'NOT_FOUND', 'Worker not found', 404);
    }

    return successResponse(res, {
      worker: toWorkerResponse(worker),
    });
  } catch (error) {
    logger.error('Error getting worker by mobile', error as Error);
    next(error);
  }
});

// GET /api/workers/:workerId - Get worker by ID
router.get('/:workerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workerId } = req.params;

    if (!workerId) {
      return errorResponse(res, 'VALIDATION_ERROR', 'workerId is required', 400);
    }

    const worker = await getWorkerById(workerId);

    if (!worker) {
      return errorResponse(res, 'NOT_FOUND', `Worker ${workerId} not found`, 404);
    }

    // Increment view count asynchronously (don't wait)
    incrementViewCount(workerId).catch((err) => {
      logger.error('Failed to increment view count', err);
    });

    return successResponse(res, {
      worker: toWorkerResponse(worker),
    });
  } catch (error) {
    logger.error('Error getting worker', error as Error);
    next(error);
  }
});

// POST /api/workers - Create worker profile
router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate input
    const validation = validateCreateWorkerInput(req.body);
    if (!validation.valid || !validation.data) {
      return errorResponse(res, 'VALIDATION_ERROR', validation.error || 'Invalid input', 400);
    }

    // Create worker
    const worker = await createWorker(validation.data);

    logger.info('Worker created via API', { workerId: worker.workerId });

    return successResponse(
      res,
      {
        message: 'Worker profile created successfully',
        worker: toWorkerResponse(worker),
      },
      201
    );
  } catch (error) {
    if (error instanceof DuplicateEntryError) {
      return errorResponse(res, 'DUPLICATE_ENTRY', error.message, 409);
    }

    if (error instanceof Error && error.message === 'Invalid Aadhaar number format') {
      return errorResponse(res, 'VALIDATION_ERROR', error.message, 400);
    }

    logger.error('Error creating worker', error as Error);
    next(error);
  }
});

// PUT /api/workers/:workerId - Update worker profile
router.put('/:workerId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { workerId } = req.params;

    if (!workerId) {
      return errorResponse(res, 'VALIDATION_ERROR', 'workerId is required', 400);
    }

    // Check if worker exists
    const existingWorker = await getWorkerById(workerId);
    if (!existingWorker) {
      return errorResponse(res, 'NOT_FOUND', `Worker ${workerId} not found`, 404);
    }

    // Validate update fields
    const body = req.body as Record<string, unknown>;
    const updates: UpdateWorkerInput = {};

    // Allowed update fields
    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim() === '') {
        return errorResponse(res, 'VALIDATION_ERROR', 'name must be a non-empty string', 400);
      }
      updates.name = body.name.trim();
    }

    if (body.bio !== undefined) {
      if (typeof body.bio !== 'string') {
        return errorResponse(res, 'VALIDATION_ERROR', 'bio must be a string', 400);
      }
      updates.bio = body.bio.trim();
    }

    if (body.isAvailable !== undefined) {
      if (typeof body.isAvailable !== 'boolean') {
        return errorResponse(res, 'VALIDATION_ERROR', 'isAvailable must be a boolean', 400);
      }
      updates.isAvailable = body.isAvailable;
    }

    if (body.experienceYears !== undefined) {
      if (typeof body.experienceYears !== 'number' || body.experienceYears < 0 || body.experienceYears > 50) {
        return errorResponse(res, 'VALIDATION_ERROR', 'experienceYears must be a number between 0 and 50', 400);
      }
      updates.experienceYears = body.experienceYears;
    }

    if (body.profilePhotoUrl !== undefined) {
      if (typeof body.profilePhotoUrl !== 'string') {
        return errorResponse(res, 'VALIDATION_ERROR', 'profilePhotoUrl must be a string', 400);
      }
      updates.profilePhotoUrl = body.profilePhotoUrl;
    }

    // Location updates (all must be provided together)
    if (body.townId !== undefined || body.categoryId !== undefined) {
      const locationFields = ['townId', 'townName', 'tehsilId', 'tehsilName', 'districtId', 'districtName', 'stateId', 'stateName'];
      const categoryFields = ['categoryId', 'categoryName'];

      if (body.townId !== undefined) {
        for (const field of locationFields) {
          if (!body[field] || typeof body[field] !== 'string') {
            return errorResponse(res, 'VALIDATION_ERROR', `${field} is required when updating location`, 400);
          }
          (updates as Record<string, unknown>)[field] = (body[field] as string).trim();
        }
      }

      if (body.categoryId !== undefined) {
        for (const field of categoryFields) {
          if (!body[field] || typeof body[field] !== 'string') {
            return errorResponse(res, 'VALIDATION_ERROR', `${field} is required when updating category`, 400);
          }
          (updates as Record<string, unknown>)[field] = (body[field] as string).trim();
        }
      }
    }

    if (Object.keys(updates).length === 0) {
      return errorResponse(res, 'VALIDATION_ERROR', 'No valid update fields provided', 400);
    }

    const updatedWorker = await updateWorkerProfile(workerId, updates);

    if (!updatedWorker) {
      return errorResponse(res, 'NOT_FOUND', `Worker ${workerId} not found`, 404);
    }

    logger.info('Worker updated via API', { workerId });

    return successResponse(res, {
      message: 'Worker profile updated successfully',
      worker: toWorkerResponse(updatedWorker),
    });
  } catch (error) {
    logger.error('Error updating worker', error as Error);
    next(error);
  }
});

export default router;

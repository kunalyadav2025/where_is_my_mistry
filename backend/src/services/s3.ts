import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { logger } from '../utils/logger';

const isOffline = process.env.IS_OFFLINE === 'true';

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'ap-south-1',
  ...(isOffline && {
    endpoint: 'http://localhost:4566',
    forcePathStyle: true,
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    },
  }),
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME || 'whereismymistry-uploads-dev';

// Allowed folder types (enum to prevent arbitrary folder names)
export type UploadFolder = 'profile' | 'work-photos' | 'aadhaar';

// Allowed content types
const ALLOWED_CONTENT_TYPES: Record<UploadFolder, string[]> = {
  'profile': ['image/jpeg', 'image/png', 'image/webp'],
  'work-photos': ['image/jpeg', 'image/png', 'image/webp'],
  'aadhaar': ['image/jpeg', 'image/png', 'application/pdf'],
};

// Max file sizes per folder type (in bytes)
const MAX_FILE_SIZES: Record<UploadFolder, number> = {
  'profile': 5 * 1024 * 1024, // 5MB
  'work-photos': 10 * 1024 * 1024, // 10MB
  'aadhaar': 5 * 1024 * 1024, // 5MB
};

export interface PresignedUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
  maxSize: number;
}

/**
 * Sanitize filename to prevent path traversal and other attacks
 */
function sanitizeFileName(fileName: string): string {
  // Remove path separators and dots (except for extension)
  const baseName = fileName.replace(/[\/\\]/g, '_').replace(/\.\./g, '_');
  // Only allow alphanumeric, dash, underscore, and a single dot for extension
  const sanitized = baseName.replace(/[^a-zA-Z0-9._-]/g, '_');
  // Limit length
  if (sanitized.length > 100) {
    const ext = sanitized.split('.').pop() || '';
    return sanitized.substring(0, 95) + '.' + ext;
  }
  return sanitized;
}

/**
 * Generate a presigned URL for uploading files
 * @param workerId - The worker's ID (from JWT, not request body)
 * @param folder - The folder type (enum, not arbitrary string)
 * @param fileName - The original filename (will be sanitized)
 * @param contentType - The content type
 * @param expiresIn - URL expiration in seconds (default 5 minutes)
 */
export async function generateUploadUrl(
  workerId: string,
  folder: UploadFolder,
  fileName: string,
  contentType: string,
  expiresIn = 300
): Promise<PresignedUrlResult> {
  // Validate workerId format (basic UUID check)
  if (!workerId || !/^[a-zA-Z0-9-]{8,}$/.test(workerId)) {
    throw new Error('Invalid worker ID');
  }

  // Validate content type
  const allowedTypes = ALLOWED_CONTENT_TYPES[folder];
  if (!allowedTypes.includes(contentType)) {
    throw new Error(`Content type ${contentType} not allowed for ${folder}. Allowed: ${allowedTypes.join(', ')}`);
  }

  // Sanitize filename
  const safeName = sanitizeFileName(fileName);

  // Construct secure key path: workers/{workerId}/{folder}/{timestamp}-{filename}
  const key = `workers/${workerId}/${folder}/${Date.now()}-${safeName}`;

  logger.info('Generating upload URL', { workerId, folder, key });

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;

  return {
    uploadUrl,
    fileUrl,
    key,
    maxSize: MAX_FILE_SIZES[folder],
  };
}

/**
 * Generate a presigned URL for downloading/viewing files
 */
export async function generateDownloadUrl(
  key: string,
  expiresIn = 3600 // 1 hour
): Promise<string> {
  // Validate key doesn't contain path traversal
  if (key.includes('..') || key.startsWith('/')) {
    throw new Error('Invalid file key');
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3
 */
export async function deleteFile(key: string): Promise<void> {
  // Validate key doesn't contain path traversal
  if (key.includes('..') || key.startsWith('/')) {
    throw new Error('Invalid file key');
  }

  logger.info('Deleting file from S3', { key });

  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

/**
 * Delete all files for a worker (used when deleting worker profile)
 */
export async function deleteWorkerFiles(workerId: string): Promise<void> {
  // Validate workerId format
  if (!workerId || !/^[a-zA-Z0-9-]{8,}$/.test(workerId)) {
    throw new Error('Invalid worker ID');
  }

  // Note: This requires additional S3 ListObjects permission
  // For now, just log - implement actual deletion if needed
  logger.warn('deleteWorkerFiles not fully implemented', { workerId });
}

export { s3Client, BUCKET_NAME };

import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

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

export interface PresignedUrlResult {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

export async function generateUploadUrl(
  folder: string,
  fileName: string,
  contentType: string,
  expiresIn = 300 // 5 minutes
): Promise<PresignedUrlResult> {
  const key = `${folder}/${Date.now()}-${fileName}`;

  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn });
  const fileUrl = `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION || 'ap-south-1'}.amazonaws.com/${key}`;

  return { uploadUrl, fileUrl, key };
}

export async function generateDownloadUrl(
  key: string,
  expiresIn = 3600 // 1 hour
): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3Client, command, { expiresIn });
}

export async function deleteFile(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  await s3Client.send(command);
}

export { s3Client, BUCKET_NAME };

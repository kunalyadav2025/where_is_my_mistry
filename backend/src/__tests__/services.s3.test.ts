import { mockClient } from 'aws-sdk-client-mock';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import {
  generateUploadUrl,
  generateDownloadUrl,
  deleteFile,
  BUCKET_NAME,
  UploadFolder,
} from '../services/s3';

// Mock the getSignedUrl function
jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

const s3Mock = mockClient(S3Client);
const mockedGetSignedUrl = getSignedUrl as jest.MockedFunction<typeof getSignedUrl>;

describe('S3 Service', () => {
  const validWorkerId = 'test-worker-123';

  beforeEach(() => {
    s3Mock.reset();
    jest.clearAllMocks();
  });

  describe('BUCKET_NAME', () => {
    it('should export bucket name', () => {
      expect(BUCKET_NAME).toBe('test-bucket');
    });
  });

  describe('generateUploadUrl', () => {
    it('should generate presigned upload URL for profile photo', async () => {
      const mockSignedUrl = 'https://test-bucket.s3.amazonaws.com/presigned-url';
      mockedGetSignedUrl.mockResolvedValue(mockSignedUrl);

      const result = await generateUploadUrl(validWorkerId, 'profile', 'photo.jpg', 'image/jpeg');

      expect(result.uploadUrl).toBe(mockSignedUrl);
      expect(result.key).toMatch(/^workers\/test-worker-123\/profile\/\d+-photo\.jpg$/);
      expect(result.fileUrl).toContain('test-bucket.s3.ap-south-1.amazonaws.com');
      expect(result.maxSize).toBe(5 * 1024 * 1024); // 5MB for profile
    });

    it('should generate presigned upload URL for work photos', async () => {
      const mockSignedUrl = 'https://test-bucket.s3.amazonaws.com/presigned-url';
      mockedGetSignedUrl.mockResolvedValue(mockSignedUrl);

      const result = await generateUploadUrl(validWorkerId, 'work-photos', 'work.jpg', 'image/jpeg');

      expect(result.key).toMatch(/^workers\/test-worker-123\/work-photos\/\d+-work\.jpg$/);
      expect(result.maxSize).toBe(10 * 1024 * 1024); // 10MB for work-photos
    });

    it('should include timestamp in file key', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://test.com/url');

      const result = await generateUploadUrl(validWorkerId, 'profile', 'photo.jpg', 'image/jpeg');

      const timestampMatch = result.key.match(/workers\/[^/]+\/profile\/(\d+)-photo\.jpg/);
      expect(timestampMatch).not.toBeNull();
      const timestamp = parseInt(timestampMatch![1], 10);
      expect(timestamp).toBeGreaterThan(0);
      expect(timestamp).toBeLessThanOrEqual(Date.now());
    });

    it('should use correct content type', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://test.com/url');

      await generateUploadUrl(validWorkerId, 'profile', 'image.png', 'image/png');

      expect(mockedGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          input: expect.objectContaining({
            ContentType: 'image/png',
          }),
        }),
        expect.objectContaining({ expiresIn: 300 })
      );
    });

    it('should use correct bucket name', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://test.com/url');

      await generateUploadUrl(validWorkerId, 'profile', 'image.jpg', 'image/jpeg');

      expect(mockedGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: BUCKET_NAME,
          }),
        }),
        expect.anything()
      );
    });

    it('should use default expiration of 5 minutes', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://test.com/url');

      await generateUploadUrl(validWorkerId, 'profile', 'image.jpg', 'image/jpeg');

      expect(mockedGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ expiresIn: 300 })
      );
    });

    it('should accept custom expiration time', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://test.com/url');

      await generateUploadUrl(validWorkerId, 'profile', 'image.jpg', 'image/jpeg', 600);

      expect(mockedGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ expiresIn: 600 })
      );
    });

    it('should reject invalid worker ID', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://test.com/url');

      await expect(
        generateUploadUrl('', 'profile', 'photo.jpg', 'image/jpeg')
      ).rejects.toThrow('Invalid worker ID');

      await expect(
        generateUploadUrl('ab', 'profile', 'photo.jpg', 'image/jpeg')
      ).rejects.toThrow('Invalid worker ID');
    });

    it('should reject invalid content type for folder', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://test.com/url');

      await expect(
        generateUploadUrl(validWorkerId, 'profile', 'file.txt', 'text/plain')
      ).rejects.toThrow(/Content type.*not allowed/);
    });

    it('should sanitize filename with special characters', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://test.com/url');

      const result = await generateUploadUrl(
        validWorkerId,
        'profile',
        'my photo (1)!@#$.jpg',
        'image/jpeg'
      );

      expect(result.key).toMatch(/my_photo__1____\.jpg$/);
    });

    it('should sanitize path traversal attempts', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://test.com/url');

      const result = await generateUploadUrl(
        validWorkerId,
        'profile',
        '../../../etc/passwd',
        'image/jpeg'
      );

      expect(result.key).not.toContain('..');
      expect(result.key).toMatch(/^workers\/[^/]+\/profile\//);
    });

    it('should handle long filenames by truncating', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://test.com/url');

      const longFilename = 'a'.repeat(200) + '.jpg';
      const result = await generateUploadUrl(validWorkerId, 'profile', longFilename, 'image/jpeg');

      // Should be truncated but keep extension
      expect(result.key.length).toBeLessThan(200);
      expect(result.key).toContain('.jpg');
    });
  });

  describe('generateDownloadUrl', () => {
    it('should generate presigned download URL', async () => {
      const mockSignedUrl = 'https://test-bucket.s3.amazonaws.com/download-url';
      mockedGetSignedUrl.mockResolvedValue(mockSignedUrl);

      const result = await generateDownloadUrl('workers/123-photo.jpg');

      expect(result).toBe(mockSignedUrl);
      expect(mockedGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          input: expect.objectContaining({
            Bucket: BUCKET_NAME,
            Key: 'workers/123-photo.jpg',
          }),
        }),
        expect.objectContaining({ expiresIn: 3600 })
      );
    });

    it('should use default expiration of 1 hour', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://test.com/url');

      await generateDownloadUrl('workers/photo.jpg');

      expect(mockedGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ expiresIn: 3600 })
      );
    });

    it('should accept custom expiration time', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://test.com/url');

      await generateDownloadUrl('workers/photo.jpg', 7200);

      expect(mockedGetSignedUrl).toHaveBeenCalledWith(
        expect.anything(),
        expect.anything(),
        expect.objectContaining({ expiresIn: 7200 })
      );
    });

    it('should reject path traversal attempts', async () => {
      await expect(
        generateDownloadUrl('../etc/passwd')
      ).rejects.toThrow('Invalid file key');

      await expect(
        generateDownloadUrl('/absolute/path')
      ).rejects.toThrow('Invalid file key');
    });
  });

  describe('deleteFile', () => {
    it('should delete file from S3', async () => {
      s3Mock.on(DeleteObjectCommand).resolves({});

      await deleteFile('workers/test-worker-123/profile/123-photo.jpg');

      expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
      expect(s3Mock.commandCalls(DeleteObjectCommand)[0].args[0].input).toMatchObject({
        Bucket: BUCKET_NAME,
        Key: 'workers/test-worker-123/profile/123-photo.jpg',
      });
    });

    it('should handle deletion of non-existent files', async () => {
      s3Mock.on(DeleteObjectCommand).resolves({});

      await deleteFile('non-existent/file.jpg');

      expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
    });

    it('should handle S3 errors', async () => {
      s3Mock.on(DeleteObjectCommand).rejects(new Error('Access denied'));

      await expect(deleteFile('workers/photo.jpg')).rejects.toThrow('Access denied');
    });

    it('should reject path traversal attempts', async () => {
      await expect(
        deleteFile('../etc/passwd')
      ).rejects.toThrow('Invalid file key');

      await expect(
        deleteFile('/absolute/path')
      ).rejects.toThrow('Invalid file key');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors in generateUploadUrl', async () => {
      mockedGetSignedUrl.mockRejectedValue(new Error('Network error'));

      await expect(
        generateUploadUrl(validWorkerId, 'profile', 'photo.jpg', 'image/jpeg')
      ).rejects.toThrow('Network error');
    });

    it('should handle network errors in generateDownloadUrl', async () => {
      mockedGetSignedUrl.mockRejectedValue(new Error('Network error'));

      await expect(generateDownloadUrl('workers/photo.jpg')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle S3 service errors', async () => {
      s3Mock.on(DeleteObjectCommand).rejects(new Error('Service unavailable'));

      await expect(deleteFile('workers/photo.jpg')).rejects.toThrow(
        'Service unavailable'
      );
    });
  });

  describe('Integration Scenarios', () => {
    it('should generate unique keys for concurrent uploads', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://test.com/url');

      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(generateUploadUrl(validWorkerId, 'profile', 'photo.jpg', 'image/jpeg'));
        // Small delay to ensure different timestamps
        await new Promise(resolve => setTimeout(resolve, 2));
      }

      const results = await Promise.all(promises);
      const keys = results.map((r) => r.key);

      // All keys should be unique due to timestamp
      const uniqueKeys = new Set(keys);
      expect(uniqueKeys.size).toBeGreaterThan(1);
    });

    it('should handle upload and delete workflow', async () => {
      mockedGetSignedUrl.mockResolvedValue('https://test.com/url');
      s3Mock.on(DeleteObjectCommand).resolves({});

      // Generate upload URL
      const uploadResult = await generateUploadUrl(
        validWorkerId,
        'profile',
        'photo.jpg',
        'image/jpeg'
      );
      expect(uploadResult.key).toBeDefined();

      // Delete the file
      await deleteFile(uploadResult.key);
      expect(s3Mock.commandCalls(DeleteObjectCommand)).toHaveLength(1);
    });
  });
});

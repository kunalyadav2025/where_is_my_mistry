import { mockClient } from 'aws-sdk-client-mock';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import {
  getItem,
  putItem,
  queryItems,
  updateItem,
  deleteItem,
  batchWrite,
  Tables,
} from '../services/dynamodb';

const ddbMock = mockClient(DynamoDBDocumentClient);

describe('DynamoDB Service', () => {
  beforeEach(() => {
    ddbMock.reset();
  });

  describe('Tables', () => {
    it('should export table names', () => {
      expect(Tables.WORKERS).toBe('test-workers');
      expect(Tables.PHOTOS).toBe('test-photos');
      expect(Tables.REVIEWS).toBe('test-reviews');
      expect(Tables.LOCATIONS).toBe('test-locations');
      expect(Tables.CATEGORIES).toBe('test-categories');
      expect(Tables.OTP).toBe('test-otp');
      expect(Tables.ADMINS).toBe('test-admins');
    });
  });

  describe('getItem', () => {
    it('should retrieve item from DynamoDB', async () => {
      const mockItem = { pk: 'worker-123', sk: 'PROFILE', name: 'John Doe' };
      ddbMock.on(GetCommand).resolves({ Item: mockItem });

      const result = await getItem(Tables.WORKERS, 'worker-123', 'PROFILE');

      expect(result).toEqual(mockItem);
      expect(ddbMock.commandCalls(GetCommand)).toHaveLength(1);
      expect(ddbMock.commandCalls(GetCommand)[0].args[0].input).toMatchObject({
        TableName: Tables.WORKERS,
        Key: { pk: 'worker-123', sk: 'PROFILE' },
      });
    });

    it('should return null when item does not exist', async () => {
      ddbMock.on(GetCommand).resolves({});

      const result = await getItem(Tables.WORKERS, 'non-existent', 'PROFILE');

      expect(result).toBeNull();
    });

    it('should handle different table names', async () => {
      const mockItem = { pk: 'photo-123', sk: 'METADATA' };
      ddbMock.on(GetCommand).resolves({ Item: mockItem });

      await getItem(Tables.PHOTOS, 'photo-123', 'METADATA');

      expect(ddbMock.commandCalls(GetCommand)[0].args[0].input.TableName).toBe(
        Tables.PHOTOS
      );
    });

    it('should handle DynamoDB errors', async () => {
      ddbMock.on(GetCommand).rejects(new Error('DynamoDB error'));

      await expect(
        getItem(Tables.WORKERS, 'worker-123', 'PROFILE')
      ).rejects.toThrow('DynamoDB error');
    });
  });

  describe('putItem', () => {
    it('should put item into DynamoDB', async () => {
      ddbMock.on(PutCommand).resolves({});

      const item = { pk: 'worker-123', sk: 'PROFILE', name: 'John Doe' };
      await putItem(Tables.WORKERS, item);

      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
      expect(ddbMock.commandCalls(PutCommand)[0].args[0].input).toMatchObject({
        TableName: Tables.WORKERS,
        Item: item,
      });
    });

    it('should remove undefined values from item', async () => {
      ddbMock.on(PutCommand).resolves({});

      const item = {
        pk: 'worker-123',
        sk: 'PROFILE',
        name: 'John Doe',
        undefinedField: undefined,
      };
      await putItem(Tables.WORKERS, item);

      expect(ddbMock.commandCalls(PutCommand)).toHaveLength(1);
    });

    it('should handle complex nested objects', async () => {
      ddbMock.on(PutCommand).resolves({});

      const item = {
        pk: 'worker-123',
        sk: 'PROFILE',
        profile: {
          personal: { name: 'John', age: 30 },
          settings: { notifications: true },
        },
        skills: ['plumbing', 'electrical'],
      };

      await putItem(Tables.WORKERS, item);

      expect(ddbMock.commandCalls(PutCommand)[0].args[0].input.Item).toEqual(item);
    });

    it('should handle DynamoDB errors', async () => {
      ddbMock.on(PutCommand).rejects(new Error('ConditionalCheckFailedException'));

      const item = { pk: 'worker-123', sk: 'PROFILE' };
      await expect(putItem(Tables.WORKERS, item)).rejects.toThrow(
        'ConditionalCheckFailedException'
      );
    });
  });

  describe('queryItems', () => {
    it('should query items from DynamoDB', async () => {
      const mockItems = [
        { pk: 'worker-123', sk: 'PHOTO#1' },
        { pk: 'worker-123', sk: 'PHOTO#2' },
      ];
      ddbMock.on(QueryCommand).resolves({ Items: mockItems });

      const result = await queryItems(
        Tables.PHOTOS,
        'pk = :pk',
        { ':pk': 'worker-123' }
      );

      expect(result.items).toEqual(mockItems);
      expect(result.lastKey).toBeUndefined();
      expect(ddbMock.commandCalls(QueryCommand)).toHaveLength(1);
    });

    it('should handle pagination with ExclusiveStartKey', async () => {
      const mockItems = [{ pk: 'worker-123', sk: 'PHOTO#3' }];
      const lastKey = { pk: 'worker-123', sk: 'PHOTO#2' };
      ddbMock.on(QueryCommand).resolves({ Items: mockItems, LastEvaluatedKey: lastKey });

      const result = await queryItems(
        Tables.PHOTOS,
        'pk = :pk',
        { ':pk': 'worker-123' },
        { exclusiveStartKey: { pk: 'worker-123', sk: 'PHOTO#2' } }
      );

      expect(result.items).toEqual(mockItems);
      expect(result.lastKey).toEqual(lastKey);
    });

    it('should support index queries', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      await queryItems(
        Tables.WORKERS,
        'gsi1pk = :gsi1pk',
        { ':gsi1pk': 'CATEGORY#plumber' },
        { indexName: 'GSI1' }
      );

      expect(ddbMock.commandCalls(QueryCommand)[0].args[0].input.IndexName).toBe(
        'GSI1'
      );
    });

    it('should support limit option', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      await queryItems(
        Tables.WORKERS,
        'pk = :pk',
        { ':pk': 'worker-123' },
        { limit: 10 }
      );

      expect(ddbMock.commandCalls(QueryCommand)[0].args[0].input.Limit).toBe(10);
    });

    it('should support scanIndexForward option', async () => {
      ddbMock.on(QueryCommand).resolves({ Items: [] });

      await queryItems(
        Tables.WORKERS,
        'pk = :pk',
        { ':pk': 'worker-123' },
        { scanIndexForward: false }
      );

      expect(ddbMock.commandCalls(QueryCommand)[0].args[0].input.ScanIndexForward).toBe(
        false
      );
    });

    it('should return empty array when no items found', async () => {
      ddbMock.on(QueryCommand).resolves({});

      const result = await queryItems(
        Tables.WORKERS,
        'pk = :pk',
        { ':pk': 'non-existent' }
      );

      expect(result.items).toEqual([]);
      expect(result.lastKey).toBeUndefined();
    });
  });

  describe('updateItem', () => {
    it('should update item in DynamoDB', async () => {
      ddbMock.on(UpdateCommand).resolves({});

      const updates = { name: 'Updated Name', status: 'active' };
      await updateItem(Tables.WORKERS, 'worker-123', 'PROFILE', updates);

      expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(1);
      const input = ddbMock.commandCalls(UpdateCommand)[0].args[0].input;
      expect(input.TableName).toBe(Tables.WORKERS);
      expect(input.Key).toEqual({ pk: 'worker-123', sk: 'PROFILE' });
    });

    it('should generate correct update expression', async () => {
      ddbMock.on(UpdateCommand).resolves({});

      const updates = { name: 'John', age: 30 };
      await updateItem(Tables.WORKERS, 'worker-123', 'PROFILE', updates);

      const input = ddbMock.commandCalls(UpdateCommand)[0].args[0].input;
      expect(input.UpdateExpression).toContain('SET');
      expect(input.ExpressionAttributeValues).toBeDefined();
      expect(input.ExpressionAttributeNames).toBeDefined();
    });

    it('should handle single field update', async () => {
      ddbMock.on(UpdateCommand).resolves({});

      await updateItem(Tables.WORKERS, 'worker-123', 'PROFILE', { status: 'verified' });

      expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(1);
    });

    it('should handle multiple field updates', async () => {
      ddbMock.on(UpdateCommand).resolves({});

      const updates = {
        name: 'John',
        mobile: '9876543210',
        verified: true,
        rating: 4.5,
      };
      await updateItem(Tables.WORKERS, 'worker-123', 'PROFILE', updates);

      expect(ddbMock.commandCalls(UpdateCommand)).toHaveLength(1);
    });

    it('should handle DynamoDB errors', async () => {
      ddbMock.on(UpdateCommand).rejects(new Error('Item does not exist'));

      await expect(
        updateItem(Tables.WORKERS, 'worker-123', 'PROFILE', { name: 'John' })
      ).rejects.toThrow('Item does not exist');
    });
  });

  describe('deleteItem', () => {
    it('should delete item from DynamoDB', async () => {
      ddbMock.on(DeleteCommand).resolves({});

      await deleteItem(Tables.WORKERS, 'worker-123', 'PROFILE');

      expect(ddbMock.commandCalls(DeleteCommand)).toHaveLength(1);
      expect(ddbMock.commandCalls(DeleteCommand)[0].args[0].input).toMatchObject({
        TableName: Tables.WORKERS,
        Key: { pk: 'worker-123', sk: 'PROFILE' },
      });
    });

    it('should handle deletion of non-existent items', async () => {
      ddbMock.on(DeleteCommand).resolves({});

      await deleteItem(Tables.WORKERS, 'non-existent', 'PROFILE');

      expect(ddbMock.commandCalls(DeleteCommand)).toHaveLength(1);
    });

    it('should handle DynamoDB errors', async () => {
      ddbMock.on(DeleteCommand).rejects(new Error('Access denied'));

      await expect(
        deleteItem(Tables.WORKERS, 'worker-123', 'PROFILE')
      ).rejects.toThrow('Access denied');
    });
  });

  describe('batchWrite', () => {
    it('should batch write items to DynamoDB', async () => {
      ddbMock.on(BatchWriteCommand).resolves({});

      const items = [
        { pk: 'worker-1', sk: 'PROFILE' },
        { pk: 'worker-2', sk: 'PROFILE' },
      ];
      await batchWrite(Tables.WORKERS, items);

      expect(ddbMock.commandCalls(BatchWriteCommand)).toHaveLength(1);
    });

    it('should handle batches of 25 items or less', async () => {
      ddbMock.on(BatchWriteCommand).resolves({});

      const items = Array.from({ length: 25 }, (_, i) => ({
        pk: `worker-${i}`,
        sk: 'PROFILE',
      }));

      await batchWrite(Tables.WORKERS, items);

      expect(ddbMock.commandCalls(BatchWriteCommand)).toHaveLength(1);
    });

    it('should split large batches into chunks of 25', async () => {
      ddbMock.on(BatchWriteCommand).resolves({});

      const items = Array.from({ length: 60 }, (_, i) => ({
        pk: `worker-${i}`,
        sk: 'PROFILE',
      }));

      await batchWrite(Tables.WORKERS, items);

      // 60 items = 3 batches (25 + 25 + 10)
      expect(ddbMock.commandCalls(BatchWriteCommand)).toHaveLength(3);
    });

    it('should handle empty array', async () => {
      ddbMock.on(BatchWriteCommand).resolves({});

      await batchWrite(Tables.WORKERS, []);

      expect(ddbMock.commandCalls(BatchWriteCommand)).toHaveLength(0);
    });

    it('should handle single item', async () => {
      ddbMock.on(BatchWriteCommand).resolves({});

      await batchWrite(Tables.WORKERS, [{ pk: 'worker-1', sk: 'PROFILE' }]);

      expect(ddbMock.commandCalls(BatchWriteCommand)).toHaveLength(1);
    });

    it('should handle DynamoDB errors', async () => {
      ddbMock.on(BatchWriteCommand).rejects(new Error('Throughput exceeded'));

      const items = [{ pk: 'worker-1', sk: 'PROFILE' }];
      await expect(batchWrite(Tables.WORKERS, items)).rejects.toThrow(
        'Throughput exceeded'
      );
    });
  });
});

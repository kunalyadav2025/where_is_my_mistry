import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import { logger } from '../utils/logger';

const isOffline = process.env.IS_OFFLINE === 'true';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'ap-south-1',
  ...(isOffline && {
    endpoint: 'http://localhost:8000',
    credentials: {
      accessKeyId: 'local',
      secretAccessKey: 'local',
    },
  }),
});

export const dynamodb = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    removeUndefinedValues: true,
  },
});

// Table names
export const Tables = {
  WORKERS: process.env.DYNAMODB_WORKERS_TABLE || 'whereismymistry-api-workers-dev',
  PHOTOS: process.env.DYNAMODB_PHOTOS_TABLE || 'whereismymistry-api-photos-dev',
  REVIEWS: process.env.DYNAMODB_REVIEWS_TABLE || 'whereismymistry-api-reviews-dev',
  LOCATIONS: process.env.DYNAMODB_LOCATIONS_TABLE || 'whereismymistry-api-locations-dev',
  CATEGORIES: process.env.DYNAMODB_CATEGORIES_TABLE || 'whereismymistry-api-categories-dev',
  OTP: process.env.DYNAMODB_OTP_TABLE || 'whereismymistry-api-otp-dev',
  ADMINS: process.env.DYNAMODB_ADMINS_TABLE || 'whereismymistry-api-admins-dev',
} as const;

// Custom error for duplicate entries
export class DuplicateEntryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DuplicateEntryError';
  }
}

// Helper functions
export async function getItem<T>(tableName: string, pk: string, sk: string): Promise<T | null> {
  const result = await dynamodb.send(
    new GetCommand({
      TableName: tableName,
      Key: { pk, sk },
    })
  );
  return (result.Item as T) || null;
}

/**
 * Put an item (will overwrite if exists)
 * Use createItem if you need to prevent duplicates
 */
export async function putItem(tableName: string, item: Record<string, unknown>): Promise<void> {
  await dynamodb.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );
}

/**
 * Create a new item - fails if item with same pk/sk already exists
 * Use this for worker registration, review creation, etc.
 */
export async function createItem(
  tableName: string,
  item: Record<string, unknown>
): Promise<void> {
  try {
    await dynamodb.send(
      new PutCommand({
        TableName: tableName,
        Item: item,
        ConditionExpression: 'attribute_not_exists(pk)',
      })
    );
  } catch (error: unknown) {
    if (error && typeof error === 'object' && 'name' in error && error.name === 'ConditionalCheckFailedException') {
      throw new DuplicateEntryError(`Item already exists in ${tableName}`);
    }
    throw error;
  }
}

export async function queryItems<T>(
  tableName: string,
  keyCondition: string,
  expressionValues: Record<string, unknown>,
  options?: {
    indexName?: string;
    limit?: number;
    scanIndexForward?: boolean;
    exclusiveStartKey?: Record<string, unknown>;
    filterExpression?: string;
    expressionNames?: Record<string, string>;
  }
): Promise<{ items: T[]; lastKey?: Record<string, unknown> }> {
  const result = await dynamodb.send(
    new QueryCommand({
      TableName: tableName,
      KeyConditionExpression: keyCondition,
      ExpressionAttributeValues: expressionValues,
      IndexName: options?.indexName,
      Limit: options?.limit,
      ScanIndexForward: options?.scanIndexForward,
      ExclusiveStartKey: options?.exclusiveStartKey,
      FilterExpression: options?.filterExpression,
      ExpressionAttributeNames: options?.expressionNames,
    })
  );

  return {
    items: (result.Items as T[]) || [],
    lastKey: result.LastEvaluatedKey,
  };
}

export async function updateItem(
  tableName: string,
  pk: string,
  sk: string,
  updates: Record<string, unknown>
): Promise<void> {
  const updateExpressions: string[] = [];
  const expressionValues: Record<string, unknown> = {};
  const expressionNames: Record<string, string> = {};

  Object.entries(updates).forEach(([key, value], index) => {
    const attrName = `#attr${index}`;
    const attrValue = `:val${index}`;
    updateExpressions.push(`${attrName} = ${attrValue}`);
    expressionValues[attrValue] = value;
    expressionNames[attrName] = key;
  });

  await dynamodb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk },
      UpdateExpression: `SET ${updateExpressions.join(', ')}`,
      ExpressionAttributeValues: expressionValues,
      ExpressionAttributeNames: expressionNames,
    })
  );
}

/**
 * Atomically increment a counter field
 * Use this for viewCount, reviewCount, etc.
 */
export async function incrementCounter(
  tableName: string,
  pk: string,
  sk: string,
  counterName: string,
  incrementBy = 1
): Promise<number> {
  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk },
      UpdateExpression: 'ADD #counter :inc',
      ExpressionAttributeNames: { '#counter': counterName },
      ExpressionAttributeValues: { ':inc': incrementBy },
      ReturnValues: 'UPDATED_NEW',
    })
  );

  return (result.Attributes?.[counterName] as number) || incrementBy;
}

/**
 * Atomically update average rating
 * Uses a two-field approach: totalRatingSum and reviewCount
 */
export async function updateAverageRating(
  tableName: string,
  pk: string,
  sk: string,
  newRating: number
): Promise<{ avgRating: number; reviewCount: number }> {
  const result = await dynamodb.send(
    new UpdateCommand({
      TableName: tableName,
      Key: { pk, sk },
      UpdateExpression: 'ADD #totalSum :rating, #count :one SET #avg = (#totalSum + :rating) / (#count + :one)',
      ExpressionAttributeNames: {
        '#totalSum': 'totalRatingSum',
        '#count': 'reviewCount',
        '#avg': 'avgRating',
      },
      ExpressionAttributeValues: {
        ':rating': newRating,
        ':one': 1,
      },
      ReturnValues: 'UPDATED_NEW',
    })
  );

  return {
    avgRating: (result.Attributes?.avgRating as number) || newRating,
    reviewCount: (result.Attributes?.reviewCount as number) || 1,
  };
}

export async function deleteItem(tableName: string, pk: string, sk: string): Promise<void> {
  await dynamodb.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { pk, sk },
    })
  );
}

/**
 * Batch write with retry logic for unprocessed items
 */
export async function batchWrite(
  tableName: string,
  items: Record<string, unknown>[],
  maxRetries = 3
): Promise<void> {
  // DynamoDB batch write has a limit of 25 items
  const batches: Record<string, unknown>[][] = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  for (const batch of batches) {
    let unprocessedItems = batch;
    let retries = 0;

    while (unprocessedItems.length > 0 && retries < maxRetries) {
      const result = await dynamodb.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: unprocessedItems.map((item) => ({
              PutRequest: { Item: item },
            })),
          },
        })
      );

      const unprocessed = result.UnprocessedItems?.[tableName];
      if (unprocessed && unprocessed.length > 0) {
        unprocessedItems = unprocessed.map((req) => req.PutRequest?.Item as Record<string, unknown>).filter(Boolean);
        retries++;
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, retries) * 100));
        logger.warn('Retrying unprocessed batch items', { count: unprocessedItems.length, retry: retries });
      } else {
        unprocessedItems = [];
      }
    }

    if (unprocessedItems.length > 0) {
      logger.error('Failed to write some items after retries', undefined, { count: unprocessedItems.length });
      throw new Error(`Failed to write ${unprocessedItems.length} items after ${maxRetries} retries`);
    }
  }
}

export { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, BatchWriteCommand };

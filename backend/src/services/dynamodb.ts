import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';

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

export async function putItem(tableName: string, item: Record<string, unknown>): Promise<void> {
  await dynamodb.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
    })
  );
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

export async function deleteItem(tableName: string, pk: string, sk: string): Promise<void> {
  await dynamodb.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { pk, sk },
    })
  );
}

export async function batchWrite(
  tableName: string,
  items: Record<string, unknown>[]
): Promise<void> {
  // DynamoDB batch write has a limit of 25 items
  const batches: Record<string, unknown>[][] = [];
  for (let i = 0; i < items.length; i += 25) {
    batches.push(items.slice(i, i + 25));
  }

  for (const batch of batches) {
    await dynamodb.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: batch.map((item) => ({
            PutRequest: { Item: item },
          })),
        },
      })
    );
  }
}

export { GetCommand, PutCommand, QueryCommand, UpdateCommand, DeleteCommand, BatchWriteCommand };

import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const CATEGORIES = [
  { id: 'plumber', name: 'Plumber', nameHindi: 'प्लंबर', icon: 'pipe', order: 1 },
  { id: 'electrician', name: 'Electrician', nameHindi: 'इलेक्ट्रीशियन', icon: 'bolt', order: 2 },
  { id: 'painter', name: 'Painter', nameHindi: 'पेंटर', icon: 'paint-brush', order: 3 },
  { id: 'carpenter', name: 'Carpenter', nameHindi: 'बढ़ई', icon: 'hammer', order: 4 },
  { id: 'welder', name: 'Welder', nameHindi: 'वेल्डर', icon: 'fire', order: 5 },
  { id: 'ac-repair', name: 'AC Repair', nameHindi: 'AC मरम्मत', icon: 'snowflake', order: 6 },
  { id: 'tv-repair', name: 'TV Repair', nameHindi: 'TV मरम्मत', icon: 'tv', order: 7 },
  { id: 'washing-machine', name: 'Washing Machine', nameHindi: 'वाशिंग मशीन', icon: 'washing', order: 8 },
];

async function seedCategories() {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-south-1',
  });

  const docClient = DynamoDBDocumentClient.from(client);
  const tableName = process.env.DYNAMODB_CATEGORIES_TABLE || 'whereismymistry-api-categories-dev';

  console.log(`Seeding categories to table: ${tableName}`);

  const items = CATEGORIES.map((category) => ({
    pk: 'CATEGORY',
    sk: category.id,
    categoryId: category.id,
    name: category.name,
    nameHindi: category.nameHindi,
    icon: category.icon,
    order: category.order,
    isActive: true,
    workerCount: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));

  try {
    await docClient.send(
      new BatchWriteCommand({
        RequestItems: {
          [tableName]: items.map((item) => ({
            PutRequest: { Item: item },
          })),
        },
      })
    );

    console.log(`Successfully seeded ${items.length} categories`);
    items.forEach((item) => {
      console.log(`  - ${item.name} (${item.nameHindi})`);
    });
  } catch (error) {
    console.error('Error seeding categories:', error);
    process.exit(1);
  }
}

seedCategories();

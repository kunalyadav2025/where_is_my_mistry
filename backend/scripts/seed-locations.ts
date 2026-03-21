import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, BatchWriteCommand } from '@aws-sdk/lib-dynamodb';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

// Sample location data for testing (Uttar Pradesh with a few districts)
const SAMPLE_LOCATIONS = {
  states: [
    { id: 'up', name: 'Uttar Pradesh', nameHindi: 'उत्तर प्रदेश', code: 'UP' },
  ],
  districts: [
    { id: 'lucknow', stateId: 'up', name: 'Lucknow', nameHindi: 'लखनऊ' },
    { id: 'varanasi', stateId: 'up', name: 'Varanasi', nameHindi: 'वाराणसी' },
    { id: 'agra', stateId: 'up', name: 'Agra', nameHindi: 'आगरा' },
  ],
  tehsils: [
    { id: 'lucknow-sadar', districtId: 'lucknow', stateId: 'up', name: 'Lucknow Sadar', nameHindi: 'लखनऊ सदर' },
    { id: 'mohanlalganj', districtId: 'lucknow', stateId: 'up', name: 'Mohanlalganj', nameHindi: 'मोहनलालगंज' },
    { id: 'varanasi-sadar', districtId: 'varanasi', stateId: 'up', name: 'Varanasi Sadar', nameHindi: 'वाराणसी सदर' },
    { id: 'agra-sadar', districtId: 'agra', stateId: 'up', name: 'Agra Sadar', nameHindi: 'आगरा सदर' },
  ],
  towns: [
    { id: 'hazratganj', tehsilId: 'lucknow-sadar', districtId: 'lucknow', stateId: 'up', name: 'Hazratganj', nameHindi: 'हज़रतगंज', pincode: '226001' },
    { id: 'gomtinagar', tehsilId: 'lucknow-sadar', districtId: 'lucknow', stateId: 'up', name: 'Gomti Nagar', nameHindi: 'गोमती नगर', pincode: '226010' },
    { id: 'aliganj', tehsilId: 'lucknow-sadar', districtId: 'lucknow', stateId: 'up', name: 'Aliganj', nameHindi: 'अलीगंज', pincode: '226024' },
    { id: 'mohanlalganj-town', tehsilId: 'mohanlalganj', districtId: 'lucknow', stateId: 'up', name: 'Mohanlalganj', nameHindi: 'मोहनलालगंज', pincode: '226301' },
    { id: 'assi-ghat', tehsilId: 'varanasi-sadar', districtId: 'varanasi', stateId: 'up', name: 'Assi Ghat', nameHindi: 'अस्सी घाट', pincode: '221005' },
    { id: 'bhelupur', tehsilId: 'varanasi-sadar', districtId: 'varanasi', stateId: 'up', name: 'Bhelupur', nameHindi: 'भेलूपुर', pincode: '221010' },
    { id: 'tajganj', tehsilId: 'agra-sadar', districtId: 'agra', stateId: 'up', name: 'Tajganj', nameHindi: 'ताजगंज', pincode: '282001' },
    { id: 'dayalbagh', tehsilId: 'agra-sadar', districtId: 'agra', stateId: 'up', name: 'Dayalbagh', nameHindi: 'दयालबाग', pincode: '282005' },
  ],
};

async function seedLocations() {
  const client = new DynamoDBClient({
    region: process.env.AWS_REGION || 'ap-south-1',
  });

  const docClient = DynamoDBDocumentClient.from(client);
  const tableName = process.env.DYNAMODB_LOCATIONS_TABLE || 'whereismymistry-api-locations-dev';

  console.log(`Seeding locations to table: ${tableName}`);

  const timestamp = new Date().toISOString();
  const items: Record<string, unknown>[] = [];

  // Add states
  SAMPLE_LOCATIONS.states.forEach((state) => {
    items.push({
      pk: 'STATE',
      sk: state.id,
      stateId: state.id,
      name: state.name,
      nameHindi: state.nameHindi,
      code: state.code,
      districtCount: SAMPLE_LOCATIONS.districts.filter((d) => d.stateId === state.id).length,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  // Add districts
  SAMPLE_LOCATIONS.districts.forEach((district) => {
    items.push({
      pk: `STATE#${district.stateId}`,
      sk: `DISTRICT#${district.id}`,
      districtId: district.id,
      stateId: district.stateId,
      name: district.name,
      nameHindi: district.nameHindi,
      tehsilCount: SAMPLE_LOCATIONS.tehsils.filter((t) => t.districtId === district.id).length,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  // Add tehsils
  SAMPLE_LOCATIONS.tehsils.forEach((tehsil) => {
    items.push({
      pk: `DISTRICT#${tehsil.districtId}`,
      sk: `TEHSIL#${tehsil.id}`,
      tehsilId: tehsil.id,
      districtId: tehsil.districtId,
      stateId: tehsil.stateId,
      name: tehsil.name,
      nameHindi: tehsil.nameHindi,
      townCount: SAMPLE_LOCATIONS.towns.filter((t) => t.tehsilId === tehsil.id).length,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  // Add towns
  SAMPLE_LOCATIONS.towns.forEach((town) => {
    items.push({
      pk: `TEHSIL#${town.tehsilId}`,
      sk: `TOWN#${town.id}`,
      townId: town.id,
      tehsilId: town.tehsilId,
      districtId: town.districtId,
      stateId: town.stateId,
      name: town.name,
      nameHindi: town.nameHindi,
      pincode: town.pincode,
      workerCount: 0,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  });

  try {
    // Batch write (max 25 items per batch)
    for (let i = 0; i < items.length; i += 25) {
      const batch = items.slice(i, i + 25);
      await docClient.send(
        new BatchWriteCommand({
          RequestItems: {
            [tableName]: batch.map((item) => ({
              PutRequest: { Item: item },
            })),
          },
        })
      );
    }

    console.log(`Successfully seeded ${items.length} location records:`);
    console.log(`  - ${SAMPLE_LOCATIONS.states.length} states`);
    console.log(`  - ${SAMPLE_LOCATIONS.districts.length} districts`);
    console.log(`  - ${SAMPLE_LOCATIONS.tehsils.length} tehsils`);
    console.log(`  - ${SAMPLE_LOCATIONS.towns.length} towns`);
  } catch (error) {
    console.error('Error seeding locations:', error);
    process.exit(1);
  }
}

seedLocations();

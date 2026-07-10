// DynamoDB テーブルが無ければ作成し、src/lib/mock-data.ts の sampleSchedule を投入する。
// 実行: node --env-file=.env.local scripts/seed-dynamodb.ts
import {
  CreateTableCommand,
  DescribeTableCommand,
  DynamoDBClient,
  ResourceNotFoundException,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { sampleSchedule } from "../src/lib/mock-data.ts";

const region = process.env.AWS_REGION;
const tableName = process.env.DYNAMODB_TABLE_NAME;

if (!region || !tableName) {
  throw new Error(
    "AWS_REGION と DYNAMODB_TABLE_NAME が未設定です。--env-file=.env.local を付けて実行してください。",
  );
}

const client = new DynamoDBClient({ region });
const docClient = DynamoDBDocumentClient.from(client);

async function ensureTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`テーブル "${tableName}" は既に存在します`);
    return;
  } catch (err) {
    if (!(err instanceof ResourceNotFoundException)) {
      throw err;
    }
  }

  console.log(`テーブル "${tableName}" を作成します...`);
  await client.send(
    new CreateTableCommand({
      TableName: tableName,
      AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
      KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
      BillingMode: "PAY_PER_REQUEST",
    }),
  );
  await waitUntilTableExists(
    { client, maxWaitTime: 60 },
    { TableName: tableName },
  );
  console.log("テーブルが ACTIVE になりました");
}

async function seed() {
  for (const item of sampleSchedule) {
    await docClient.send(new PutCommand({ TableName: tableName, Item: item }));
    console.log(`投入: ${item.id}  ${item.title}`);
  }
  console.log(`\n${sampleSchedule.length}件を投入しました`);
}

await ensureTable();
await seed();

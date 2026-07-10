import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  ScanCommand,
  type NativeAttributeValue,
} from "@aws-sdk/lib-dynamodb";
import type { ScheduleFormValues, ScheduleItem } from "@/lib/mock-data";

// DynamoDB テーブルの接続先リージョン。
// "AWS_" で始まる環境変数名は Lambda ランタイムの予約名と衝突するため
// （AWS Amplify Hosting 等では設定できない）、あえて非予約の名前にしている。
const region = process.env.DYNAMODB_REGION;

const client = new DynamoDBClient({ region });
export const docClient = DynamoDBDocumentClient.from(client);

function requireTableName(): string {
  const tableName = process.env.DYNAMODB_TABLE_NAME;
  if (!tableName) {
    throw new Error(
      "DYNAMODB_TABLE_NAME が設定されていません（.env.local を確認してください）",
    );
  }
  return tableName;
}

// テーブル全件を取得する（Scan は1回の呼び出しで最大1MB/1ページ分しか返さないため、
// LastEvaluatedKey が無くなるまでページングして全件を集める）
export async function getSchedules(): Promise<ScheduleItem[]> {
  const tableName = requireTableName();

  const items: ScheduleItem[] = [];
  let exclusiveStartKey: Record<string, NativeAttributeValue> | undefined;

  do {
    const result = await docClient.send(
      new ScanCommand({
        TableName: tableName,
        ExclusiveStartKey: exclusiveStartKey,
      }),
    );
    items.push(...((result.Items ?? []) as ScheduleItem[]));
    exclusiveStartKey = result.LastEvaluatedKey;
  } while (exclusiveStartKey);

  return items;
}

export async function createSchedule(
  values: ScheduleFormValues,
): Promise<ScheduleItem> {
  const tableName = requireTableName();
  const item: ScheduleItem = { ...values, id: crypto.randomUUID() };

  await docClient.send(new PutCommand({ TableName: tableName, Item: item }));

  return item;
}

// ScheduleForm は常に全項目を送るため、DynamoDB の UpdateCommand（部分更新）ではなく
// PutCommand でアイテムを丸ごと置き換える。既に削除された id への更新（複数タブでの
// 削除後の古い編集フォームからの送信など）を誤って再作成しないよう、
// 対象アイテムが存在する場合のみ書き込む条件を付けている
export async function updateSchedule(
  id: string,
  values: ScheduleFormValues,
): Promise<ScheduleItem> {
  const tableName = requireTableName();
  const item: ScheduleItem = { ...values, id };

  await docClient.send(
    new PutCommand({
      TableName: tableName,
      Item: item,
      ConditionExpression: "attribute_exists(id)",
    }),
  );

  return item;
}

export async function deleteSchedule(id: string): Promise<void> {
  const tableName = requireTableName();

  await docClient.send(
    new DeleteCommand({ TableName: tableName, Key: { id } }),
  );
}

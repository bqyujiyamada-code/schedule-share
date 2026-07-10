import type { CategoryId } from "@/lib/categories";

export type ScheduleLocation = {
  name: string;
  address: string;
  // Google Places Autocomplete で候補を選択した場合のみ設定される（地図アプリを開く際の座標検索に使用）
  lat?: number;
  lng?: number;
};

export type ScheduleItem = {
  // DynamoDB のパーティションキー（String）。crypto.randomUUID() で発行する
  id: string;
  title: string;
  categoryId: CategoryId;
  startDate: string; // YYYY-MM-DD。単日の予定は startDate === endDate
  endDate: string; // YYYY-MM-DD。遠征など複数日にまたがる予定向け
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  location: ScheduleLocation;
  notes?: string;
};

// 予定の作成・編集フォームが扱う値の集合（id を除いた ScheduleItem）
export type ScheduleFormValues = Omit<ScheduleItem, "id">;

export const sampleSchedule: ScheduleItem[] = [
  {
    id: "f17ed855-4153-4236-9fc8-1bcaf7303fc0",
    title: "練習試合 (vs FC札幌)",
    categoryId: "soccer",
    startDate: "2026-07-10",
    endDate: "2026-07-10",
    startTime: "10:00",
    endTime: "12:00",
    location: {
      name: "札幌市厚別公園競技場",
      address: "北海道札幌市厚別区厚別中央1条5丁目",
      lat: 43.0645,
      lng: 141.4696,
    },
  },
  {
    id: "18a7e7a4-2bf6-4010-abe3-75843f0b9437",
    title: "チーム全体練習",
    categoryId: "soccer",
    startDate: "2026-07-12",
    endDate: "2026-07-12",
    startTime: "16:00",
    endTime: "18:00",
    location: {
      name: "豊平川河川敷グラウンド",
      address: "北海道札幌市豊平区豊平川緑地",
    },
  },
  {
    id: "c2f167b7-2ee7-41d6-b92b-8dde93acd876",
    title: "夏季カップ戦 1回戦",
    categoryId: "soccer",
    startDate: "2026-08-02",
    endDate: "2026-08-02",
    startTime: "09:00",
    endTime: "11:00",
    location: {
      name: "円山総合運動場",
      address: "北海道札幌市中央区宮ヶ丘3丁目",
    },
  },
  {
    id: "736e3bdb-f7db-4350-afec-e5f4361b0e1e",
    title: "リーグ公式戦 第4節",
    categoryId: "soccer",
    startDate: "2026-09-06",
    endDate: "2026-09-06",
    startTime: "13:00",
    endTime: "15:00",
    location: {
      name: "サッポロさとらんど競技場",
      address: "北海道札幌市東区丘珠町",
    },
  },
  {
    id: "9c442018-a97e-4809-9522-88ed8836f595",
    title: "昇級審査",
    categoryId: "shorinji_kempo",
    startDate: "2026-07-19",
    endDate: "2026-07-19",
    startTime: "13:00",
    endTime: "16:00",
    location: {
      name: "札幌市中央体育館",
      address: "北海道札幌市中央区南7条西10丁目",
    },
  },
  {
    id: "4331c8f3-99b2-4958-89c5-24edeb533a28",
    title: "発表会リハーサル",
    categoryId: "ballet",
    startDate: "2026-07-25",
    endDate: "2026-07-25",
    startTime: "14:00",
    endTime: "17:00",
    location: {
      name: "札幌市民ホール",
      address: "北海道札幌市中央区北1条西1丁目",
    },
  },
  {
    id: "f2da0763-d036-4067-80b5-fe673b7855c1",
    title: "夏期講習 第1回",
    categoryId: "cram_school",
    startDate: "2026-08-10",
    endDate: "2026-08-10",
    startTime: "18:30",
    endTime: "20:30",
    location: {
      name: "学習塾さっぽろ校",
      address: "北海道札幌市北区北24条西5丁目",
    },
  },
  {
    id: "9d1dab24-da44-461c-b4d1-2c462a361cab",
    title: "運動会",
    categoryId: "school_event",
    startDate: "2026-09-13",
    endDate: "2026-09-13",
    startTime: "09:00",
    endTime: "14:00",
    location: {
      name: "市立札幌小学校",
      address: "北海道札幌市白石区東札幌3条1丁目",
    },
  },
  {
    id: "26358e57-cb8f-41f9-809d-0b372ea75546",
    title: "家族の通院",
    categoryId: "other",
    startDate: "2026-07-22",
    endDate: "2026-07-22",
    startTime: "15:00",
    endTime: "16:00",
    location: {
      name: "さっぽろ内科クリニック",
      address: "北海道札幌市豊平区豊平4条5丁目",
    },
  },
  {
    id: "fa9d0a52-92f0-4b84-aa3d-86f4579d81b5",
    title: "遠征: 道東カップ",
    categoryId: "soccer",
    startDate: "2026-08-15",
    endDate: "2026-08-16",
    startTime: "08:00",
    endTime: "17:00",
    location: {
      name: "釧路市総合運動公園",
      address: "北海道釧路市広里6",
    },
    notes: "前日夕方に集合しバスで移動。宿泊は現地チーム手配のホテル。",
  },
];

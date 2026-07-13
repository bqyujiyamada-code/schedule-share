"use client";

import { useMemo, useState } from "react";
import type { ScheduleFormValues, ScheduleItem } from "@/lib/mock-data";
import { ScheduleCard } from "@/components/ScheduleCard";

function monthKey(date: string) {
  return date.slice(0, 7); // "YYYY-MM"
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function todayDateKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function shiftMonth(key: string, delta: number) {
  const [year, month] = key.split("-").map(Number);
  const d = new Date(year, month - 1 + delta, 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// 前月/次月ボタンと年月フィールドを兼ねる中央のネイティブ input[type=month]。
// タップするとOS標準の年月ピッカーが開くため、遠い年月へも一手でジャンプできる。
const monthFieldClassName =
  "min-h-12 min-w-0 flex-1 rounded-full bg-secondary-container px-4 text-center text-sm font-medium text-on-secondary-container shadow-sm outline-none transition-[background-color,color,box-shadow] duration-200 ease-standard";

// M3 標準アイコンボタン。48px 角で確保しモバイルでも押しやすくする
const iconButtonClassName =
  "flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-[background-color,transform] duration-200 ease-standard hover:bg-surface-container-high active:scale-90";

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true" className="h-5 w-5">
      <path
        d={direction === "left" ? "M12.5 4.5l-6 5.5l6 5.5" : "M7.5 4.5l6 5.5l-6 5.5"}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ScheduleBoardProps = {
  schedule: ScheduleItem[];
  onUpdate: (id: string, values: ScheduleFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function ScheduleBoard({
  schedule,
  onUpdate,
  onDelete,
}: ScheduleBoardProps) {
  const sorted = useMemo(
    () =>
      [...schedule].sort((a, b) =>
        `${a.startDate}T${a.startTime}`.localeCompare(
          `${b.startDate}T${b.startTime}`,
        ),
      ),
    [schedule],
  );

  // デフォルトは当月表示。前月/次月ボタンと年月ピッカーで月を移動する。
  const [month, setMonth] = useState<string>(() => currentMonthKey());
  // デフォルトは終了済みの予定を隠す（今月半ばに今月を見るとき、月初の終了済み予定を
  // スクロールで避けなければならない煩わしさを解消するため）。オンで過去分も含めて表示
  const [showPast, setShowPast] = useState(false);

  const monthItems = useMemo(
    () => sorted.filter((item) => monthKey(item.startDate) === month),
    [sorted, month],
  );

  const filtered = useMemo(() => {
    if (showPast) return monthItems;
    const today = todayDateKey();
    return monthItems.filter((item) => item.endDate >= today);
  }, [monthItems, showPast]);

  return (
    <div>
      {/* 一覧が長くなってもスクロールで隠れないよう、絞り込みバーは上端に固定 */}
      <div className="sticky top-0 z-10 -mx-6 border-b border-outline-variant bg-background px-6 py-3 sm:-mx-10 sm:px-10">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, -1))}
            aria-label="前の月"
            className={iconButtonClassName}
          >
            <ChevronIcon direction="left" />
          </button>

          <input
            type="month"
            aria-label="表示する年月"
            value={month}
            onChange={(e) => e.target.value && setMonth(e.target.value)}
            className={monthFieldClassName}
          />

          <button
            type="button"
            onClick={() => setMonth(shiftMonth(month, 1))}
            aria-label="次の月"
            className={iconButtonClassName}
          >
            <ChevronIcon direction="right" />
          </button>
        </div>

        <label className="mt-2 flex min-h-10 items-center justify-between gap-3 px-1">
          <span className="text-sm text-on-surface-variant">
            終了済みの予定も表示する
          </span>
          <span className="relative inline-flex h-8 w-14 shrink-0 items-center">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              className="peer sr-only"
            />
            <span className="absolute inset-0 rounded-full border-2 border-outline bg-surface-container-highest transition-colors duration-200 ease-standard peer-checked:border-primary peer-checked:bg-primary" />
            <span className="relative z-10 ml-1 h-6 w-6 rounded-full bg-outline shadow-sm transition-transform duration-200 ease-standard peer-checked:translate-x-6 peer-checked:bg-on-primary" />
          </span>
        </label>
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-sm text-on-surface-variant">
          {monthItems.length > 0
            ? "この月の予定はすべて終了済みです。上のスイッチをオンにすると表示されます。"
            : "この月の予定はありません。"}
        </p>
      ) : (
        <ul className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          {filtered.map((item) => (
            <ScheduleCard
              key={item.id}
              item={item}
              onUpdate={onUpdate}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { categoryLabels, categoryStyles } from "@/lib/categories";
import type {
  ScheduleFormValues,
  ScheduleItem,
  ScheduleLocation,
} from "@/lib/mock-data";
import { ScheduleForm } from "@/components/ScheduleForm";

const weekdayLabels = ["日", "月", "火", "水", "木", "金", "土"];

function formatDate(date: string) {
  const d = new Date(`${date}T00:00:00`);
  return `${d.getMonth() + 1}/${d.getDate()}(${weekdayLabels[d.getDay()]})`;
}

function formatDateRange(startDate: string, endDate: string) {
  return startDate === endDate
    ? formatDate(startDate)
    : `${formatDate(startDate)}–${formatDate(endDate)}`;
}

// 座標が登録されていればピンポイントで、無ければ地点名+住所で検索する。
// APIキー不要の Google マップ検索リンク形式。
function buildMapsUrl(location: ScheduleLocation) {
  const query =
    location.lat != null && location.lng != null
      ? `${location.lat},${location.lng}`
      : `${location.name} ${location.address}`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

function toFormValues(item: ScheduleItem): ScheduleFormValues {
  return {
    title: item.title,
    categoryId: item.categoryId,
    startDate: item.startDate,
    endDate: item.endDate,
    startTime: item.startTime,
    endTime: item.endTime,
    location: item.location,
    notes: item.notes,
  };
}

function CategoryBadge({ item }: { item: ScheduleItem }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${categoryStyles[item.categoryId]}`}
    >
      {categoryLabels[item.categoryId]}
    </span>
  );
}

type ScheduleCardProps = {
  item: ScheduleItem;
  onUpdate: (id: string, values: ScheduleFormValues) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
};

export function ScheduleCard({ item, onUpdate, onDelete }: ScheduleCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  function openDetail() {
    setMode("view");
    setConfirmingDelete(false);
    setDeleteError(null);
    setIsOpen(true);
  }

  async function handleUpdate(values: ScheduleFormValues) {
    await onUpdate(item.id, values);
    setMode("view");
    setIsOpen(false);
  }

  async function handleDelete() {
    setDeleteError(null);
    setIsDeleting(true);
    try {
      await onDelete(item.id);
      setIsOpen(false);
    } catch {
      setDeleteError("削除に失敗しました。もう一度お試しください。");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <li>
      <button
        type="button"
        onClick={openDetail}
        className="w-full rounded-3xl bg-surface-container-high p-5 text-left shadow-sm transition-shadow duration-300 ease-standard hover:shadow-md"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <CategoryBadge item={item} />
            <h3 className="mt-2 text-base font-semibold text-on-surface">
              {item.title}
            </h3>
          </div>
          <div className="shrink-0 text-right text-sm text-on-surface-variant">
            <div className="font-medium text-on-surface">
              {formatDateRange(item.startDate, item.endDate)}
            </div>
            <div>
              {item.startTime}–{item.endTime}
            </div>
          </div>
        </div>

        <div className="mt-4 border-t border-outline-variant pt-3 text-sm text-on-surface-variant">
          <div className="font-medium text-on-surface">
            {item.location.name}
          </div>
          <div>{item.location.address}</div>
        </div>
      </button>

      {/* 詳細ボトムシート: スクリム + 下から迫り上がるパネル（AddScheduleToggle と同じ形式） */}
      <div
        className={`fixed inset-0 z-40 transition-[opacity,visibility] duration-300 ease-standard ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <div
          className="absolute inset-0 bg-black/40"
          onClick={() => setIsOpen(false)}
        />

        <div
          className={`absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface-container shadow-lg transition-transform duration-300 ease-emphasized-decelerate ${
            isOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-outline-variant" />

          <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="mb-4 flex items-start justify-between gap-3">
              <div>
                <CategoryBadge item={item} />
                <h2 className="mt-2 text-lg font-semibold text-on-surface">
                  {item.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="閉じる"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-on-surface-variant transition-colors duration-200 ease-standard hover:bg-surface-container-high"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            {mode === "edit" ? (
              <ScheduleForm
                initialValues={toFormValues(item)}
                submitLabel="保存する"
                onSubmit={handleUpdate}
                onCancel={() => setMode("view")}
              />
            ) : (
              <>
                <dl className="flex flex-col gap-3 text-sm">
                  <div>
                    <dt className="text-xs font-medium tracking-wide text-on-surface-variant">
                      日付
                    </dt>
                    <dd className="text-on-surface">
                      {formatDateRange(item.startDate, item.endDate)}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium tracking-wide text-on-surface-variant">
                      時間
                    </dt>
                    <dd className="text-on-surface">
                      {item.startTime}–{item.endTime}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs font-medium tracking-wide text-on-surface-variant">
                      開催場所
                    </dt>
                    <dd className="text-on-surface">{item.location.name}</dd>
                    <dd className="text-on-surface-variant">
                      {item.location.address}
                    </dd>
                  </div>

                  {item.notes && (
                    <div>
                      <dt className="text-xs font-medium tracking-wide text-on-surface-variant">
                        メモ
                      </dt>
                      <dd className="whitespace-pre-line text-on-surface">
                        {item.notes}
                      </dd>
                    </div>
                  )}
                </dl>

                <a
                  href={buildMapsUrl(item.location)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-5 flex h-11 w-full items-center justify-center rounded-full bg-primary-container px-6 text-sm font-medium text-on-primary-container shadow-sm transition-[transform,box-shadow,filter] duration-300 ease-emphasized hover:shadow-md hover:brightness-95 active:scale-95 dark:hover:brightness-110 sm:w-auto"
                >
                  地図アプリで開く
                </a>

                {confirmingDelete ? (
                  <div className="mt-5 flex flex-col gap-3 rounded-2xl bg-error-container p-4">
                    <p className="text-sm text-on-error-container">
                      この予定を削除します。よろしいですか？
                    </p>
                    {deleteError && (
                      <p className="text-sm text-on-error-container" role="alert">
                        {deleteError}
                      </p>
                    )}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleDelete}
                        disabled={isDeleting}
                        className="flex h-10 flex-1 items-center justify-center rounded-full bg-error text-sm font-medium text-on-error transition-[transform,box-shadow] duration-200 ease-standard active:scale-95 disabled:opacity-60 disabled:active:scale-100"
                      >
                        {isDeleting ? "削除中…" : "削除する"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setConfirmingDelete(false)}
                        disabled={isDeleting}
                        className="flex h-10 flex-1 items-center justify-center rounded-full border border-outline text-sm font-medium text-on-surface-variant transition-colors duration-200 ease-standard hover:bg-surface-container-high disabled:opacity-60"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="mt-5 flex gap-3">
                    <button
                      type="button"
                      onClick={() => setMode("edit")}
                      className="flex h-11 flex-1 items-center justify-center rounded-full border border-outline text-sm font-medium text-on-surface transition-colors duration-200 ease-standard hover:bg-surface-container-high"
                    >
                      編集
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmingDelete(true)}
                      className="flex h-11 flex-1 items-center justify-center rounded-full bg-error-container text-sm font-medium text-on-error-container transition-colors duration-200 ease-standard hover:brightness-95 dark:hover:brightness-110"
                    >
                      削除
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </li>
  );
}

"use client";

import { useState } from "react";
import { categories, type CategoryId } from "@/lib/categories";
import type { ScheduleFormValues } from "@/lib/mock-data";
import {
  LocationAutocomplete,
  type SelectedPlace,
} from "@/components/LocationAutocomplete";

type ScheduleFormProps = {
  // 指定すると編集モード（各欄をこの値で初期化）。未指定なら新規追加モード
  initialValues?: ScheduleFormValues;
  submitLabel: string;
  onSubmit: (values: ScheduleFormValues) => Promise<void>;
  onCancel?: () => void;
};

// M3 filled text field: tonal container, bottom indicator, small-top shape
const inputClassName =
  "rounded-t-lg border-b-2 border-outline bg-surface-container-highest px-4 py-2.5 text-on-surface outline-none transition-colors duration-200 ease-standard placeholder:text-on-surface-variant/70 focus:border-primary";

const labelClassName =
  "text-xs font-medium tracking-wide text-on-surface-variant";

export function ScheduleForm({
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
}: ScheduleFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [categoryId, setCategoryId] = useState<CategoryId>(
    initialValues?.categoryId ?? categories[0].id,
  );
  const [startDate, setStartDate] = useState(initialValues?.startDate ?? "");
  const [endDate, setEndDate] = useState(initialValues?.endDate ?? "");
  // 新規追加時は終了日を開始日に追従させる。編集時は既存の終了日を尊重し追従させない
  const [endDateTouched, setEndDateTouched] = useState(
    initialValues != null,
  );
  const [startTime, setStartTime] = useState(initialValues?.startTime ?? "");
  const [endTime, setEndTime] = useState(initialValues?.endTime ?? "");
  const [locationName, setLocationName] = useState(
    initialValues?.location.name ?? "",
  );
  const [address, setAddress] = useState(initialValues?.location.address ?? "");
  // 候補選択時に地図APIから自動取得（背後で保持するだけでUIには出さない）
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    initialValues?.location.lat != null && initialValues?.location.lng != null
      ? { lat: initialValues.location.lat, lng: initialValues.location.lng }
      : null,
  );
  const [notes, setNotes] = useState(initialValues?.notes ?? "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<"title" | "locationName" | "address" | "endDate" | "endTime", string>>
  >({});

  function clearFieldError(field: keyof typeof fieldErrors) {
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  }

  function validate(): typeof fieldErrors {
    const errors: typeof fieldErrors = {};
    if (title.trim() === "") {
      errors.title = "タイトルを入力してください";
    }
    if (locationName.trim() === "") {
      errors.locationName = "候補一覧から開催場所を選択してください";
    }
    if (address.trim() === "") {
      errors.address = "住所を入力してください";
    }
    if (startDate && endDate && endDate < startDate) {
      errors.endDate = "終了日は開始日以降にしてください";
    }
    if (
      startDate &&
      endDate &&
      startDate === endDate &&
      startTime &&
      endTime &&
      endTime <= startTime
    ) {
      errors.endTime = "終了時間は開始時間より後にしてください";
    }
    return errors;
  }

  function handlePlaceSelected(place: SelectedPlace) {
    setLocationName(place.name);
    setAddress(place.address);
    setCoords({ lat: place.lat, lng: place.lng });
    clearFieldError("locationName");
  }

  function handleStartDateChange(value: string) {
    setStartDate(value);
    if (!endDateTouched) {
      setEndDate(value);
    }
  }

  function handleEndDateChange(value: string) {
    setEndDate(value);
    setEndDateTouched(true);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitError(null);
    setIsSubmitting(true);

    try {
      await onSubmit({
        title,
        categoryId,
        startDate,
        endDate,
        startTime,
        endTime,
        location: {
          name: locationName,
          address,
          lat: coords?.lat,
          lng: coords?.lng,
        },
        notes: notes === "" ? undefined : notes,
      });
    } catch {
      setSubmitError("保存に失敗しました。もう一度お試しください。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="title" className={labelClassName}>
          タイトル
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            clearFieldError("title");
          }}
          placeholder="例: 練習試合 (vs FC札幌)"
          aria-invalid={fieldErrors.title != null}
          className={inputClassName}
        />
        {fieldErrors.title && (
          <p className="text-xs text-error" role="alert">
            {fieldErrors.title}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="category" className={labelClassName}>
          カテゴリ
        </label>
        <select
          id="category"
          name="category"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value as CategoryId)}
          className={inputClassName}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="startDate" className={labelClassName}>
            開始日
          </label>
          <input
            id="startDate"
            name="startDate"
            type="date"
            required
            value={startDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="endDate" className={labelClassName}>
            終了日
          </label>
          <input
            id="endDate"
            name="endDate"
            type="date"
            required
            min={startDate || undefined}
            value={endDate}
            onChange={(e) => {
              handleEndDateChange(e.target.value);
              clearFieldError("endDate");
            }}
            aria-invalid={fieldErrors.endDate != null}
            className={inputClassName}
          />
          {fieldErrors.endDate && (
            <p className="text-xs text-error" role="alert">
              {fieldErrors.endDate}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="startTime" className={labelClassName}>
            開始時間
          </label>
          <input
            id="startTime"
            name="startTime"
            type="time"
            required
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className={inputClassName}
          />
        </div>

        <div className="flex flex-1 flex-col gap-1">
          <label htmlFor="endTime" className={labelClassName}>
            終了時間
          </label>
          <input
            id="endTime"
            name="endTime"
            type="time"
            required
            value={endTime}
            onChange={(e) => {
              setEndTime(e.target.value);
              clearFieldError("endTime");
            }}
            aria-invalid={fieldErrors.endTime != null}
            className={inputClassName}
          />
          {fieldErrors.endTime && (
            <p className="text-xs text-error" role="alert">
              {fieldErrors.endTime}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <LocationAutocomplete
          id="locationName"
          label="開催場所"
          placeholder="例: 円山総合運動場"
          initialValue={initialValues?.location.name}
          onSelect={handlePlaceSelected}
        />
        {fieldErrors.locationName && (
          <p className="text-xs text-error" role="alert">
            {fieldErrors.locationName}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="address" className={labelClassName}>
          住所
        </label>
        <input
          id="address"
          name="address"
          type="text"
          required
          value={address}
          onChange={(e) => {
            setAddress(e.target.value);
            setCoords(null);
            clearFieldError("address");
          }}
          placeholder="例: 北海道札幌市中央区宮ヶ丘3丁目"
          aria-invalid={fieldErrors.address != null}
          className={inputClassName}
        />
        {fieldErrors.address && (
          <p className="text-xs text-error" role="alert">
            {fieldErrors.address}
          </p>
        )}
        <p className="text-xs text-on-surface-variant">
          上の開催場所欄で候補を選択すると自動入力されます（座標も裏で登録）。ここを手で書き換えた場合は住所文字列での検索になります。
        </p>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="notes" className={labelClassName}>
          メモ（任意）
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="例: 前日集合、バス移動あり"
          className={`${inputClassName} resize-none`}
        />
      </div>

      {submitError && (
        <p className="text-sm text-error" role="alert">
          {submitError}
        </p>
      )}

      <div className="mt-1 flex gap-3">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex h-11 flex-1 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-on-primary shadow-sm transition-[transform,box-shadow,filter] duration-300 ease-emphasized hover:shadow-md hover:brightness-95 active:scale-95 disabled:opacity-60 disabled:active:scale-100 dark:hover:brightness-110 sm:flex-initial"
        >
          {isSubmitting ? "保存中…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="flex h-11 flex-1 items-center justify-center rounded-full border border-outline px-6 text-sm font-medium text-on-surface-variant transition-colors duration-200 ease-standard hover:bg-surface-container-high disabled:opacity-60 sm:flex-initial"
          >
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}

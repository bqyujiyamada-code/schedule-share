"use client";

import { useEffect, useRef, useState } from "react";
import { loadPlacesLibrary } from "@/lib/google-maps";

export type SelectedPlace = {
  name: string;
  address: string;
  lat: number;
  lng: number;
};

type LocationAutocompleteProps = {
  id: string;
  label: string;
  placeholder?: string;
  // 編集モードなど、既存の場所名を初期表示したい場合に指定
  initialValue?: string;
  onSelect: (place: SelectedPlace) => void;
};

const fieldClassName =
  "rounded-t-lg border-b-2 border-outline bg-surface-container-highest px-4 py-2.5 text-on-surface outline-none transition-colors duration-200 ease-standard placeholder:text-on-surface-variant/70 focus:border-primary";

const labelClassName =
  "text-xs font-medium tracking-wide text-on-surface-variant";

export function LocationAutocomplete({
  id,
  label,
  placeholder,
  initialValue,
  onSelect,
}: LocationAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // エフェクト再実行のたびにリスナーを張り直したくないので ref 経由で最新の関数を参照する
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    let cancelled = false;
    let element: google.maps.places.PlaceAutocompleteElement | null = null;

    // addEventListener の型がクラス固有オーバーロードに解決されないため、
    // Event で受けて実体（'gmp-select' の PlacePredictionSelectEvent）へキャストする
    async function handleSelect(event: Event) {
      const { placePrediction } =
        event as google.maps.places.PlacePredictionSelectEvent;
      const prediction = placePrediction.toPlace();
      const { place } = await prediction.fetchFields({
        fields: ["displayName", "formattedAddress", "location"],
      });
      if (!place.location) return;
      onSelectRef.current({
        name: place.displayName ?? "",
        address: place.formattedAddress ?? "",
        lat: place.location.lat(),
        lng: place.location.lng(),
      });
    }

    loadPlacesLibrary()
      .then((places) => {
        if (cancelled || !containerRef.current) return;
        element = new places.PlaceAutocompleteElement({
          requestedLanguage: "ja",
          requestedRegion: "jp",
          placeholder,
          value: initialValue,
        });
        element.id = id;
        element.className = fieldClassName;
        element.addEventListener("gmp-select", handleSelect);
        containerRef.current.appendChild(element);
        setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
      if (element) {
        element.removeEventListener("gmp-select", handleSelect);
        element.remove();
      }
    };
  }, [id, placeholder, initialValue]);

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor={id} className={labelClassName}>
        {label}
      </label>
      <div ref={containerRef} />
      {status === "loading" && (
        <p className="text-xs text-on-surface-variant">読み込み中…</p>
      )}
      {status === "error" && (
        <p className="text-xs text-error">
          候補検索を読み込めませんでした。下の開催場所・住所欄に直接入力してください。
        </p>
      )}
    </div>
  );
}

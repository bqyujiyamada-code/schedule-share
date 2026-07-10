"use client";

import { useEffect, useState } from "react";
import { ScheduleForm } from "@/components/ScheduleForm";
import type { ScheduleFormValues } from "@/lib/mock-data";

type AddScheduleToggleProps = {
  onAdd: (values: ScheduleFormValues) => Promise<void>;
};

export function AddScheduleToggle({ onAdd }: AddScheduleToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  // シートを閉じるたびに変えることで ScheduleForm を再マウントし、次回開いたときに空欄に戻す
  const [formKey, setFormKey] = useState(0);

  function close() {
    setIsOpen(false);
    setFormKey((key) => key + 1);
  }

  async function handleAdd(values: ScheduleFormValues) {
    await onAdd(values);
    close();
  }

  // ボトムシート表示中は背後のスクロールを止める（ネイティブアプリのモーダルに近い挙動）
  useEffect(() => {
    if (!isOpen) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [isOpen]);

  return (
    <>
      {/* M3 Expressive FAB: rounded-square shape (not a circle), container color, state-layer press。
          画面右下に固定し、一覧をどれだけスクロールしても常に片手で押せる位置に置く */}
      <button
        type="button"
        onClick={() => (isOpen ? close() : setIsOpen(true))}
        aria-expanded={isOpen}
        aria-label="予定を追加"
        className="fixed right-6 bottom-[calc(1.5rem+env(safe-area-inset-bottom))] z-50 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container shadow-md transition-[transform,box-shadow] duration-300 ease-emphasized hover:shadow-lg hover:brightness-95 active:scale-90 dark:hover:brightness-110"
      >
        <span
          className={`text-2xl leading-none transition-transform duration-300 ease-emphasized ${
            isOpen ? "rotate-45" : ""
          }`}
        >
          +
        </span>
      </button>

      {/* ボトムシート: スクリム + 下から迫り上がるパネル */}
      <div
        className={`fixed inset-0 z-40 transition-[opacity,visibility] duration-300 ease-standard ${
          isOpen ? "visible opacity-100" : "invisible opacity-0"
        }`}
        aria-hidden={!isOpen}
      >
        <div className="absolute inset-0 bg-black/40" onClick={close} />

        <div
          className={`absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl bg-surface-container shadow-lg transition-transform duration-300 ease-emphasized-decelerate ${
            isOpen ? "translate-y-0" : "translate-y-full"
          }`}
        >
          <div className="mx-auto mt-3 h-1 w-10 shrink-0 rounded-full bg-outline-variant" />

          <div className="p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))]">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-on-surface">
                予定を追加
              </h2>
              <button
                type="button"
                onClick={close}
                aria-label="閉じる"
                className="flex h-10 w-10 items-center justify-center rounded-full text-on-surface-variant transition-colors duration-200 ease-standard hover:bg-surface-container-high"
              >
                <span className="text-xl leading-none">×</span>
              </button>
            </div>

            <ScheduleForm
              key={formKey}
              submitLabel="追加する"
              onSubmit={handleAdd}
            />
          </div>
        </div>
      </div>
    </>
  );
}

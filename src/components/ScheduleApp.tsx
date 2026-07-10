"use client";

import { useState } from "react";
import type { ScheduleFormValues, ScheduleItem } from "@/lib/mock-data";
import { ScheduleBoard } from "@/components/ScheduleBoard";
import { AddScheduleToggle } from "@/components/AddScheduleToggle";
import {
  addScheduleAction,
  deleteScheduleAction,
  updateScheduleAction,
} from "@/lib/actions";

type ScheduleAppProps = {
  initialSchedule: ScheduleItem[];
};

// 予定の状態をここで一元管理する。各操作は Server Action 経由で DynamoDB に書き込み、
// その結果（サーバー側の確定値）でクライアント側の一覧を更新する
export function ScheduleApp({ initialSchedule }: ScheduleAppProps) {
  const [schedule, setSchedule] = useState(initialSchedule);

  async function handleAdd(values: ScheduleFormValues) {
    const created = await addScheduleAction(values);
    setSchedule((prev) => [...prev, created]);
  }

  async function handleUpdate(id: string, values: ScheduleFormValues) {
    const updated = await updateScheduleAction(id, values);
    setSchedule((prev) =>
      prev.map((item) => (item.id === id ? updated : item)),
    );
  }

  async function handleDelete(id: string) {
    await deleteScheduleAction(id);
    setSchedule((prev) => prev.filter((item) => item.id !== id));
  }

  return (
    <>
      <ScheduleBoard
        schedule={schedule}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
      />
      <AddScheduleToggle onAdd={handleAdd} />
    </>
  );
}

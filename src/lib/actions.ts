"use server";

import { createSchedule, deleteSchedule, updateSchedule } from "@/lib/db";
import type { ScheduleFormValues, ScheduleItem } from "@/lib/mock-data";
import { revalidatePath } from "next/cache";

export async function addScheduleAction(
  values: ScheduleFormValues,
): Promise<ScheduleItem> {
  const item = await createSchedule(values);
  revalidatePath("/");
  return item;
}

export async function updateScheduleAction(
  id: string,
  values: ScheduleFormValues,
): Promise<ScheduleItem> {
  const item = await updateSchedule(id, values);
  revalidatePath("/");
  return item;
}

export async function deleteScheduleAction(id: string): Promise<void> {
  await deleteSchedule(id);
  revalidatePath("/");
}

import { getSchedules } from "@/lib/db";
import { ScheduleApp } from "@/components/ScheduleApp";

// 予定は DynamoDB から取得する（常に最新の状態を出すため静的キャッシュしない）
export const dynamic = "force-dynamic";

function CalendarMark() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className="h-6 w-6">
      <rect
        x="4"
        y="5"
        width="16"
        height="15"
        rx="3"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M8 3v4M16 3v4M4 10h16"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export default async function Home() {
  const schedule = await getSchedules();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 bg-background px-6 pt-10 pb-[calc(6rem+env(safe-area-inset-bottom))] text-on-background sm:px-10">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary-container text-on-primary-container">
          <CalendarMark />
        </span>
        <h1 className="text-3xl font-semibold tracking-tight text-on-surface">
          Schedule Share
        </h1>
      </div>

      <div className="mt-8">
        <ScheduleApp initialSchedule={schedule} />
      </div>
    </main>
  );
}

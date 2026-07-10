// カテゴリに割り当てられる配色ロール。M3 のコンテナ色から選ぶ固定パレット。
// error は状態表示（エラー/警告）用に予約されているためカテゴリ配色には使わない。
// neutral は「その他」など、特定の色を持たないカテゴリ向けの中立色。
const categoryColorRoleStyles = {
  primary: "bg-primary-container text-on-primary-container",
  secondary: "bg-secondary-container text-on-secondary-container",
  tertiary: "bg-tertiary-container text-on-tertiary-container",
  quaternary: "bg-quaternary-container text-on-quaternary-container",
  quinary: "bg-quinary-container text-on-quinary-container",
  neutral: "bg-surface-variant text-on-surface-variant",
} as const satisfies Record<string, string>;

export type CategoryColorRole = keyof typeof categoryColorRoleStyles;

export type Category = {
  id: string;
  label: string;
  colorRole: CategoryColorRole;
};

// カテゴリの追加・変更はこの配列を編集するだけでよい。
// 新規カテゴリは末尾に { id, label, colorRole } を1件追加する。
// colorRole は上の5色から未使用のものを選ぶか、使い切っている場合は "neutral" を指定する
// （固有の色が必要なら globals.css に新しいコンテナ色ロールを追加したうえで
//  categoryColorRoleStyles に1行足す）。
export const categories = [
  { id: "soccer", label: "サッカー", colorRole: "primary" },
  { id: "shorinji_kempo", label: "少林寺", colorRole: "secondary" },
  { id: "ballet", label: "バレエ", colorRole: "tertiary" },
  { id: "cram_school", label: "塾", colorRole: "quaternary" },
  { id: "school_event", label: "学校行事", colorRole: "quinary" },
  { id: "other", label: "その他", colorRole: "neutral" },
] as const satisfies readonly Category[];

export type CategoryId = (typeof categories)[number]["id"];

export const categoryLabels: Record<CategoryId, string> = Object.fromEntries(
  categories.map((c) => [c.id, c.label]),
) as Record<CategoryId, string>;

export const categoryStyles: Record<CategoryId, string> = Object.fromEntries(
  categories.map((c) => [c.id, categoryColorRoleStyles[c.colorRole]]),
) as Record<CategoryId, string>;

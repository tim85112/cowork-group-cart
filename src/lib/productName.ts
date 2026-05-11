/**
 * 解析「主名稱【餐廳名】」格式
 * 例如：「招牌古早味排骨飯【8私廚小餐館】」→ { main: '招牌古早味排骨飯', bracket: '8私廚小餐館' }
 * 若沒有【】格式：回傳原文，bracket 為 null（向後相容、零風險）
 */
export function splitFoodName(name: string): { main: string; bracket: string | null } {
  if (!name) return { main: '', bracket: null };
  const m = name.match(/^(.+?)\s*【(.+?)】\s*$/);
  if (m) return { main: m[1].trim(), bracket: m[2].trim() };
  return { main: name, bracket: null };
}

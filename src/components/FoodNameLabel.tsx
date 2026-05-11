import { splitFoodName } from '@/lib/productName';

interface Props {
  name: string;
  /** 主名稱 className */
  className?: string;
  /** 【餐廳名】className；預設小一級灰色 */
  bracketClassName?: string;
}

/**
 * 把「主名稱【餐廳名】」拆開顯示，餐廳名用小一級字體 + 灰色。
 * 若 name 沒有【】格式則直接顯示原文。
 *
 * 用 text-[0.75em] 相對單位，無論父層字級大小，餐廳名自動 75% 比例。
 */
export function FoodNameLabel({
  name,
  className = '',
  bracketClassName = 'text-[0.75em] text-gray-400 ml-1 font-normal'
}: Props) {
  const { main, bracket } = splitFoodName(name);
  return (
    <>
      <span className={className}>{main}</span>
      {bracket && <span className={bracketClassName}>【{bracket}】</span>}
    </>
  );
}

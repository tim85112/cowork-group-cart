export interface Product {
  food_name: string;
  food_label: string;
  price: number;
  spec1: string;
  spec2: string;
  image_url: string;
  description: string;
  restaurant_name: string;
  product_url: string;
}

export const CATEGORIES = [
  '駝健康',
  '駝麵食',
  '駝飯盒',
  '駝小吃',
  '駝日韓',
  '駝高檔',
  '駝西式',
  '駝素食',
  '駝甜點',
  '駝飲料'
] as const;

export type Category = (typeof CATEGORIES)[number];

import { ProductType, SizeType } from "@amavie/database/browser";

export const PRODUCTS_CACHE_TAG = "products";

export const LETTER_SIZES = [
  "XXS",
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "XXL",
  "XXXL",
] as const;

export const NUMERIC_SIZES = [
  "32",
  "34",
  "36",
  "38",
  "40",
  "42",
  "44",
  "46",
  "48",
  "50",
  "52",
  "54",
  "56",
  "58",
  "60",
  "62",
  "64",
] as const;

export const MODEL_NUMBER_PATTERN = /^\d\.\d{4} [A-Za-z]\d$/;
export const DIMENSION_PATTERN = /^\d+x\d+$/;
export const NAME_PATTERN = /^\S+$/;

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  Trousers: "Брюки",
  Jeans: "Джинсы",
  Shorts: "Шорты",
  Shirt: "Рубашка",
  Blouse: "Блузка",
  TShirt: "Футболка",
  Dress: "Платье",
  Skirt: "Юбка",
  Jacket: "Жакет",
  Coat: "Пальто",
  Sweater: "Свитер",
  Cardigan: "Кардиган",
  Accessory: "Аксессуар",
};

export const SIZE_TYPE_LABELS: Record<SizeType, string> = {
  Letter: `Буквенный (${LETTER_SIZES[0]} ... ${LETTER_SIZES[LETTER_SIZES.length - 1]})`,
  Numeric: `Числовой (${NUMERIC_SIZES[0]} ... ${NUMERIC_SIZES[NUMERIC_SIZES.length - 1]})`,
  Dimension: "Прямоугольный (40x60)",
};

export const PRODUCT_TYPES = Object.values(ProductType);
export const SIZE_TYPES = Object.values(SizeType);

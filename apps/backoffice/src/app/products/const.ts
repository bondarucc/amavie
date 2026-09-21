import {
  ModelPurpose,
  ModelSeason,
  ModelType,
  SizeType,
} from "@amavie/database/browser";

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

export const EXTERNAL_ID_PATTERN = /^\d\.\d{4} [A-Za-z]\d$/;
export const DIMENSION_PATTERN = /^\d+x\d+$/;
export const NAME_PATTERN = /^\S+$/;
export const HEIGHT_PATTERN = /^\d{3}-\d{3}$/;
export const DEFAULT_HEIGHT = "164-168";

export const MODEL_TYPE_LABELS: Record<ModelType, string> = {
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

export const MODEL_SEASON_LABELS: Record<ModelSeason, string> = {
  Winter: "Зима",
  Summer: "Лето",
  MidSeason: "Демисезон",
};

export const MODEL_PURPOSE_LABELS: Record<ModelPurpose, string> = {
  Everyday: "На каждый день",
  Dressy: "Нарядный",
  Sport: "Спортивный",
  Home: "Домашний",
  Business: "Деловой",
};

export const MODEL_TYPES = Object.values(ModelType);
export const SIZE_TYPES = Object.values(SizeType);
export const MODEL_SEASONS = Object.values(ModelSeason);
export const MODEL_PURPOSES = Object.values(ModelPurpose);

export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export const PRODUCT_IMAGE_TYPES: Record<string, string> = {
  "image/png": ".png",
  "image/jpeg": ".jpg",
};

export const PRODUCT_IMAGE_ACCEPT = Object.keys(PRODUCT_IMAGE_TYPES).join(",");

export const MIN_IMAGES_PER_COLOR = 1;
export const MAX_IMAGES_PER_COLOR = 3;
export const UPLOAD_CONCURRENCY = 5;

export const PRODUCT_IMAGE_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg)$/;

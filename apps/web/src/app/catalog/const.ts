import {
  ModelPurpose,
  ModelSeason,
  ModelType,
} from "@amavie/database/browser";

export const PRODUCTS_CACHE_TAG = "products";

export const PRODUCT_IMAGE_FILENAME_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(png|jpg)$/;

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

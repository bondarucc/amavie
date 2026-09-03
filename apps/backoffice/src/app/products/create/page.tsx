import ProductCreate from "./ProductCreate";

export default function CreateProductPage() {
  return (
    <div className="p-6 max-w-full overflow-y-auto">
      <h1 className="text-2xl font-semibold mb-1">Новая модель</h1>
      <p className="mb-8 text-muted-foreground">
        Укажите общие характеристики модели, затем добавьте артикулы. Для
        каждого артикула задаются описание, ткань, размеры и цвета: каждая
        комбинация будет доступна на складе с нулевым остатком.
      </p>
      <ProductCreate />
    </div>
  );
}

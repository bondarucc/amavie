import ProductCreate from "./ProductCreate";

export default function CreateProductPage() {
  return (
    <div className="p-6 max-w-full overflow-y-auto">
      <h1 className="text-2xl font-semibold mb-1">Новый товар</h1>
      <p className="mb-8 text-muted-foreground">
        Укажите характеристики модели. Размеры и цвета задаются списками: каждая
        комбинация будет доступна на складе с нулевым остатком.
      </p>
      <ProductCreate />
    </div>
  );
}

import BlogPostCreate from "./BlogPostCreate";

export default function NewBlogPostPage() {
  return (
    <div className="p-6 max-w-full overflow-y-auto">
      <h1 className="text-2xl font-semibold mb-1">Новый пост в блоге</h1>

      <p className="mb-8 text-muted-foreground">
        Управляем содержанием блога на основной странице магазина. Создаем посты
        на основании выбранного шаблона. Обращаем внимание на пропорции
        загружаемых изображений.
      </p>

      <BlogPostCreate />
    </div>
  );
}

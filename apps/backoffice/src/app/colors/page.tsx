import { Suspense } from "react";
import { cachedColorDefinitions } from "./data";
import { ColorsView } from "./ColorsView";

export default function ColorsPage() {
  return (
    <div className="p-6 max-w-full overflow-y-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold mb-1">Словарь цветов</h1>
        <p className="text-muted-foreground">
          Справочник цветов для товаров. Название нельзя изменить после
          создания.
        </p>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Загрузка…</p>}>
        <ColorsBody />
      </Suspense>
    </div>
  );
}

async function ColorsBody() {
  const colors = await cachedColorDefinitions();
  return <ColorsView colors={colors} />;
}

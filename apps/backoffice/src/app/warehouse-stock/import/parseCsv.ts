import { parse } from "csv-parse/sync";
import { z } from "zod";
import { MAX_IMPORT_ROWS } from "./const";

export type CsvStockRow = {
  line: number;
  externalId: string;
  size: string;
  color: string;
  stock: number;
};

export type ParseCsvResult =
  { ok: true; rows: CsvStockRow[] } | { ok: false; error: string };

const COLUMN_LABELS = ["артикул", "размер", "цвет", "остаток"] as const;

type ParsedWithInfo = {
  record: string[];
  info: { lines: number };
};

const rowSchema = z.object({
  externalId: z.string().min(1),
  size: z.string().min(1),
  color: z.string().min(1),
  stock: z.number().int().min(0),
});

export function parseStockCsv(text: string): ParseCsvResult {
  const source = text.replace(/^\uFEFF/, "");
  const firstLine = firstNonEmptyLine(source);

  if (!firstLine) {
    return { ok: false, error: "Файл пуст. Добавьте строки с данными." };
  }

  const delimiter = detectDelimiter(firstLine);
  if (!delimiter) {
    return {
      ok: false,
      error:
        "Не удалось определить разделитель. Используйте запятую или точку с запятой и ровно 4 столбца: артикул, размер, цвет, остаток.",
    };
  }

  let parsed: ParsedWithInfo[];
  try {
    parsed = parse(source, {
      bom: true,
      columns: false,
      delimiter,
      skip_empty_lines: true,
      relax_column_count: true,
      info: true,
      to: MAX_IMPORT_ROWS + 1,
    }) as unknown as ParsedWithInfo[];
  } catch {
    return {
      ok: false,
      error: "Не удалось прочитать CSV. Проверьте формат файла.",
    };
  }

  if (parsed.length === 0) {
    return { ok: false, error: "Файл пуст. Добавьте строки с данными." };
  }

  if (parsed.length > MAX_IMPORT_ROWS) {
    return {
      ok: false,
      error: `В файле больше ${MAX_IMPORT_ROWS} строк. Уменьшите количество записей.`,
    };
  }

  const rows: CsvStockRow[] = [];

  for (const entry of parsed) {
    const line = entry.info.lines;
    const record = entry.record;

    if (record.length !== 4) {
      return {
        ok: false,
        error: `Строка ${line}: ожидается 4 столбца (артикул, размер, цвет, остаток), получено ${record.length}.`,
      };
    }

    const [rawExternalId, rawSize, rawColor, rawStock] = record;
    const externalId = rawExternalId.trim();
    const size = rawSize.trim();
    const color = rawColor;
    const stockRaw = rawStock.trim();

    const blankIndex = [
      externalId,
      size,
      color.trim(),
      stockRaw,
    ].findIndex((value) => value.length === 0);
    if (blankIndex !== -1) {
      return {
        ok: false,
        error: `Строка ${line}: пустое значение в столбце «${COLUMN_LABELS[blankIndex]}».`,
      };
    }

    if (!/^\d+$/.test(stockRaw)) {
      return {
        ok: false,
        error: `Строка ${line}: остаток должен быть целым неотрицательным числом.`,
      };
    }

    const parsedRow = rowSchema.safeParse({
      externalId,
      size,
      color,
      stock: Number(stockRaw),
    });

    if (!parsedRow.success) {
      return {
        ok: false,
        error: `Строка ${line}: остаток должен быть целым неотрицательным числом.`,
      };
    }

    rows.push({ line, ...parsedRow.data });
  }

  const duplicateError = duplicateErrorMessage(rows);
  if (duplicateError) {
    return { ok: false, error: duplicateError };
  }

  return { ok: true, rows };
}

function firstNonEmptyLine(text: string): string | null {
  for (const line of text.split(/\r\n|\n|\r/)) {
    if (line.trim().length > 0) {
      return line;
    }
  }
  return null;
}

function detectDelimiter(firstLine: string): "," | ";" | null {
  const commaCount = fieldCount(firstLine, ",");
  const semicolonCount = fieldCount(firstLine, ";");
  const commaOk = commaCount === 4;
  const semicolonOk = semicolonCount === 4;

  if (commaOk && semicolonOk) {
    return ",";
  }
  if (commaOk) {
    return ",";
  }
  if (semicolonOk) {
    return ";";
  }
  return null;
}

function fieldCount(line: string, delimiter: string): number {
  try {
    const records = parse(line, {
      bom: true,
      columns: false,
      delimiter,
      relax_column_count: true,
      skip_empty_lines: true,
    });
    return records[0]?.length ?? 0;
  } catch {
    return 0;
  }
}

export function normalizeCsvColor(color: string) {
  return color.trim().toLowerCase();
}

function identityKey(row: Pick<CsvStockRow, "externalId" | "size" | "color">) {
  return `${row.externalId}\0${row.size}\0${normalizeCsvColor(row.color)}`;
}

function duplicateErrorMessage(rows: CsvStockRow[]): string | undefined {
  const groups = new Map<string, CsvStockRow[]>();

  for (const row of rows) {
    const key = identityKey(row);
    const group = groups.get(key);
    if (group) {
      group.push(row);
    } else {
      groups.set(key, [row]);
    }
  }

  const duplicates = [...groups.values()].filter((group) => group.length > 1);
  if (duplicates.length === 0) {
    return undefined;
  }

  const details = duplicates.map((group) => {
    const sample = group[0];
    const lines = group.map((row) => row.line).join(", ");
    return `строки ${lines}: ${sample.externalId}, ${sample.size}, ${sample.color}`;
  });

  return `В файле есть повторяющиеся строки.\n${details.join("\n")}`;
}

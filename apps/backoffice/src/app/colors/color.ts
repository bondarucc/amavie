export const HEX_PATTERN = /^#[0-9a-f]{6}$/i;

export type ColorOption = {
  id: string;
  displayValue: string;
  hex: string;
  normalizedValue: string;
};

export type ColorDefinitionListItem = ColorOption & {
  deletable: boolean;
};

export function normalizeDisplayValue(displayValue: string) {
  return displayValue.trim().toLowerCase();
}

export function normalizeHex(hex: string) {
  const trimmed = hex.trim().toLowerCase();
  if (HEX_PATTERN.test(trimmed)) {
    return trimmed;
  }
  if (/^[0-9a-f]{6}$/.test(trimmed)) {
    return `#${trimmed}`;
  }
  return trimmed;
}

export function parseColorInput(displayValueRaw: string, hexRaw: string):
  | {
      displayValue: string;
      hex: string;
      normalizedValue: string;
    }
  | { error: string; field: "displayValue" | "hex" } {
  const displayValue = displayValueRaw.trim();
  if (!displayValue) {
    return { error: "Название обязательно", field: "displayValue" };
  }

  const hex = normalizeHex(hexRaw);
  if (!HEX_PATTERN.test(hex)) {
    return {
      error: "Укажите цвет в формате #RRGGBB",
      field: "hex",
    };
  }

  return {
    displayValue,
    hex,
    normalizedValue: normalizeDisplayValue(displayValue),
  };
}

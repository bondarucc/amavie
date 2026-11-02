export type BasketColorOption = {
  colorDefinitionId: string;
  name: string;
  hex: string;
  sizes: { variantId: string; size: string }[];
};

type ModelColorSource = {
  colors: {
    colorDefinition: {
      id: string;
      displayValue: string;
      hex: string;
    };
    variants: { id: string; size: string }[];
  }[];
};

export function groupModelColors(
  products: ModelColorSource[],
): BasketColorOption[] {
  const byColor = new Map<string, BasketColorOption>();

  for (const product of products) {
    for (const color of product.colors) {
      const definition = color.colorDefinition;
      let option = byColor.get(definition.id);

      if (!option) {
        option = {
          colorDefinitionId: definition.id,
          name: definition.displayValue,
          hex: definition.hex,
          sizes: [],
        };
        byColor.set(definition.id, option);
      }

      for (const variant of color.variants) {
        if (option.sizes.some((size) => size.size === variant.size)) {
          continue;
        }

        option.sizes.push({ variantId: variant.id, size: variant.size });
      }
    }
  }

  return [...byColor.values()];
}

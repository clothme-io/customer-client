type Variant = { variantId: string; sizeLabel: string; quantity: number };
type Location = { id: string; colors?: { id: string; sizes?: Variant[] }[] };
export function selectVariant(
  locations: Location[],
  locationId: string,
  colorId: string,
  sizeLabel: string,
): Variant | null {
  return (
    locations
      .find((location) => location.id === locationId)
      ?.colors?.find((color) => color.id === colorId)
      ?.sizes?.find(
        (size) => size.sizeLabel === sizeLabel && size.quantity > 0,
      ) || null
  );
}

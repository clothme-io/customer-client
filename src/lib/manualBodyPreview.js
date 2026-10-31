const SHAPE_WIDTHS = {
  rectangle: { shoulders: 42, chest: 40, waist: 38, hips: 41 },
  pear: { shoulders: 36, chest: 36, waist: 34, hips: 51 },
  apple: { shoulders: 42, chest: 43, waist: 48, hips: 42 },
  hourglass: { shoulders: 43, chest: 44, waist: 28, hips: 45 },
  inverted_triangle: { shoulders: 51, chest: 46, waist: 35, hips: 36 },
};

const CUP_ADJUSTMENT = { A: 0, B: 2, C: 4, D: 6, DD: 8, F: 10 };

export function getBodyPreviewWidths(shape, gender, cup) {
  const widths = SHAPE_WIDTHS[shape] || { shoulders: 42, chest: 40, waist: 37, hips: 42 };
  return {
    ...widths,
    chest: widths.chest + (gender === "female" ? (CUP_ADJUSTMENT[cup] || 0) : 0),
  };
}

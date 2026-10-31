export const MANUAL_SHAPES = [
  ["rectangle", "Rectangle"],
  ["pear", "Pear"],
  ["apple", "Apple"],
  ["hourglass", "Hourglass"],
  ["inverted_triangle", "Broad shoulders"],
];

export const MANUAL_BODY_FIELDS = [
  ["chest/bust", "Chest"],
  ["waist", "Waist"],
  ["hips", "Hips"],
  ["shoulder_to_shoulder", "Shoulders"],
  ["neck", "Neck"],
  ["sleeve", "Shoulder to wrist"],
  ["inseam", "Inseam"],
];

const linked = {
  "chest/bust": [["top", "chest_circumference"]],
  waist: [["top", "waist_circumference"], ["bottom", "waist_circumference"]],
  hips: [["bottom", "hip_circumference"]],
  shoulder_to_shoulder: [["top", "shoulder_width"]],
  neck: [["top", "neck_circumference"]],
  sleeve: [["top", "sleeve_length"]],
  inseam: [["bottom", "inseam"]],
};

export function validateManualAnswers(input) {
  const age = Number(input?.age);
  const height = Number(input?.height_cm);
  const weight = Number(input?.mass_kg);
  if (!Number.isInteger(age) || age < 18 || age > 120)
    throw new Error("Manual sizing is available for adults 18 and older. Choose photo sizing for a child.");
  if (!Number.isFinite(height) || height < 140 || height > 220)
    throw new Error("Enter a height between 140 and 220 cm.");
  if (!Number.isFinite(weight) || weight < 30 || weight > 200)
    throw new Error("Enter a weight between 30 and 200 kg.");
  if (!["female", "male"].includes(input?.gender))
    throw new Error("Choose a body model.");
  if (!MANUAL_SHAPES.some(([value]) => value === input?.body_shape))
    throw new Error("Choose a body shape.");
  const answers = {
    height_cm: height,
    mass_kg: weight,
    gender: input.gender,
    body_shape: input.body_shape,
  };
  for (const key of ["belly", "build", "legs", "arms"]) {
    const value = Number(input[key]);
    if (![1, 2, 3].includes(value)) throw new Error(`Choose ${key}.`);
    answers[key] = value;
  }
  if (input.gender === "female" && input.cupsize) {
    if (!["A", "B", "C", "D", "DD", "F"].includes(input.cupsize))
      throw new Error("Choose a valid cup size.");
    answers.cupsize = input.cupsize;
  }
  return answers;
}

export function applyManualMeasurementEdits(profile, edits) {
  if (!edits || typeof edits !== "object" || Array.isArray(edits))
    throw new Error("Enter valid measurements.");
  const next = structuredClone(profile);
  for (const [key, value] of Object.entries(edits)) {
    const cm = Number(value);
    if (!MANUAL_BODY_FIELDS.some(([field]) => field === key) ||
        !Number.isFinite(cm) || cm <= 0 || cm > 400 ||
        !next.measurements?.[key])
      throw new Error("Enter valid measurements in centimeters.");
    const rounded = Math.round(cm * 100) / 100;
    next.measurements[key] = {
      ...next.measurements[key], cm: rounded,
      in: Math.round(rounded / 2.54 * 100) / 100,
    };
    for (const [section, field] of linked[key] || []) {
      if (next.sizing?.[section]?.[field]) {
        next.sizing[section][field] = {
          ...next.sizing[section][field], cm: rounded,
          inches: Math.round(rounded / 2.54 * 100) / 100,
        };
      }
    }
    if (key === "chest/bust" && next.sizing?.top?.chest_half_circumference) {
      const half = rounded / 2;
      next.sizing.top.chest_half_circumference = {
        ...next.sizing.top.chest_half_circumference,
        cm: Math.round(half * 100) / 100,
        inches: Math.round(half / 2.54 * 100) / 100,
      };
    }
  }
  return next;
}

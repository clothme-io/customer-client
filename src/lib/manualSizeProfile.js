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

export const MANUAL_TOP_FIELDS = [
  ["shoulder_to_waist", "Shoulder to waist"],
  ["shoulder_width", "Shoulder width"],
  ["chest_circumference", "Chest"],
  ["sleeve_length", "Shoulder to wrist"],
  ["neck_circumference", "Neck"],
  ["waist_circumference", "Waist"],
  ["underbust_circumference", "Underbust"],
  ["stomach_circumference", "Stomach"],
  ["upperarm_circumference", "Upper arm"],
  ["wrist_circumference", "Wrist"],
  ["back_neck_to_waist", "Back neck to waist"],
  ["side_neck_to_crotch", "Side neck to crotch"],
  ["neck_to_pelvis", "Neck to pelvis"],
  ["belly_depth", "Belly depth"],
];

export const MANUAL_BOTTOM_FIELDS = [
  ["waist_circumference", "Waist"],
  ["hip_circumference", "Hips"],
  ["thigh_circumference", "Thigh"],
  ["inseam", "Inseam"],
  ["waist_to_ankle", "Waist to ankle"],
  ["knee_circumference", "Knee"],
  ["calf_circumference", "Calf"],
  ["ankle_circumference", "Ankle"],
  ["crotch_length", "Crotch length"],
  ["front_rise", "Front rise"],
  ["back_rise", "Back rise"],
  ["foot_width", "Foot width"],
];

export const MANUAL_SECTIONS = [
  ["body", "Body measurements", MANUAL_BODY_FIELDS],
  ["top", "Your top sizing", MANUAL_TOP_FIELDS],
  ["bottom", "Your bottom sizing", MANUAL_BOTTOM_FIELDS],
];

const linkedGroups = [
  ["body.chest/bust", "top.chest_circumference"],
  ["body.waist", "top.waist_circumference", "bottom.waist_circumference"],
  ["body.hips", "bottom.hip_circumference"],
  ["body.shoulder_to_shoulder", "top.shoulder_width"],
  ["body.neck", "top.neck_circumference"],
  ["body.sleeve", "body.arm_length", "top.sleeve_length"],
  ["body.inseam", "bottom.inseam"],
  ["body.underbust", "top.underbust_circumference"],
  ["body.stomach", "top.stomach_circumference"],
  ["body.upperarm", "body.bicep", "top.upperarm_circumference"],
  ["body.wrist", "top.wrist_circumference"],
  ["body.back_neck_to_waist", "top.back_neck_to_waist"],
  ["body.side_neck_to_crotch", "top.side_neck_to_crotch"],
  ["body.neck_to_pelvis", "top.neck_to_pelvis"],
  ["body.belly_depth", "top.belly_depth"],
  ["body.thigh", "bottom.thigh_circumference"],
  ["body.knee", "bottom.knee_circumference"],
  ["body.calf", "bottom.calf_circumference"],
  ["body.ankle", "bottom.ankle_circumference"],
  ["body.crotch_length", "bottom.crotch_length"],
  ["body.front_rise", "bottom.front_rise"],
  ["body.back_rise", "bottom.back_rise"],
  ["body.foot_width", "bottom.foot_width"],
];

export function linkedManualFields(field) {
  return linkedGroups.find((group) => group.includes(field)) || [field];
}

export function manualProfileRows(profile) {
  return MANUAL_SECTIONS.map(([section, title, fields]) => ({
    section, title,
    rows: fields.filter(([key]) => {
      const cm = section === "body" ? profile?.measurements?.[key]?.cm : profile?.sizing?.[section]?.[key]?.cm;
      return Number.isFinite(cm) && cm > 0;
    }).map(([key, label]) => ({ key: `${section}.${key}`, label })),
  })).filter(({ rows }) => rows.length);
}

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
      throw new Error("Choose a valid chest size.");
    answers.cupsize = input.cupsize;
  }
  return answers;
}

export function applyManualMeasurementEdits(profile, edits) {
  if (!edits || typeof edits !== "object" || Array.isArray(edits))
    throw new Error("Enter valid measurements.");
  const next = structuredClone(profile);
  const allowed = new Set(manualProfileRows(profile).flatMap(({ rows }) => rows.map(({ key }) => key)));
  for (const [rawKey, value] of Object.entries(edits)) {
    const key = rawKey.includes(".") ? rawKey : `body.${rawKey}`;
    const cm = Number(value);
    if (!allowed.has(key) || !Number.isFinite(cm) || cm <= 0 || cm > 400)
      throw new Error("Enter valid measurements in centimeters.");
    const rounded = Math.round(cm * 100) / 100;
    for (const target of linkedManualFields(key)) {
      const [section, field] = target.split(".");
      const values = section === "body" ? next.measurements : next.sizing?.[section];
      if (!values?.[field] || values[field].cm == null) continue;
      values[field] = { ...values[field], cm: rounded,
        [section === "body" ? "in" : "inches"]: Math.round(rounded / 2.54 * 100) / 100 };
    }
    if (linkedManualFields(key).includes("body.chest/bust") && next.sizing?.top?.chest_half_circumference?.cm != null) {
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

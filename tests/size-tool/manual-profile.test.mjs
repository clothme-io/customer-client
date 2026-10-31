import test from "node:test";
import assert from "node:assert/strict";
import { applyManualMeasurementEdits, manualProfileRows, validateManualAnswers } from "../../src/lib/manualSizeProfile.js";

const answers = {
  age: 30, height_cm: 170, mass_kg: 70, gender: "female",
  body_shape: "hourglass", belly: 2, build: 2, legs: 2, arms: 2,
};

test("questionnaire accepts the mobile contract and excludes age from Clad", () => {
  const result = validateManualAnswers({ ...answers, cupsize: "C" });
  assert.equal(result.height_cm, 170);
  assert.equal(result.cupsize, "C");
  assert.equal("age" in result, false);
});

test("questionnaire prevents child and unsupported body model submissions", () => {
  assert.throws(() => validateManualAnswers({ ...answers, age: 12 }), /adults 18/);
  assert.throws(() => validateManualAnswers({ ...answers, gender: "other" }), /body model/);
  assert.throws(() => validateManualAnswers({ ...answers, height_cm: 139 }), /140 and 220/);
});

test("measurement edits keep body, top, and bottom values in sync", () => {
  const original = {
    measurements: { waist: { cm: 70, in: 27.56 } },
    sizing: {
      top: { waist_circumference: { cm: 70, inches: 27.56 } },
      bottom: { waist_circumference: { cm: 70, inches: 27.56 } },
    },
  };
  const updated = applyManualMeasurementEdits(original, { waist: 75 });
  assert.equal(updated.measurements.waist.cm, 75);
  assert.equal(updated.sizing.top.waist_circumference.cm, 75);
  assert.equal(updated.sizing.bottom.waist_circumference.cm, 75);
  assert.equal(original.measurements.waist.cm, 70);
  assert.throws(() => applyManualMeasurementEdits(original, { waist: 500 }), /valid measurements/);
});

test("review includes available Body, Top, and Bottom sizing and hides missing fields", () => {
  const profile = {
    measurements: {
      "chest/bust": { cm: 94 }, waist: { cm: 78 }, hips: { cm: 100 },
      thigh: { cm: 55 }, inseam: { cm: 77 },
    },
    sizing: {
      top: {
        chest_circumference: { cm: 94 }, waist_circumference: { cm: 78 },
        shoulder_to_waist: { cm: null }, underbust_circumference: { cm: 82 },
      },
      bottom: {
        waist_circumference: { cm: 78 }, hip_circumference: { cm: 100 },
        thigh_circumference: { cm: 55 }, inseam: { cm: 77 },
      },
    },
  };
  const sections = manualProfileRows(profile);
  assert.deepEqual(sections.map(({ section }) => section), ["body", "top", "bottom"]);
  assert.ok(sections[1].rows.some(({ key }) => key === "top.underbust_circumference"));
  assert.ok(sections[2].rows.some(({ key }) => key === "bottom.thigh_circumference"));
  assert.ok(!sections[1].rows.some(({ key }) => key === "top.shoulder_to_waist"));
  const edited = applyManualMeasurementEdits(profile, {
    "top.chest_circumference": 98,
    "bottom.thigh_circumference": 57,
  });
  assert.equal(edited.measurements["chest/bust"].cm, 98);
  assert.equal(edited.sizing.top.chest_circumference.cm, 98);
  assert.equal(edited.measurements.thigh.cm, 57);
  assert.equal(edited.sizing.bottom.thigh_circumference.cm, 57);
  assert.throws(() => applyManualMeasurementEdits(profile, { "top.shoulder_to_waist": 40 }), /valid measurements/);
});

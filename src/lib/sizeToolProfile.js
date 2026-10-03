export function sizeToolProfileFromAge({ age, gender }, now = new Date()) {
  const years = Number(age);
  if (String(age).trim() === "" || !Number.isInteger(years) || years < 1 || years > 120)
    throw new Error("Enter an age between 1 and 120.");
  return {
    // The sizing API accepts DOB; January 1 preserves age without collecting a birthday.
    dob: `${now.getUTCFullYear() - years}-01-01`,
    gender,
    country: "Canada",
    provinceState: "British Columbia",
    city: "Coquitlam",
    weight: "",
  };
}

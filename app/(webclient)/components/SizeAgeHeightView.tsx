"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AccountSubHeader } from "./AccountSubHeader";
import { emptySizeProfile, loadSizeProfile, saveSizeProfile, type SizeProfile } from "../lib/size-profile";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

export function SizeAgeHeightView({
  city = "",
  country = "",
  provinceState = ""
}: {
  city?: string;
  country?: string;
  provinceState?: string;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<SizeProfile | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const saved = loadSizeProfile();
    setProfile({
      ...emptySizeProfile(),
      ...saved,
      city: saved.city || city,
      country: saved.country || country,
      provinceState: saved.provinceState || provinceState
    });
  }, [city, country, provinceState]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const dob = String(form.get("dob") || "");
    const height = String(form.get("height") || "").trim();
    const gender = String(form.get("gender") || "");
    if (!dob || !height || !gender) {
      setError("Date of birth, height, and gender are required.");
      return;
    }
    const heightNum = Number(height);
    if (!Number.isFinite(heightNum) || heightNum < 80 || heightNum > 250) {
      setError("Enter height in centimetres (80–250).");
      return;
    }
    saveSizeProfile({
      dob,
      height,
      gender,
      weight: String(form.get("weight") || "").trim(),
      city: String(form.get("city") || city).trim(),
      country: String(form.get("country") || country || "Canada").trim(),
      provinceState: String(form.get("provinceState") || provinceState).trim()
    });
    router.push("/account/size/capture");
  }

  return (
    <section>
      <AccountSubHeader title="Age & height" backHref="/account/size/policy" />
      {profile ? (
        <form className={styles.sizeCopy} onSubmit={onSubmit}>
          <p className={shell.muted}>We use this with your photos to calculate clothing sizes.</p>
          <label className={shell.field}>
            Date of birth
            <input name="dob" type="date" required defaultValue={profile.dob} />
          </label>
          <label className={shell.field}>
            Height (cm)
            <input name="height" type="number" min={80} max={250} step={1} required defaultValue={profile.height} />
          </label>
          <label className={shell.field}>
            Gender
            <select name="gender" required defaultValue={profile.gender || ""} className={styles.sizeSelect}>
              <option value="" disabled>
                Select
              </option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <label className={shell.field}>
            Weight (kg, optional)
            <input name="weight" type="number" min={20} max={250} step={0.1} defaultValue={profile.weight} />
          </label>
          <input type="hidden" name="city" defaultValue={profile.city || city} />
          <input type="hidden" name="country" defaultValue={profile.country || country} />
          <input type="hidden" name="provinceState" defaultValue={profile.provinceState || provinceState} />
          {error ? <p className={shell.error}>{error}</p> : null}
          <button className={shell.button} type="submit" style={{ width: "100%", marginTop: 8 }}>
            Continue
          </button>
        </form>
      ) : null}
    </section>
  );
}


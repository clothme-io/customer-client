"use client";
import { sessionFetch } from "../lib/session-client";
import { commerceEvent } from "../lib/commerce-events";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { sizeIdentity } from "../lib/size-flow";
import { AccountSubHeader } from "./AccountSubHeader";
import {
  emptySizeProfile,
  loadSizeProfile,
  saveSizeProfile,
  type SizeProfile,
} from "../lib/size-profile";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

export function SizeAgeHeightView({
  firstName = "",
  city = "",
  country = "",
  provinceState = "",
}: {
  firstName?: string;
  city?: string;
  country?: string;
  provinceState?: string;
}) {
  const router = useRouter();
  const [profile, setProfile] = useState<SizeProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    sizeIdentity()
      .then((key) => {
        if (cancelled) return;
        sessionStorage.setItem("cm_size_scope", key);
        const saved = loadSizeProfile();
        setProfile({
          ...emptySizeProfile(),
          ...saved,
          city: saved.city || city,
          country: saved.country || country,
          provinceState: saved.provinceState || provinceState,
        });
      })
      .catch((err) => setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [city, country, provinceState]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const dob = String(form.get("dob") || "");
    const height = String(form.get("height") || "").trim();
    const gender = String(form.get("gender") || "");
    if (
      !dob ||
      !height ||
      !gender ||
      !Number.isFinite(Date.parse(dob)) ||
      Date.parse(dob) > Date.now()
    ) {
      setError("Date of birth, height, and gender are required.");
      return;
    }
    const heightNum = Number(height);
    if (!Number.isFinite(heightNum) || heightNum < 80 || heightNum > 250) {
      setError("Enter height in centimetres (80–250).");
      return;
    }
    setSaving(true);
    setError("");
    try {
      const name = String(form.get("firstName") || "").trim();
      if (!name || name.length > 100) throw new Error("Enter your name.");
      if (name !== firstName) {
        const response = await sessionFetch("/api/webclient/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "updateProfileName",
            firstName: name,
          }),
        });
        if (!response.ok)
          throw new Error("Could not save your name. Please retry.");
      }
      saveSizeProfile({
        dob,
        height,
        gender,
        weight: String(form.get("weight") || "").trim(),
        city: String(form.get("city") || city).trim(),
        country: String(form.get("country") || country).trim(),
        provinceState: String(
          form.get("provinceState") || provinceState,
        ).trim(),
      });
      commerceEvent("size_details_completed");
      router.push("/account/size/capture");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Please retry.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section>
      <AccountSubHeader title="Age & height" backHref="/account/size/policy" />
      {!profile && error ? <p className={shell.error}>{error}</p> : null}
      {profile ? (
        <form className={styles.sizeCopy} onSubmit={onSubmit}>
          <p className={shell.muted}>
            We use this with your photos to calculate clothing sizes.
          </p>
          <label className={shell.field}>
            Your name
            <input
              name="firstName"
              required
              maxLength={100}
              defaultValue={firstName}
              autoComplete="given-name"
            />
          </label>
          <label className={shell.field}>
            Date of birth
            <input name="dob" type="date" required defaultValue={profile.dob} />
          </label>
          <label className={shell.field}>
            Height (cm)
            <input
              name="height"
              type="number"
              min={80}
              max={250}
              step={1}
              required
              defaultValue={profile.height}
            />
          </label>
          <label className={shell.field}>
            Gender
            <select
              name="gender"
              required
              defaultValue={profile.gender || ""}
              className={styles.sizeSelect}
            >
              <option value="" disabled>
                Select
              </option>
              <option value="female">Female</option>
              <option value="male">Male</option>
            </select>
          </label>
          <label className={shell.field}>
            Weight (kg, optional)
            <input
              name="weight"
              type="number"
              min={20}
              max={250}
              step={0.1}
              defaultValue={profile.weight}
            />
          </label>
          <label className={shell.field}>
            Country
            <input
              name="country"
              required
              defaultValue={profile.country || country}
              autoComplete="country-name"
            />
          </label>
          <label className={shell.field}>
            Province / state{" "}
            <input
              name="provinceState"
              required
              defaultValue={profile.provinceState || provinceState}
              autoComplete="address-level1"
            />
          </label>
          <label className={shell.field}>
            City{" "}
            <input
              name="city"
              required
              defaultValue={profile.city || city}
              autoComplete="address-level2"
            />
          </label>
          {error ? <p className={shell.error}>{error}</p> : null}
          <button
            className={shell.button}
            type="submit"
            disabled={saving}
            style={{ width: "100%", marginTop: 8 }}
          >
            Continue
          </button>
        </form>
      ) : null}
    </section>
  );
}

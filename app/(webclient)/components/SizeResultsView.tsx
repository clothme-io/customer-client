"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountSubHeader } from "./AccountSubHeader";
import { dataUrlToBlob, loadSizePhotos } from "../lib/size-profile";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

type FitSizes = Record<string, { size?: string } | null | undefined>;
type RegionRec = { tops?: FitSizes; bottoms?: FitSizes };
type Result = {
  size_recommendations?: Record<string, RegionRec>;
  measurements?: Record<string, { cm?: number; in?: number }>;
  body_profile?: { shape?: string; shape_label?: string; description?: string };
  insights?: {
    body_type_analysis?: { body_type?: string; fit_recommendations?: string | { tops?: string; bottoms?: string } };
  };
};

const REGION_LABELS: Record<string, string> = {
  US_CAD: "North America",
  EU: "Europe",
  UK: "UK",
  AUS: "Australia / Asia"
};

const MEASUREMENT_LABELS: Record<string, string> = {
  hips: "Hips",
  waist: "Waist",
  inseam: "Inseam",
  "chest/bust": "Chest / Bust",
  "leg_length": "Leg Length",
  sleeve: "Sleeve"
};

function sizeLabel(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.filter((item) => typeof item === "string").join("/") || "—";
  return "—";
}

export function SizeResultsView() {
  const router = useRouter();
  const started = useRef(false);
  const [progress, setProgress] = useState("Calculating your sizes…");
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const photos = loadSizePhotos();
    if (!photos?.front || !photos.side || !photos.frontTask || !photos.sideTask) {
      router.replace("/account/size/capture");
      return;
    }
    const payload = photos;

    let cancelled = false;

    async function run() {
      try {
        const form = new FormData();
        form.append("action", "generate");
        form.append("frontTaskId", payload.frontTask);
        form.append("sideTaskId", payload.sideTask);
        form.append("height", payload.profile.height || "");
        form.append("gender", payload.profile.gender || "");
        form.append("dob", payload.profile.dob || "");
        form.append("weight", payload.profile.weight || "");
        form.append("genderDemography", payload.profile.gender || "");
        form.append("city", payload.profile.city || "");
        form.append("country", payload.profile.country || "");
        form.append("provinceState", payload.profile.provinceState || "");
        form.append("frontImage", dataUrlToBlob(payload.front), "front.jpg");
        form.append("sideImage", dataUrlToBlob(payload.side), "side.jpg");

        const posted = await fetch("/api/webclient/size", { method: "POST", body: form });
        const postedBody = await posted.json().catch(() => ({}));
        if (!posted.ok) throw new Error(postedBody.message || "Could not start size generation");
        const taskId = String(postedBody.task_id || postedBody.taskId || "");
        if (!taskId) throw new Error("Size generation did not return a task");

        for (let i = 0; i < 45; i += 1) {
          const poll = await fetch(`/api/webclient/size?action=generateResult&id=${encodeURIComponent(taskId)}`);
          const body = await poll.json().catch(() => ({}));
          if (cancelled) return;
          const status = Number(body.status || poll.status);
          setPercent(Number(body.percentage_done || 0));
          setProgress(body.message || "Analyzing your measurements…");
          if (status === 202) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            continue;
          }
          if (status >= 400 || body.error) {
            throw new Error(body.error?.message || body.message || "ClothME could not calculate your sizes");
          }
          setResult((body.data?.result || body.result || null) as Result);
          return;
        }
        throw new Error("Size generation timed out");
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not calculate sizes");
      }
    }

    run();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const recs = result?.size_recommendations || {};
  const measurements = result?.measurements || {};

  return (
    <section>
      <AccountSubHeader title="Your sizes" backHref="/account/size/capture" />
      <div className={styles.sizeCopy}>
        {error ? (
          <>
            <p className={shell.error}>{error}</p>
            <p className={shell.muted}>This will not stop ClothME from helping you find products.</p>
            <Link className={shell.button} href="/account/size/capture" style={{ width: "100%", textAlign: "center" }}>
              Try again
            </Link>
          </>
        ) : !result ? (
          <div className={styles.sizeLoading}>
            <p>{progress}</p>
            {percent > 0 ? <p className={styles.sizePercent}>{percent}%</p> : null}
          </div>
        ) : (
          <>
            <p className={shell.muted}>
              We have calculated sizes based on your photos. Actual fit may vary slightly by brand.
            </p>

            {Object.keys(measurements).length > 0 ? (
              <>
                <h2>Measurements</h2>
                <ul className={styles.sizeMeasureList}>
                  {Object.entries(measurements).map(([key, value]) => (
                    <li key={key}>
                      <span>{MEASUREMENT_LABELS[key] || key}</span>
                      <span>
                        {value.cm ?? 0} cm / {value.in ?? 0} in
                      </span>
                    </li>
                  ))}
                </ul>
              </>
            ) : null}

            {Object.keys(recs).length > 0 ? (
              <>
                <h2>Recommended sizes</h2>
                {Object.entries(recs).map(([region, data]) => (
                  <div key={region} className={styles.sizeRegion}>
                    <p className={styles.sizeRegionLabel}>{REGION_LABELS[region] || region}</p>
                    <p>
                      Tops {sizeLabel(data.tops?.regular?.size)} · Bottoms {sizeLabel(data.bottoms?.regular?.size)}
                    </p>
                    <p className={shell.muted}>
                      Fitted {sizeLabel(data.tops?.fitted?.size)} / {sizeLabel(data.bottoms?.fitted?.size)} · Relaxed{" "}
                      {sizeLabel(data.tops?.relaxed?.size)} / {sizeLabel(data.bottoms?.relaxed?.size)}
                    </p>
                  </div>
                ))}
              </>
            ) : null}

            {result.body_profile ? (
              <>
                <h2>{result.body_profile.shape_label || result.body_profile.shape || "Body shape"}</h2>
                {result.body_profile.description ? <p>{result.body_profile.description}</p> : null}
              </>
            ) : null}

            {result.insights?.body_type_analysis ? (
              <p>
                {typeof result.insights.body_type_analysis.fit_recommendations === "string"
                  ? result.insights.body_type_analysis.fit_recommendations
                  : result.insights.body_type_analysis.fit_recommendations?.tops}
              </p>
            ) : null}

            <Link className={shell.button} href="/shop" style={{ width: "100%", textAlign: "center", marginTop: 16 }}>
              Continue shopping
            </Link>
          </>
        )}
      </div>
    </section>
  );
}

"use client";

import { commerceEvent, purchaseEvent } from "../lib/commerce-events";

import { sessionFetch as fetch } from "../lib/session-client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AccountSubHeader } from "./AccountSubHeader";
import {
  sizeIdentity,
  startGeneration,
  saveFlow,
  loadFlow,
} from "../lib/size-flow";
import { readPurchaseIntent } from "../lib/purchase-intent";
import styles from "../shop.module.css";
import shell from "../webclient.module.css";

type FitSizes = Record<string, { size?: string } | null | undefined>;
type RegionRec = { tops?: FitSizes; bottoms?: FitSizes };
type Result = {
  size_recommendations?: Record<string, RegionRec>;
  measurements?: Record<string, { cm?: number; in?: number }>;
  body_profile?: { shape?: string; shape_label?: string; description?: string };
  insights?: {
    body_type_analysis?: {
      body_type?: string;
      fit_recommendations?: string | { tops?: string; bottoms?: string };
    };
  };
};

const REGION_LABELS: Record<string, string> = {
  US_CAD: "North America",
  EU: "Europe",
  UK: "UK",
  AUS: "Australia / Asia",
};

const MEASUREMENT_LABELS: Record<string, string> = {
  hips: "Hips",
  waist: "Waist",
  inseam: "Inseam",
  "chest/bust": "Chest / Bust",
  leg_length: "Leg Length",
  sleeve: "Sleeve",
};

function sizeLabel(value: unknown) {
  if (typeof value === "string") return value;
  if (Array.isArray(value))
    return value.filter((item) => typeof item === "string").join("/") || "—";
  return "—";
}

export function SizeResultsView() {
  const router = useRouter();
  const [attempt, setAttempt] = useState(0);
  const [saved, setSaved] = useState(false);
  const [returnTo, setReturnTo] = useState("/shop");
  const [savingMessage, setSavingMessage] = useState(
    "Checking your saved profile…",
  );
  const [progress, setProgress] = useState("Calculating your sizes…");
  const [percent, setPercent] = useState(0);
  const [error, setError] = useState("");
  const [result, setResult] = useState<Result | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();
    setError("");
    async function run() {
      try {
        const key = await sizeIdentity();
        const intent = readPurchaseIntent();
        if (intent && `${intent.accountId}:${intent.personId}` === key)
          setReturnTo(intent.returnTo);
        const existing = await loadFlow(key);
        if (!existing) {
          router.replace("/account/size/capture");
          return;
        }
        const flow = await startGeneration(key);
        if (cancelled) return;
        if (flow.result) setResult(flow.result as Result);
        else {
          for (let i = 0; i < 150; i += 1) {
            const poll = await fetch(
              `/api/webclient/size?action=generateResult&id=${encodeURIComponent(flow.taskId!)}`,
              {
                signal: controller.signal,
                headers: { "X-Size-Receipt": flow.receipt || "" },
              },
            );
            const body = await poll.json();
            if (cancelled) return;
            setPercent(body.percent || 0);
            setProgress(body.message || "Calculating measurements…");
            if (!poll.ok)
              throw new Error(body.message || "Could not calculate sizes");
            if (body.state === "complete" && body.result) {
              if ((await sizeIdentity()) !== key)
                throw new Error(
                  "Your selected profile changed. Return to your account.",
                );
              flow.result = body.result;
              await saveFlow(flow);
              setResult(body.result);
              commerceEvent("measurement_generated");
              break;
            }
            await new Promise((resolve) => setTimeout(resolve, 2000));
            if (cancelled) return;
          }
          if (!flow.result)
            throw new Error(
              "Your measurements are still processing. Resume below to check the same job.",
            );
        }
        setSavingMessage(
          "Saving your measurements and matching available products…",
        );
        const saved = await fetch("/api/webclient/fit-profile/save", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ taskId: flow.taskId, receipt: flow.receipt }),
          signal: controller.signal,
        });
        const saveStatus = await saved.json();
        if (!saved.ok)
          throw new Error(
            saveStatus.message ||
              "Measurements calculated, but saving or matching needs another attempt. Resume without retaking photos.",
          );
        if (!saveStatus.ready)
          throw new Error("Your profile is still processing. Resume shortly.");
        // Read the exact saved operation, not an older profile.

        for (let i = 0; i < 30; i += 1) {
          const response = await fetch("/api/webclient/fit-profile", {
            signal: controller.signal,
          });
          const profile = await response.json();
          if (cancelled) return;
          if (!response.ok)
            throw new Error(
              profile.message || "Could not verify your saved profile.",
            );
          if (`${profile.accountId}:${profile.personId}` !== key)
            throw new Error("Your selected profile changed.");
          if (
            profile.ready &&
            (profile.source === "mock" ||
              profile.operationId === saveStatus.operationId)
          ) {
            setSaved(true);
            commerceEvent("fit_profile_saved");
            commerceEvent("matching_completed", {
              count: saveStatus.matchCount || 0,
            });
            setSavingMessage(
              saveStatus.matchCount > 0
                ? `Your profile is saved. ${saveStatus.matchCount} product options match your measurements.`
                : "Your profile is saved. No currently available product options matched. You do not need to retake your photos.",
            );
            return;
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
          if (cancelled) return;
        }
        setSavingMessage(
          "Your measurements were calculated, but we cannot confirm a saved shopping profile yet. Check again shortly; you do not need to retake your photos.",
        );
      } catch (err) {
        if (!cancelled)
          setError(
            err instanceof Error ? err.message : "Could not calculate sizes",
          );
      }
    }
    run();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [router, attempt]);

  const recs = result?.size_recommendations || {};
  const measurements = result?.measurements || {};

  return (
    <section>
      <AccountSubHeader title="Your sizes" backHref="/account/size/capture" />
      <div className={styles.sizeCopy}>
        {error ? (
          <>
            <p className={shell.error}>{error}</p>
            <p className={shell.muted}>
              Your existing job will be checked again without submitting new
              photos.
            </p>
            <button
              type="button"
              className={shell.button}
              onClick={() => setAttempt((value) => value + 1)}
            >
              Resume
            </button>
            <Link
              className={shell.button}
              href="/account/size/capture"
              style={{ width: "100%", textAlign: "center" }}
            >
              Retake photos
            </Link>
          </>
        ) : !result ? (
          <div className={styles.sizeLoading}>
            <p>{progress}</p>
            {percent > 0 ? (
              <p className={styles.sizePercent}>{percent}%</p>
            ) : null}
          </div>
        ) : (
          <>
            <p className={shell.muted}>
              We have calculated sizes based on your photos. Actual fit may vary
              slightly by brand.
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
                    <p className={styles.sizeRegionLabel}>
                      {REGION_LABELS[region] || region}
                    </p>
                    <p>
                      Tops {sizeLabel(data.tops?.regular?.size)} · Bottoms{" "}
                      {sizeLabel(data.bottoms?.regular?.size)}
                    </p>
                    <p className={shell.muted}>
                      Fitted {sizeLabel(data.tops?.fitted?.size)} /{" "}
                      {sizeLabel(data.bottoms?.fitted?.size)} · Relaxed{" "}
                      {sizeLabel(data.tops?.relaxed?.size)} /{" "}
                      {sizeLabel(data.bottoms?.relaxed?.size)}
                    </p>
                  </div>
                ))}
              </>
            ) : null}

            {result.body_profile ? (
              <>
                <h2>
                  {result.body_profile.shape_label ||
                    result.body_profile.shape ||
                    "Body shape"}
                </h2>
                {result.body_profile.description ? (
                  <p>{result.body_profile.description}</p>
                ) : null}
              </>
            ) : null}

            {result.insights?.body_type_analysis ? (
              <p>
                {typeof result.insights.body_type_analysis
                  .fit_recommendations === "string"
                  ? result.insights.body_type_analysis.fit_recommendations
                  : result.insights.body_type_analysis.fit_recommendations
                      ?.tops}
              </p>
            ) : null}

            <p role="status">{savingMessage}</p>
            {!saved ? (
              <button
                type="button"
                className={shell.button}
                onClick={() => setAttempt((value) => value + 1)}
              >
                Check saved profile again
              </button>
            ) : null}
            <a
              className={shell.button}
              href={returnTo}
              style={{ width: "100%", textAlign: "center", marginTop: 16 }}
            >
              {returnTo === "/shop"
                ? "Continue shopping"
                : "Return to your selection"}
            </a>
          </>
        )}
      </div>
    </section>
  );
}

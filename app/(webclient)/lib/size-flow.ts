"use client";
import { sessionFetch } from "./session-client";
import type { SizePhotos } from "./size-profile";
import { dataUrlToBlob } from "./size-profile";
const DB = "clothme-sizing-v1";
const TTL = 60 * 60_000;
export type SizeFlow = {
  key: string;
  expires: number;
  taskId?: string;
  submitting?: boolean;
  result?: Record<string, any>;
  photos?: Omit<SizePhotos, "front" | "side"> & { front: Blob; side: Blob };
};
export async function sizeIdentity() {
  const response = await sessionFetch("/api/webclient/session");
  const session = await response.json();
  if (!session.authenticated)
    throw new Error("Please sign in to continue your fit profile.");
  return `${session.accountId}:${session.personId}`;
}
async function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB, 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("flows", { keyPath: "key" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Temporary photo storage is unavailable. Enable browser storage and try again.",
        ),
      );
  });
}
export async function loadFlow(key: string): Promise<SizeFlow | null> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("flows", "readwrite");
      const store = tx.objectStore("flows");
      const request = store.getAll();
      let flow: SizeFlow | null = null;
      request.onsuccess = () => {
        for (const item of request.result as SizeFlow[]) {
          if (item.expires < Date.now()) store.delete(item.key);
          else if (item.key === key) flow = item;
        }
      };
      tx.oncomplete = () => resolve(flow);
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
export async function saveFlow(flow: SizeFlow) {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("flows", "readwrite");
      tx.objectStore("flows").put(flow);
      tx.oncomplete = () => resolve();
      tx.onerror = () =>
        reject(
          new Error(
            "Could not save your sizing progress. Check available browser storage.",
          ),
        );
    });
  } finally {
    db.close();
  }
}
export async function stagePhotos(photos: SizePhotos) {
  const key = await sizeIdentity();
  await saveFlow({
    key,
    expires: Date.now() + TTL,
    photos: {
      ...photos,
      front: dataUrlToBlob(photos.front),
      side: dataUrlToBlob(photos.side),
    },
  });
}
export async function clearSizeFlows() {
  const db = await database();
  try {
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction("flows", "readwrite");
      tx.objectStore("flows").clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
// Shared promise prevents a StrictMode remount from submitting a second job.
const starts = new Map<string, Promise<SizeFlow>>();
export function startGeneration(key: string) {
  let pending = starts.get(key);
  if (!pending) {
    pending = submit(key).finally(() => starts.delete(key));
    starts.set(key, pending);
  }
  return pending;
}
// IndexedDB serializes read/write transactions across connections and tabs.
// Read and claim in the same transaction, before sending any network request.
async function claimGeneration(key: string): Promise<SizeFlow> {
  const db = await database();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction("flows", "readwrite");
      const store = tx.objectStore("flows");
      const request = store.get(key);
      let flow: SizeFlow;
      let failure: Error | undefined;
      request.onsuccess = () => {
        flow = request.result;
        if (!flow || flow.expires < Date.now())
          failure = new Error("Your photo session expired. Please take your photos again.");
        else if (flow.taskId || flow.result) return;
        else if (flow.submitting)
          failure = new Error("The previous submission may still be processing. Please contact support before starting another measurement.");
        else if (!flow.photos)
          failure = new Error("Both validated photos are required.");
        if (failure) {
          tx.abort();
          return;
        }
        flow.submitting = true;
        store.put(flow);
      };
      tx.oncomplete = () => resolve(flow);
      tx.onabort = () => reject(failure || tx.error || new Error("Could not claim your sizing session."));
      tx.onerror = () => reject(tx.error);
    });
  } finally {
    db.close();
  }
}
async function submit(key: string): Promise<SizeFlow> {
  if ((await sizeIdentity()) !== key)
    throw new Error("Your selected profile changed. Return to the photo step.");
  const flow = await claimGeneration(key);
  if (flow.taskId || flow.result) return flow;
  const photos = flow.photos!;
  const form = new FormData();
  form.set("action", "generate");
  form.set("frontTaskId", photos.frontTask);
  form.set("sideTaskId", photos.sideTask);
  for (const [name, value] of Object.entries(photos.profile))
    form.set(name, value);
  form.set("genderDemography", photos.profile.gender);
  form.set("frontImage", photos.front, "front.jpg");
  form.set("sideImage", photos.side, "side.jpg");
  const response = await sessionFetch("/api/webclient/size", {
    method: "POST",
    body: form,
  });
  const body = await response.json();
  if (!response.ok || !body.taskId) {
    // Only a definite input rejection is safe to resubmit automatically.
    if (response.status >= 400 && response.status < 500) {
      flow.submitting = false;
      await saveFlow(flow);
    }
    throw new Error(body.message || "Could not start measurement generation.");
  }
  flow.taskId = body.taskId;
  flow.submitting = false;
  // Images are no longer needed once the server accepted generation.
  delete flow.photos;
  await saveFlow(flow);
  return flow;
}

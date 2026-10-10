export const SIZE_PROFILE_KEY = "cm_size_profile";
export const SIZE_PHOTOS_KEY = "cm_size_photos";

export type SizeProfile = {
  dob: string;
  height: string;
  gender: string;
  weight: string;
  city: string;
  country: string;
  provinceState: string;
};

export type SizePhotos = {
  front: string;
  side: string;
  frontTask: string;
  sideTask: string;
  profile: SizeProfile;
};

export function emptySizeProfile(): SizeProfile {
  return {
    dob: "",
    height: "",
    gender: "",
    weight: "",
    city: "",
    country: "",
    provinceState: "",
  };
}

function profileKey() {
  return `${SIZE_PROFILE_KEY}:${sessionStorage.getItem("cm_size_scope") || "unscoped"}`;
}

export function loadSizeProfile(): SizeProfile {
  try {
    return {
      ...emptySizeProfile(),
      ...JSON.parse(sessionStorage.getItem(profileKey()) || "{}"),
    };
  } catch {
    return emptySizeProfile();
  }
}

export function saveSizeProfile(profile: SizeProfile) {
  sessionStorage.setItem(profileKey(), JSON.stringify(profile));
}

export function bindSizeProfileScope(next: string) {
  const previous = sessionStorage.getItem("cm_size_scope") || "unscoped";
  if (previous !== next) {
    const from = `${SIZE_PROFILE_KEY}:${previous}`;
    const to = `${SIZE_PROFILE_KEY}:${next}`;
    const profile = sessionStorage.getItem(from);
    if (profile && !sessionStorage.getItem(to)) sessionStorage.setItem(to, profile);
  }
  sessionStorage.setItem("cm_size_scope", next);
}

export function dataUrlToBlob(dataUrl: string) {
  const [header, data] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(header)?.[1] || "image/jpeg";
  const bytes = atob(data);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) buffer[i] = bytes.charCodeAt(i);
  return new Blob([buffer], { type: mime });
}

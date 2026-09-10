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
    provinceState: ""
  };
}

export function loadSizeProfile(): SizeProfile {
  try {
    return { ...emptySizeProfile(), ...JSON.parse(sessionStorage.getItem(SIZE_PROFILE_KEY) || "{}") };
  } catch {
    return emptySizeProfile();
  }
}

export function saveSizeProfile(profile: SizeProfile) {
  sessionStorage.setItem(SIZE_PROFILE_KEY, JSON.stringify(profile));
}

export function loadSizePhotos(): SizePhotos | null {
  try {
    const raw = sessionStorage.getItem(SIZE_PHOTOS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as SizePhotos;
    return {
      ...parsed,
      profile: { ...emptySizeProfile(), ...(parsed.profile || {}) }
    };
  } catch {
    return null;
  }
}

export function dataUrlToBlob(dataUrl: string) {
  const [header, data] = dataUrl.split(",");
  const mime = /data:(.*?);/.exec(header)?.[1] || "image/jpeg";
  const bytes = atob(data);
  const buffer = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) buffer[i] = bytes.charCodeAt(i);
  return new Blob([buffer], { type: mime });
}

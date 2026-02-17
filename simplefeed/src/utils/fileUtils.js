import * as exifr from "exifr";

export function isoToDatetimeLocal(iso) {
  // Format ISO date for <input type="datetime-local">.
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function dateToISO(dateString) {
  if (!dateString) return "";
  return new Date(dateString).toISOString();
}

export async function parseExifData(file) {
  if (!file) return {};

  try {
    // Read only fields needed by the upload form.
    const exif = await exifr.parse(file, { gps: true });

    const result = {};

    // Prefer capture timestamp, then fall back to file modification metadata.
    const dt = exif?.DateTimeOriginal || exif?.CreateDate || exif?.ModifyDate;
    if (dt instanceof Date) {
      const pad = (n) => String(n).padStart(2, "0");
      result.takenAtLocal = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
    }

    // Preserve GPS values as strings for form state compatibility.
    if (typeof exif?.latitude === "number") result.lat = String(exif.latitude);
    if (typeof exif?.longitude === "number") result.lon = String(exif.longitude);

    return result;
  } catch {
    return {};
  }
}

export function createFilePreviewUrl(file) {
  if (!file) return null;
  return URL.createObjectURL(file);
}

export function revokeFilePreviewUrl(url) {
  // Revoke only blob URLs that were created client-side.
  if (url && url.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

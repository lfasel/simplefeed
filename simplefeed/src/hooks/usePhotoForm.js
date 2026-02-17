import { useState } from "react";
import { parseExifData, createFilePreviewUrl, revokeFilePreviewUrl, isoToDatetimeLocal } from "../utils/fileUtils";

export function usePhotoForm() {
  // Modal field state.
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [takenAtLocal, setTakenAtLocal] = useState("");
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [previewUrl, setPreviewUrl] = useState(null);

  async function handleNewFile(f) {
    setFile(f);
    if (!f) return;

    // Clean up old preview
    revokeFilePreviewUrl(previewUrl);
    setPreviewUrl(createFilePreviewUrl(f));

    // Reset fields
    setTakenAtLocal("");
    setLat("");
    setLon("");
    setLocationName("");
    setCaption("");

    // Seed fields from EXIF when available.
    const exifData = await parseExifData(f);
    if (exifData.takenAtLocal) setTakenAtLocal(exifData.takenAtLocal);
    if (exifData.lat) setLat(exifData.lat);
    if (exifData.lon) setLon(exifData.lon);
  }

  function prefillFromPhoto(photo) {
    // Preload current values when editing an existing photo.
    setCaption(photo.caption ?? "");
    setLocationName(photo.locationName ?? "");
    setTakenAtLocal(isoToDatetimeLocal(photo.takenAt));
    setLat(photo.lat != null ? String(photo.lat) : "");
    setLon(photo.lon != null ? String(photo.lon) : "");
    setPreviewUrl(photo.feedUrl);
    setFile(null);
  }

  function resetForm() {
    // Revoke temporary blob URLs to avoid memory leaks.
    setCaption("");
    setFile(null);
    setTakenAtLocal("");
    setLocationName("");
    setLat("");
    setLon("");
    revokeFilePreviewUrl(previewUrl);
    setPreviewUrl(null);
  }

  function createFormData() {
    // Keep payload schema aligned with backend API contract.
    const form = new FormData();
    if (file) form.append("image", file);
    form.append("caption", caption);
    
    if (takenAtLocal) {
      form.append("takenAt", new Date(takenAtLocal).toISOString());
    }
    
    form.append("locationName", locationName);
    form.append("lat", lat);
    form.append("lon", lon);
    
    return form;
  }

  return {
    caption,
    setCaption,
    file,
    setFile,
    takenAtLocal,
    setTakenAtLocal,
    locationName,
    setLocationName,
    previewUrl,
    setPreviewUrl,
    handleNewFile,
    prefillFromPhoto,
    resetForm,
    createFormData,
  };
}

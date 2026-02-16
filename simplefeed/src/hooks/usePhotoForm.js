import { useState } from "react";
import { parseExifData, createFilePreviewUrl, revokeFilePreviewUrl, isoToDatetimeLocal } from "../utils/fileUtils";

export function usePhotoForm() {
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

    // Parse EXIF data
    const exifData = await parseExifData(f);
    if (exifData.takenAtLocal) setTakenAtLocal(exifData.takenAtLocal);
    if (exifData.lat) setLat(exifData.lat);
    if (exifData.lon) setLon(exifData.lon);
  }

  function prefillFromPhoto(photo) {
    setCaption(photo.caption ?? "");
    setLocationName(photo.locationName ?? "");
    setTakenAtLocal(isoToDatetimeLocal(photo.takenAt));
    setLat(photo.lat != null ? String(photo.lat) : "");
    setLon(photo.lon != null ? String(photo.lon) : "");
    setPreviewUrl(photo.feedUrl);
    setFile(null);
  }

  function resetForm() {
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

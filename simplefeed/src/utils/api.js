//const API = "http://localhost:4000";
import { supabase } from "./supabaseClient";

const BUCKET = "photos";
const SIGNED_URL_TTL = 60 * 60; // 1 hour
const GRID_MAX_SIZE = 480;
const FEED_MAX_SIZE = 1400;
const GRID_QUALITY = 0.7;
const FEED_QUALITY = 0.8;

function makeBaseName(file) {
  const rand = Math.random().toString(36).slice(2, 10);
  const safeName = (file?.name || "image").replace(/[^a-zA-Z0-9_-]+/g, "-");
  return `${Date.now()}-${rand}-${safeName}`;
}

function compressImage(file, maxSize, quality) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const scale = Math.min(1, maxSize / img.width, maxSize / img.height);
      const width = Math.max(1, Math.round(img.width * scale));
      const height = Math.max(1, Math.round(img.height * scale));

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        URL.revokeObjectURL(objectUrl);
        reject(new Error("Canvas not supported"));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          URL.revokeObjectURL(objectUrl);
          if (!blob) {
            reject(new Error("Image compression failed"));
            return;
          }
          resolve(blob);
        },
        "image/jpeg",
        quality
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Invalid image file"));
    };

    img.src = objectUrl;
  });
}

export async function loadPhotos() {
  const { data: rows, error } = await supabase
    .from("photos")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;

  // Add signed URLs for each photo
  const withUrls = await Promise.all(
    rows.map(async (r) => {
      const { data: gridData, error: gridError } = await supabase
        .storage
        .from(BUCKET)
        .createSignedUrl(r.storage_path_grid, SIGNED_URL_TTL);

      if (gridError) throw gridError;

      const { data: feedData, error: feedError } = await supabase
        .storage
        .from(BUCKET)
        .createSignedUrl(r.storage_path_feed, SIGNED_URL_TTL);

      if (feedError) throw feedError;

      return {
        id: r.id,
        gridUrl: gridData.signedUrl,
        feedUrl: feedData.signedUrl,
        caption: r.caption,
        createdAt: r.created_at,
        takenAt: r.taken_at,
        lat: r.lat,
        lon: r.lon,
        locationName: r.location_name,
        storagePathGrid: r.storage_path_grid,
        storagePathFeed: r.storage_path_feed,
      };
    })
  );

  return withUrls;
}

export async function handleUpload(formData) {
  const file = formData.get("image");
  if (!file) throw new Error("Missing image file");

  const baseName = makeBaseName(file);
  const gridPath = `${baseName}-grid.jpg`;
  const feedPath = `${baseName}-feed.jpg`;

  const [gridBlob, feedBlob] = await Promise.all([
    compressImage(file, GRID_MAX_SIZE, GRID_QUALITY),
    compressImage(file, FEED_MAX_SIZE, FEED_QUALITY),
  ]);

  const { error: uploadGridError } = await supabase
    .storage
    .from(BUCKET)
    .upload(gridPath, gridBlob, { contentType: "image/jpeg" });

  if (uploadGridError) throw uploadGridError;

  const { error: uploadFeedError } = await supabase
    .storage
    .from(BUCKET)
    .upload(feedPath, feedBlob, { contentType: "image/jpeg" });

  if (uploadFeedError) throw uploadFeedError;

  const { error: insertError } = await supabase
    .from("photos")
    .insert({
      storage_path_grid: gridPath,
      storage_path_feed: feedPath,
      caption: formData.get("caption") ?? "",
      taken_at: formData.get("takenAt") || null,
      lat: formData.get("lat") ? Number(formData.get("lat")) : null,
      lon: formData.get("lon") ? Number(formData.get("lon")) : null,
      location_name: formData.get("locationName") || null,
    });

  if (insertError) throw insertError;
}

export async function handleUpdate(photoId, formData, existingPaths) {
  const file = formData.get("image");
  let gridPath = existingPaths?.grid;
  let feedPath = existingPaths?.feed;

  if (file) {
    const baseName = makeBaseName(file);
    const newGridPath = `${baseName}-grid.jpg`;
    const newFeedPath = `${baseName}-feed.jpg`;

    const [gridBlob, feedBlob] = await Promise.all([
      compressImage(file, GRID_MAX_SIZE, GRID_QUALITY),
      compressImage(file, FEED_MAX_SIZE, FEED_QUALITY),
    ]);

    const { error: uploadGridError } = await supabase
      .storage
      .from(BUCKET)
      .upload(newGridPath, gridBlob, { contentType: "image/jpeg" });

    if (uploadGridError) throw uploadGridError;

    const { error: uploadFeedError } = await supabase
      .storage
      .from(BUCKET)
      .upload(newFeedPath, feedBlob, { contentType: "image/jpeg" });

    if (uploadFeedError) throw uploadFeedError;

    // delete old files
    const toRemove = [];
    if (gridPath) toRemove.push(gridPath);
    if (feedPath) toRemove.push(feedPath);
    if (toRemove.length) {
      await supabase.storage.from(BUCKET).remove(toRemove);
    }

    gridPath = newGridPath;
    feedPath = newFeedPath;
  }

  const { error: updateError } = await supabase
    .from("photos")
    .update({
      storage_path_grid: gridPath,
      storage_path_feed: feedPath,
      caption: formData.get("caption") ?? "",
      taken_at: formData.get("takenAt") || null,
      lat: formData.get("lat") ? Number(formData.get("lat")) : null,
      lon: formData.get("lon") ? Number(formData.get("lon")) : null,
      location_name: formData.get("locationName") || null,
    })
    .eq("id", photoId);

  if (updateError) throw updateError;
}


export async function handleDelete(photoId, paths) {
  const toRemove = [];
  if (paths?.grid) toRemove.push(paths.grid);
  if (paths?.feed) toRemove.push(paths.feed);
  if (toRemove.length) {
    const { error: removeError } = await supabase
      .storage
      .from(BUCKET)
      .remove(toRemove);

    if (removeError) throw removeError;
  }

  const { error } = await supabase
    .from("photos")
    .delete()
    .eq("id", photoId);

  if (error) throw error;
}


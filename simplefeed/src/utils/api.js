const API = "http://localhost:4000";

export async function loadPhotos() {
  const res = await fetch(`${API}/api/photos`);
  const data = await res.json();
  return data;
}

export async function handleUpload(formData) {
  const res = await fetch(`${API}/api/photos`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Upload failed");
  return res.json();
}

export async function handleUpdate(photoId, formData) {
  const res = await fetch(`${API}/api/photos/${photoId}`, {
    method: "PUT",
    body: formData,
  });

  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

export async function handleDelete(photoId) {
  const res = await fetch(`${API}/api/photos/${photoId}`, {
    method: "DELETE",
  });

  if (!res.ok) throw new Error("Delete failed");
  return res.json();
}

export function getAPIUrl() {
  return API;
}

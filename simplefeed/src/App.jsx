import { useEffect, useRef, useState } from "react";
import "./App.css";
import * as exifr from "exifr";

const API = "http://localhost:4000";

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [takenAtLocal, setTakenAtLocal] = useState("");
  const [locationName, setLocationName] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [viewMode, setViewMode] = useState("feed"); // "feed" | "grid"
  const postRefs = useRef(new Map());
  const [editingPhoto, setEditingPhoto] = useState(null); // holds photo object or null


  function setPostRef(id) {
    return (el) => {
      if (el) postRefs.current.set(id, el);
      else postRefs.current.delete(id);
    };
  }

  function goToPhoto(id) {
    setViewMode("feed");
    // wait for feed render, then scroll
    setTimeout(() => {
      const el = postRefs.current.get(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }


  async function loadPhotos() {
    const res = await fetch(`${API}/api/photos`);
    const data = await res.json();
    setPhotos(data);
  }

  useEffect(() => {
    loadPhotos();
  }, []);

  function isoToDatetimeLocal(iso) {
    if (!iso) return "";
    const d = new Date(iso);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  function openEdit(p) {
    setEditingPhoto(p);
    setIsUploadOpen(true);

    // Prefill fields
    setCaption(p.caption ?? "");
    setLocationName(p.locationName ?? "");
    setTakenAtLocal(isoToDatetimeLocal(p.takenAt));
    setLat(p.lat != null ? String(p.lat) : "");
    setLon(p.lon != null ? String(p.lon) : "");

    // Show current image as preview
    setPreviewUrl(`${API}${p.url}`);
    setFile(null); // optional: user can choose a replacement image
  }

  useEffect(() => {
  function hasFiles(e) {
    return Array.from(e.dataTransfer?.types || []).includes("Files");
  }

  function onDragEnter(e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    setIsDraggingFile(true);
  }

  function onDragOver(e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
  }

  function onDragLeave(e) {
    // Only close when leaving window
    if (e.target === document.documentElement) setIsDraggingFile(false);
  }

  async function onDrop(e) {
    if (!hasFiles(e)) return;
    e.preventDefault();
    setIsDraggingFile(false);

    const dropped = e.dataTransfer.files?.[0];
    if (dropped) {
      setIsUploadOpen(true);
      await handleNewFile(dropped);
    }
  }

  window.addEventListener("dragenter", onDragEnter);
  window.addEventListener("dragover", onDragOver);
  window.addEventListener("dragleave", onDragLeave);
  window.addEventListener("drop", onDrop);

  return () => {
    window.removeEventListener("dragenter", onDragEnter);
    window.removeEventListener("dragover", onDragOver);
    window.removeEventListener("dragleave", onDragLeave);
    window.removeEventListener("drop", onDrop);
  };
}, []);


  async function handleUpload(e) {
    e.preventDefault();
    if (!file) return;

    setLoading(true);
    try {
      let takenAtISO = "";
      if (takenAtLocal) {
        takenAtISO = new Date(takenAtLocal).toISOString();
      }
      const form = new FormData();
      form.append("image", file);
      form.append("caption", caption);
      form.append("takenAt", takenAtISO);
      form.append("locationName", locationName);
      form.append("lat", lat);
      form.append("lon", lon);

      const res = await fetch(`${API}/api/photos`, {
        method: "POST",
        body: form,
      });

      if (!res.ok) throw new Error("Upload failed");
      setCaption("");
      setFile(null);
      setTakenAtLocal("");
      setLocationName("");
      setLat("");
      setLon("");
      await loadPhotos();
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(photoId) {
    setLoading(true);
    try {
      let takenAtISO = "";
      if (takenAtLocal) {
        takenAtISO = new Date(takenAtLocal).toISOString();
      }
      const form = new FormData();
      if (file) form.append("image", file);
      form.append("caption", caption);
      form.append("takenAt", takenAtISO);
      form.append("locationName", locationName);
      form.append("lat", lat);
      form.append("lon", lon);

      const res = await fetch(`${API}/api/photos/${photoId}`, {
        method: "PUT",
        body: form,
      });

      if (!res.ok) throw new Error("Update failed");
      setCaption("");
      setFile(null);
      setTakenAtLocal("");
      setLocationName("");
      setLat("");
      setLon("");
      await loadPhotos();
    } finally {
      setLoading(false);
    }
  }

  function closeUploadModal() {
    setIsUploadOpen(false);
    setEditingPhoto(null);
    setFile(null);
    setPreviewUrl((prev) => {
      if (prev && prev.startsWith("blob:")) URL.revokeObjectURL(prev);
      return null;
    });
  }


  async function handleNewFile(f) {
    setFile(f);
    if (!f) return;

    // Clean up old preview (important to avoid memory leaks)
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return URL.createObjectURL(f);
    });

    // Reset fields
    setTakenAtLocal("");
    setLat("");
    setLon("");
    setLocationName("");
    setCaption("");

    try {
      const exif = await exifr.parse(f, { gps: true });

      const dt = exif?.DateTimeOriginal || exif?.CreateDate || exif?.ModifyDate;
      if (dt instanceof Date) {
        const pad = (n) => String(n).padStart(2, "0");
        const local = `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}T${pad(dt.getHours())}:${pad(dt.getMinutes())}`;
        setTakenAtLocal(local);
      }

      if (typeof exif?.latitude === "number") setLat(String(exif.latitude));
      if (typeof exif?.longitude === "number") setLon(String(exif.longitude));
    } catch {
      // ignore
    }
  }


  async function handleDelete(photo) {
  const ok = window.confirm("Delete this photo? This cannot be undone.");
  if (!ok) return;

  const res = await fetch(`${API}/api/photos/${photo.id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    alert("Delete failed");
    return;
  }

  await loadPhotos();
  }


  return (
    
    <div className="page">
      <div className="container">
        <div className="topBar">
          <h1>Life in Pictures</h1>
          <button
            type="button"
            onClick={() => setIsUploadOpen(true)}
            className="addPhotoBtn"
            aria-label="Add photo"
          >
            +
          </button>
          
          <div className="viewModeButtons">
            <button
              type="button"
              onClick={() => setViewMode("feed")}
              disabled={viewMode === "feed"}
            >
              Feed
            </button>
            <button type="button" onClick={() => setViewMode("grid")} disabled={viewMode === "grid"}>Grid
            </button>
          </div>


          {isDraggingFile && (
            <div className="dragOverlay">
              Drop a photo to upload
            </div>
          )}

          {isUploadOpen && (
            <div
              onMouseDown={(e) => {
                // click outside closes
                if (e.target === e.currentTarget) closeUploadModal();
              }}
              className="modalOverlay"
            >
              <div className="modalContent">
                {previewUrl && (
                  <div className="previewContainer">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="previewImg"
                    />
                  </div>
                )}

                <div className="modalHeader">
                  <h2>Upload photo</h2>
                  <button type="button" onClick={() => closeUploadModal()} className="closeBtn">
                    ✕
                  </button>
                </div>
                
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    if (editingPhoto) {
                        await handleUpdate(editingPhoto.id);
                      } else {
                        await handleUpload(e);
                      }
                    closeUploadModal();
                  }}
                  className="uploadForm"
                >
                  <div style={{ fontSize: 12, opacity: 0.7 }}>
                    {editingPhoto ? "Replace image (optional)" : "Choose image"}
                  </div>
                  <input type="file" accept="image/*" onChange={(e) => handleNewFile(e.target.files?.[0] ?? null)} />

                  {file && (
                    <div className="formFileInfo">
                      Selected: <strong>{file.name}</strong>
                    </div>
                  )}

                  <input placeholder="Caption" value={caption} onChange={(e) => setCaption(e.target.value)} />
                  <input placeholder="Location name (optional)" value={locationName} onChange={(e) => setLocationName(e.target.value)} />
                  <input type="datetime-local" value={takenAtLocal} onChange={(e) => setTakenAtLocal(e.target.value)} />

                  <div className="coordInputs">
                    <input placeholder="Latitude (optional)" value={lat} onChange={(e) => setLat(e.target.value)} />
                    <input placeholder="Longitude (optional)" value={lon} onChange={(e) => setLon(e.target.value)} />
                  </div>

                  <div className="formActions">
                    <button type="button" onClick={() => closeUploadModal()}>
                      Cancel
                    </button>
                    <button disabled={!file || loading}>
                      {loading ? "Uploading..." : "Upload"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

        </div>
      </div>
      {viewMode==="feed" ? (
      <div className="photoFeed">
        {photos.map((p) => (
          <div className="post" key={p.id} ref={setPostRef(p.id)}>
            <article className="card">
              <div className="photoFrame">
                <img className="photo" src={`${API}${p.url}`} alt={p.caption} />
              </div>
              <div className="meta">
                <div className="photoCaption">{p.caption}</div>
                {p.takenAt && (
                <div className="photoDate">
                  {new Date(p.takenAt).toLocaleString()}
                </div>)}
                {p.locationName && (
                  <div className="photoLocation">
                    {p.locationName} {p.lat && p.lon && `(${p.lat.toFixed(4)}, ${p.lon.toFixed(4)})`}
                  </div>
                )}
                <button type="button" onClick={() => openEdit(p)} style={{ marginTop: 10 }}>Edit</button>
                <button onClick={() => handleDelete(p)} className="deleteBtn">Delete</button>
              </div>
            </article>
          </div>
        ))}
      </div>
      ) : (
        <div className="grid">
          {photos.map((p) => (
            <div className="gridItem" key={p.id} onClick={() => goToPhoto(p.id)} style={{cursor: "pointer"}}>
              <img className="gridImg" src={`${API}${p.url}`} alt="" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

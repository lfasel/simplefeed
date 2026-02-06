import { useEffect, useRef, useState } from "react";
import "./App.css";
import { loadPhotos as fetchPhotos, handleUpload as uploadPhoto, handleUpdate as updatePhoto, handleDelete as deletePhoto } from "./utils/api.js";
import { useDragDrop } from "./hooks/useDragDrop.js";
import { usePhotoForm } from "./hooks/usePhotoForm.js";
import Header from "./components/Header.jsx";
import UploadModal from "./components/UploadModal.jsx";
import PhotoFeed from "./components/PhotoFeed.jsx";
import PhotoGrid from "./components/PhotoGrid.jsx";

export default function App() {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [viewMode, setViewMode] = useState("feed");
  const [editingPhoto, setEditingPhoto] = useState(null);
  const postRefs = useRef(new Map());

  const form = usePhotoForm();

  // Load photos on mount
  useEffect(() => {
    (async () => {
      const data = await fetchPhotos();
      setPhotos(data);
    })();
  }, []);

  // Setup drag-drop
  useDragDrop(
    () => setIsDraggingFile(true),
    () => setIsDraggingFile(false),
    null,
    async (file) => {
      setIsUploadOpen(true);
      await form.handleNewFile(file);
    }
  );

  function openEdit(photo) {
    setEditingPhoto(photo);
    setIsUploadOpen(true);
    form.prefillFromPhoto(photo);
  }

  function closeUploadModal() {
    setIsUploadOpen(false);
    setEditingPhoto(null);
    form.resetForm();
  }

  async function handleFormSubmit(e) {
    e.preventDefault();
    if (!editingPhoto && !form.file) return;

    setLoading(true);
    try {
      const formData = form.createFormData();

      if (editingPhoto) {
        await updatePhoto(editingPhoto.id, formData);
      } else {
        await uploadPhoto(formData);
      }

      const data = await fetchPhotos();
      setPhotos(data);
      closeUploadModal();
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeletePhoto(photo) {
    const ok = window.confirm("Delete this photo? This cannot be undone.");
    if (!ok) return;

    try {
      await deletePhoto(photo.id);
      const data = await fetchPhotos();
      setPhotos(data);
    } catch (error) {
      alert(error.message);
    }
  }

  function goToPhoto(id) {
    setViewMode("feed");
    setTimeout(() => {
      const el = postRefs.current.get(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }


  return (
    <div className="page">
      <Header
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onAddPhoto={() => setIsUploadOpen(true)}
        isDraggingFile={isDraggingFile}
      />

      <div className="content">
        {viewMode === "feed" ? (
          <PhotoFeed photos={photos} postRefs={postRefs} onEdit={openEdit} onDelete={handleDeletePhoto} />
        ) : (
          <PhotoGrid photos={photos} onPhotoClick={goToPhoto} />
        )}
      </div>

      <UploadModal
        isOpen={isUploadOpen}
        editingPhoto={editingPhoto}
        previewUrl={form.previewUrl}
        file={form.file}
        caption={form.caption}
        locationName={form.locationName}
        takenAtLocal={form.takenAtLocal}
        lat={form.lat}
        lon={form.lon}
        loading={loading}
        onClose={closeUploadModal}
        onFileChange={(e) => form.handleNewFile(e.target.files?.[0] ?? null)}
        onCaptionChange={(e) => form.setCaption(e.target.value)}
        onLocationNameChange={(e) => form.setLocationName(e.target.value)}
        onTakenAtLocalChange={(e) => form.setTakenAtLocal(e.target.value)}
        onLatChange={(e) => form.setLat(e.target.value)}
        onLonChange={(e) => form.setLon(e.target.value)}
        onSubmit={handleFormSubmit}
      />
    </div>
  );
}

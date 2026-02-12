import { useEffect, useRef, useState } from "react";
import "./App.css";
import { loadPhotos as fetchPhotos, handleUpload as uploadPhoto, handleUpdate as updatePhoto, handleDelete as deletePhoto } from "./utils/api.js";
import { useDragDrop } from "./hooks/useDragDrop.js";
import { usePhotoForm } from "./hooks/usePhotoForm.js";
import Header from "./components/Header.jsx";
import UploadModal from "./components/UploadModal.jsx";
import PhotoFeed from "./components/PhotoFeed.jsx";
import PhotoGrid from "./components/PhotoGrid.jsx";
import { supabase } from "./utils/supabaseClient.js";

export default function App() {
  const [session, setSession] = useState(null);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMode, setAuthMode] = useState("signin");
  const [authError, setAuthError] = useState("");
  const [authInfo, setAuthInfo] = useState("");
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [viewMode, setViewMode] = useState("feed");
  const [editingPhoto, setEditingPhoto] = useState(null);
  const postRefs = useRef(new Map());
  const userId = session?.user?.id ?? null;

  const form = usePhotoForm();

  // Auth session
  useEffect(() => {
    let isMounted = true;

    supabase.auth.getSession().then(({ data, error }) => {
      if (!isMounted) return;
      if (error) setAuthError(error.message);
      setSession(data?.session ?? null);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => {
      isMounted = false;
      sub?.subscription?.unsubscribe();
    };
  }, []);

  // Load photos after login
  useEffect(() => {
    if (!userId) return;
    (async () => {
      const data = await fetchPhotos();
      setPhotos(data);
    })();
  }, [userId]);

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
        await updatePhoto(editingPhoto.id, formData, {
          grid: editingPhoto.storagePathGrid,
          feed: editingPhoto.storagePathFeed,
        });
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
      await deletePhoto(photo.id, {
        grid: photo.storagePathGrid,
        feed: photo.storagePathFeed,
      });
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

  async function handleAuthSubmit(e) {
    e.preventDefault();
    setAuthError("");
    setAuthInfo("");

    if (authMode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({
        email: authEmail,
        password: authPassword,
      });
      if (error) setAuthError(error.message);
      return;
    }

    const { data, error } = await supabase.auth.signUp({
      email: authEmail,
      password: authPassword,
    });

    if (error) {
      setAuthError(error.message);
      return;
    }

    if (data?.session) {
      setAuthInfo("Account created. You are signed in.");
      return;
    }

    setAuthInfo("Account created. Check your email to confirm, then sign in.");
    setAuthMode("signin");
  }

  async function handleLogout() {
    setAuthError("");
    setAuthInfo("");
    await supabase.auth.signOut();
  }

  function toggleAuthMode() {
    setAuthMode((prev) => (prev === "signin" ? "signup" : "signin"));
    setAuthError("");
    setAuthInfo("");
  }

  if (!session) {
    return (
      <div className="page">
        <div className="content authContent">
          <h2>{authMode === "signin" ? "Sign in" : "Create account"}</h2>
          <form onSubmit={handleAuthSubmit}>
            <div className="authFields">
              <input
                type="email"
                placeholder="Email"
                value={authEmail}
                onChange={(e) => setAuthEmail(e.target.value)}
                autoComplete="email"
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={authPassword}
                onChange={(e) => setAuthPassword(e.target.value)}
                autoComplete={authMode === "signin" ? "current-password" : "new-password"}
                minLength={6}
                required
              />
              <button type="submit">
                {authMode === "signin" ? "Sign in" : "Create account"}
              </button>
              {authError ? <div className="authError">{authError}</div> : null}
              {authInfo ? <div className="authInfo">{authInfo}</div> : null}
              <button type="button" className="authSwitchBtn" onClick={toggleAuthMode}>
                {authMode === "signin"
                  ? "Need an account? Create one"
                  : "Already have an account? Sign in"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
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

      <div className="signOutArea">
        <button onClick={handleLogout}>Sign out</button>
      </div>
    </div>
  );
}

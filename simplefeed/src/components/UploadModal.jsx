export default function UploadModal({
  isOpen,
  editingPhoto,
  previewUrl,
  file,
  caption,
  locationName,
  takenAtLocal,
  lat,
  lon,
  loading,
  onClose,
  onFileChange,
  onCaptionChange,
  onLocationNameChange,
  onTakenAtLocalChange,
  onLatChange,
  onLonChange,
  onSubmit,
}) {
  if (!isOpen) return null;

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="modalOverlay"
    >
      <div className="modalContent">
        {previewUrl && (
          <div className="previewContainer">
            <img src={previewUrl} alt="Preview" className="previewImg" />
          </div>
        )}

        <div className="modalHeader">
          <h2>{editingPhoto ? "Edit photo" : "Upload photo"}</h2>
          <button type="button" onClick={onClose} className="closeBtn">
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit} className="uploadForm">
          <div className="uploadHint">
            {editingPhoto ? "Replace image (optional)" : "Choose image"}
          </div>
          <input type="file" accept="image/*" onChange={onFileChange} />

          {file && (
            <div className="formFileInfo">
              Selected: <strong>{file.name}</strong>
            </div>
          )}

          <input placeholder="Caption" value={caption} onChange={onCaptionChange} />
          <input
            placeholder="Location name (optional)"
            value={locationName}
            onChange={onLocationNameChange}
          />
          <input
            type="datetime-local"
            value={takenAtLocal}
            onChange={onTakenAtLocalChange}
          />

          <div className="coordInputs">
            <input
              placeholder="Latitude (optional)"
              value={lat}
              onChange={onLatChange}
            />
            <input
              placeholder="Longitude (optional)"
              value={lon}
              onChange={onLonChange}
            />
          </div>

          <div className="formActions">
            <button type="button" onClick={onClose}>
              Cancel
            </button>
            <button disabled={(!editingPhoto && !file) || loading}>
              {loading ? "Saving..." : editingPhoto ? "Save" : "Upload"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

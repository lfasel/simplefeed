export default function Header({
  viewMode,
  onViewModeChange,
  onAddPhoto,
  isDraggingFile,
}) {
  return (
    <header className="header">
      <div className="headerContent">
        <h1 className="headerTitle">Life in Pictures</h1>

        <div className="headerControls">
          <button
            type="button"
            onClick={onAddPhoto}
            className="addPhotoBtn"
            aria-label="Add photo"
            title="Add a new photo"
          >
            +
          </button>

          <div className="viewModeButtons">
            <button
              type="button"
              onClick={() => onViewModeChange("feed")}
              className={viewMode === "feed" ? "active" : ""}
              aria-label="Switch to feed view"
            >
              Feed
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={viewMode === "grid" ? "active" : ""}
              aria-label="Switch to grid view"
            >
              Grid
            </button>
          </div>
        </div>
      </div>

      {isDraggingFile && (
        <div className="dragOverlay">
          Drop a photo to upload
        </div>
      )}
    </header>
  );
}

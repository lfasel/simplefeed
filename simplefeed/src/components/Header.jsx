import addIcon from "../assets/add.svg";
import feedIcon from "../assets/feed.svg";
import gridIcon from "../assets/grid.svg";
import lifeIcon from "../assets/life.svg";

export default function Header({
  viewMode,
  onViewModeChange,
  onAddPhoto,
  isDraggingFile,
}) {
  return (
    <header className="header">
      <div className="headerContent">
        <div className="headerTitle">
          <img src={lifeIcon} alt="Life" className="headerTitleIcon" />
          <div className="headerSubtitle">photo album</div>
        </div>

        <div className="headerControls">
          <div className="headerAdd">
            <button
              type="button"
              onClick={onAddPhoto}
              className="headerBtn addPhotoBtn"
              aria-label="Add photo"
              title="Add a new photo"
            >
              <img src={addIcon} alt="" aria-hidden="true" />
            </button>
          </div>

          <div className="viewModeButtons">
            <button
              type="button"
              onClick={() => onViewModeChange("feed")}
              className={viewMode === "feed" ? "active" : ""}
              aria-label="Switch to feed view"
            >
              <img src={feedIcon} alt="" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange("grid")}
              className={viewMode === "grid" ? "active" : ""}
              aria-label="Switch to grid view"
            >
              <img src={gridIcon} alt="" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>

      {isDraggingFile && (
        <div className="dragOverlay">
          {/* Global drag state is managed by the drag/drop hook in App. */}
          Drop a photo to upload
        </div>
      )}
    </header>
  );
}

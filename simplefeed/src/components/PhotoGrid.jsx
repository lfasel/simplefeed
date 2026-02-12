import { useEffect, useState } from "react";

function GridImage({ photo, onPhotoClick }) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);

  useEffect(() => {
    setIsImageLoaded(false);
  }, [photo.gridUrl]);

  return (
    <div className="gridItem gridItemClickable" onClick={() => onPhotoClick(photo.id)}>
      {!isImageLoaded && (
        <div className="imageLoadingOverlay" aria-hidden="true">
          <div className="loadingSpinner loadingSpinnerSmall" />
        </div>
      )}
      <img
        className={`gridImg ${isImageLoaded ? "isLoaded" : ""}`}
        src={photo.gridUrl}
        alt=""
        onLoad={() => setIsImageLoaded(true)}
        onError={() => setIsImageLoaded(true)}
      />
    </div>
  );
}

export default function PhotoGrid({ photos, onPhotoClick }) {
  return (
    <div className="grid">
      {photos.map((p) => (
        <GridImage key={p.id} photo={p} onPhotoClick={onPhotoClick} />
      ))}
    </div>
  );
}

import { getAPIUrl } from "../utils/api.js";

export default function PhotoCard({ photo, onEdit, onDelete }) {
  const API = getAPIUrl();

  return (
    <article className="card">
      <div className="photoFrame">
        <img className="photo" src={`${API}${photo.url}`} alt={photo.caption} />
      </div>
      <div className="meta">
        <div className="photoCaption">{photo.caption}</div>
        {photo.takenAt && (
          <div className="photoDate">
            {new Date(photo.takenAt).toLocaleString()}
          </div>
        )}
        {photo.locationName && (
          <div className="photoLocation">
            {photo.locationName} {photo.lat && photo.lon && `(${photo.lat.toFixed(4)}, ${photo.lon.toFixed(4)})`}
          </div>
        )}
        <button type="button" onClick={() => onEdit(photo)} style={{ marginTop: 10 }}>
          Edit
        </button>
        <button onClick={() => onDelete(photo)} className="deleteBtn">
          Delete
        </button>
      </div>
    </article>
  );
}

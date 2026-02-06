import { getAPIUrl } from "../utils/api.js";
import editIcon from "../assets/edit.svg";
import deleteIcon from "../assets/delete.svg";

export default function PhotoCard({ photo, onEdit, onDelete }) {
  const API = getAPIUrl();

  return (
    <article className="card">
      <div className="photoFrame">
        <img className="photo" src={`${API}${photo.url}`} alt={photo.caption} />
      </div>
      <div className="meta">
        <div className="photoMetaActionsRow">
          <div className="photoMetaBlock">
            <div className="photoCaption">{photo.caption}</div>
            {(photo.takenAt || photo.locationName) && (
              <div className="photoMetaRow">
                {photo.takenAt && (
                  <div className="photoDate">
                    {new Date(photo.takenAt).toLocaleDateString()}
                  </div>
                )}
                {photo.locationName && (
                  <div className="photoLocation">
                    {photo.takenAt && " \u2014  "}
                    {photo.locationName} {photo.lat && photo.lon && `(${photo.lat.toFixed(4)}, ${photo.lon.toFixed(4)})`}
                  </div>
                )}
              </div>
            )}
          </div>
          <div className="photoActions">
            <button
              type="button"
              onClick={() => onEdit(photo)}
              className="actionBtn"
              aria-label="Edit photo"
              title="Edit photo"
            >
              <img src={editIcon} alt="" aria-hidden="true" />
            </button>
            <button
              onClick={() => onDelete(photo)}
              className="actionBtn danger"
              aria-label="Delete photo"
              title="Delete photo"
            >
              <img src={deleteIcon} alt="" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

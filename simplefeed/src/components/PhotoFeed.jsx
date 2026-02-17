import PhotoCard from "./PhotoCard";

export default function PhotoFeed({ photos, postRefs, onEdit, onDelete }) {
  return (
    <div className="photoFeed">
      {photos.map((p) => (
        <div className="post" key={p.id} ref={(el) => {
          // Track rendered post nodes so grid taps can scroll to exact cards.
          if (el) postRefs.current.set(p.id, el);
          else postRefs.current.delete(p.id);
        }}>
          <PhotoCard photo={p} onEdit={onEdit} onDelete={onDelete} />
        </div>
      ))}
    </div>
  );
}

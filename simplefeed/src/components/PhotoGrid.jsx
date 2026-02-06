export default function PhotoGrid({ photos, onPhotoClick }) {
  return (
    <div className="grid">
      {photos.map((p) => (
        <div className="gridItem" key={p.id} onClick={() => onPhotoClick(p.id)} style={{ cursor: "pointer" }}>
          <img className="gridImg" src={`http://localhost:4000${p.url}`} alt="" />
        </div>
      ))}
    </div>
  );
}

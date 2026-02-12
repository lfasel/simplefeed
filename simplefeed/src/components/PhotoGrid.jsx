export default function PhotoGrid({ photos, onPhotoClick }) {
  return (
    <div className="grid">
      {photos.map((p) => (
        <div className="gridItem gridItemClickable" key={p.id} onClick={() => onPhotoClick(p.id)}>
          <img className="gridImg" src={p.gridUrl} alt="" />
        </div>
      ))}
    </div>
  );
}

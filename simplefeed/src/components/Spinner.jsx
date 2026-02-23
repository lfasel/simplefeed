import spinnerSvg from "../assets/spinner.svg?raw";

export default function Spinner({ small = false, className = "" }) {
  const classes = ["loadingSpinner", small ? "loadingSpinnerSmall" : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <span
      className={classes}
      aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: spinnerSvg }}
    />
  );
}

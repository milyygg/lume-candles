export function Arrow({
  direction = "right",
}: {
  direction?: "right" | "left";
}) {
  return (
    <svg
      className={`arrow-icon ${direction === "left" ? "arrow-left" : ""}`}
      width="28"
      height="18"
      viewBox="0 0 28 18"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M1 9h25M19 2l7 7-7 7"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function formatTime(timestamp) {
  if (!timestamp) return "-";

  const date = new Date(timestamp);

  const options = {
    year: "numeric",
    month: "short", // Jan, Feb, etc.
    day: "2-digit"
  };

  return date.toLocaleDateString("en-US", options);
}

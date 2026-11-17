export default function LibraryDirections({ library }) {
  if (!library) return null;

  const coordinates = library.location?.coordinates;

  const hasCoordinates =
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    coordinates.every(
      (value) => typeof value === "number" && Number.isFinite(value)
    );

  const address = [
    library.name,
    library.address,
    library.area,
    library.city,
    library.pincode,
  ]
    .filter(Boolean)
    .join(", ");

  if (!hasCoordinates && !address) return null;

  // Your MongoDB schema stores [longitude, latitude].
  // Google Maps directions use latitude,longitude.
  const destination = hasCoordinates
    ? `${coordinates[1]},${coordinates[0]}`
    : address;

  const directionsUrl =
    "https://www.google.com/maps/dir/?api=1&destination=" +
    encodeURIComponent(destination);

  return (
    <a
      href={directionsUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="library-directions-button"
    >
      Get directions
    </a>
  );
}
import { useParams, useLocation } from "react-router-dom";

export default function EbookReader() {
  const { id } = useParams();
  const location = useLocation();

  const ebookLink = location.state?.ebookLink;

  if (!ebookLink) {
    return (
      <div className="p-10 text-center">
        <h2 className="text-xl font-semibold">
          eBook link not available.
        </h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-5xl mx-auto p-4">
        <div className="bg-white rounded-xl shadow p-4">
          <h2 className="text-xl font-semibold mb-4">
            eBook Reader
          </h2>

          <iframe
            src={ebookLink}
            className="w-full h-[80vh] rounded-lg border"
            title="eBook Reader"
          />
        </div>
      </div>
    </div>
  );
}
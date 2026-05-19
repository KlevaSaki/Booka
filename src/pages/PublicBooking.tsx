import { MapPin } from "lucide-react";
import { useParams } from "react-router-dom";
import { useBusinessStore } from "../features/business/store";
import BookingForm from "../features/bookings/components/BookingForm";

export default function PublicBooking() {
  const { slug } = useParams();

  const getBusinessBySlug = useBusinessStore((s) => s.getBusinessBySlug);
  const business = getBusinessBySlug(slug || "");

  if (!business) {
    return (
      <main className="min-h-screen bg-[#F7FAF8] px-4 py-20">
        <div className="mx-auto max-w-md rounded-xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900">
            Business not found
          </h2>
          <p className="mt-2 text-sm leading-6 text-gray-500">
            This booking link is invalid or expired.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#F7FAF8]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_420px] lg:px-8 lg:py-12">
        <section className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="relative h-72 bg-[#0F3D2E] sm:h-80">
            {business.images?.[0] ? (
              <img
                src={business.images[0]}
                alt={business.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center px-8 text-center">
                <h1 className="text-4xl font-semibold text-white">
                  {business.name}
                </h1>
              </div>
            )}

            <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/70 to-transparent p-6">
              <h1 className="text-3xl font-semibold tracking-tight text-white sm:text-4xl">
                {business.name}
              </h1>
            </div>
          </div>

          <div className="space-y-5 p-6 sm:p-8">
            {business.description && (
              <p className="max-w-2xl text-base leading-7 text-gray-600">
                {business.description}
              </p>
            )}

            {business.location && (
              <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
                <MapPin className="h-4 w-4 text-[#0F3D2E]" />
                <span>{business.location}</span>
              </div>
            )}
          </div>
        </section>

        <aside className="lg:sticky lg:top-8 lg:self-start">
          <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <BookingForm business={business} />
          </div>
        </aside>
      </div>
    </main>
  );
}
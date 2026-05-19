import { CalendarCheck } from "lucide-react";
import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen bg-[#FAF7EF] text-[#173D2F]">
      <header className="border-b border-[#D8D0BE] bg-[#0F3D2E]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#FAF7EF] text-[#0F3D2E]">
              <CalendarCheck className="h-5 w-5" />
            </div>

            <div>
              <h1 className="text-xl font-semibold tracking-tight text-[#FAF7EF]">
                Booka
              </h1>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#D8D0BE]">
                Online Booking
              </p>
            </div>
          </div>

          <span className="hidden rounded-full border border-[#FAF7EF]/30 px-3 py-1 text-xs font-medium text-[#FAF7EF] sm:inline-flex">
            Simple appointments
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-[#D8D0BE] py-6 text-center text-xs text-[#5F6F66]">
        Powered by <span className="font-semibold text-[#0F3D2E]">Booka</span>
      </footer>
    </div>
  );
}
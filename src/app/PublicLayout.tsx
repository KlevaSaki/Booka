import { CalendarCheck } from "lucide-react";
import { Outlet } from "react-router-dom";

export default function PublicLayout() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#FAF7EF] text-[#173D2F]">
      <header className="border-b border-[#D8D0BE] bg-[#0F3D2E]">
        <div className="mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-3 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#FAF7EF] text-[#0F3D2E]">
              <CalendarCheck className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h1 className="truncate text-xl font-semibold tracking-tight text-[#FAF7EF]">
                Booka
              </h1>
              <p className="truncate text-xs font-medium uppercase tracking-[0.18em] text-[#D8D0BE]">
                Booking made easy
              </p>
            </div>
          </div>

          <span className="hidden shrink-0 rounded-full border border-[#FAF7EF]/30 px-3 py-1 text-xs font-medium text-[#FAF7EF] sm:inline-flex">
            Simple appointments
          </span>
        </div>
      </header>

      <main className="mx-auto min-w-0 max-w-6xl overflow-x-hidden px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>

      <footer className="border-t border-[#D8D0BE] px-4 py-6 text-center text-xs text-[#5F6F66]">
        Powered by <span className="font-semibold text-[#0F3D2E]">Booka</span>
      </footer>
    </div>
  );
}
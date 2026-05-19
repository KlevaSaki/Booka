import { create } from "zustand";

export type Booking = {
  id: string;
  service: string;
  name: string;
  phone: string;
  businessSlug: string; // ⭐ CRITICAL
  datetime: string;
};

const STORAGE_KEY = "booka_bookings";

function loadBookings(): Booking[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveBookings(bookings: Booking[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

type BookingStore = {
  bookings: Booking[];

  addBooking: (booking: Omit<Booking, "id">) => void;

  clearBookings: () => void;

  getBookingsByBusiness: (slug: string) => Booking[];
};

export const useBookingStore = create<BookingStore>((set, get) => ({
  bookings: loadBookings(),

  addBooking: (bookingData) => {
    const newBooking: Booking = {
      id: crypto.randomUUID(),
      ...bookingData,
    };

    const updated = [...get().bookings, newBooking];

    saveBookings(updated);

    set({ bookings: updated });
  },

  clearBookings: () => {
    saveBookings([]);
    set({ bookings: [] });
  },

  getBookingsByBusiness: (slug) => {
    return get().bookings.filter(
      (b) => b.businessSlug === slug
    );
  },
}));
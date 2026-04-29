export type Booking = {
  id: string;
  service: string;
  time: string;
  name: string;
  phone: string;
};

const STORAGE_KEY = "booka_bookings";

// Load from localStorage
function loadBookings(): Booking[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? JSON.parse(data) : [];
}

// Save to localStorage
function saveBookings(bookings: Booking[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

// In-memory cache (keeps UI fast)
let bookings: Booking[] = loadBookings();

export function addBooking(booking: Booking) {
  bookings.push(booking);
  saveBookings(bookings);
}

export function getBookings() {
  return bookings;
}
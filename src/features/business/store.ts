import { create } from "zustand";

type Business = {
  id: string;
  name: string;
  phone: string;
  owner: string;
  location: string;
  images: string[];
  slug: string;
  bookingLink: string;
};

const STORAGE_KEY = "booka_businesses";
const ACTIVE_KEY = "booka_active_business";

/* ---------------- LOAD HELPERS ---------------- */

function loadBusinesses(): Business[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveBusinesses(businesses: Business[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(businesses));
}

function loadActiveBusiness(): string | null {
  return localStorage.getItem(ACTIVE_KEY);
}

function saveActiveBusiness(slug: string) {
  localStorage.setItem(ACTIVE_KEY, slug);
}

function createSlug(name: string) {
  return name.toLowerCase().trim().replace(/\s+/g, "-");
}

/* ---------------- STORE TYPES ---------------- */

type Store = {
  businesses: Business[];
  currentBusiness: Business | null;
  activeBusinessSlug: string | null;

  setBusiness: (
    b: Omit<Business, "id" | "slug" | "bookingLink">
  ) => Business;

  setActiveBusiness: (slug: string) => void;

  getBusinessBySlug: (slug: string) => Business | undefined;
};

/* ---------------- INITIAL STATE ---------------- */

const businesses = loadBusinesses();
const activeSlug = loadActiveBusiness();

const activeBusiness =
  businesses.find((b) => b.slug === activeSlug) || null;

/* ---------------- STORE ---------------- */

export const useBusinessStore = create<Store>((set, get) => ({
  businesses,
  currentBusiness: activeBusiness,
  activeBusinessSlug: activeSlug,

  /* ---------- CREATE BUSINESS ---------- */

  setBusiness: (businessData) => {
    const slug = createSlug(businessData.name);

    const newBusiness: Business = {
      id: crypto.randomUUID(),
      ...businessData,
      slug,
      bookingLink: `/b/${slug}`,
    };

    const updated = [...get().businesses, newBusiness];

    saveBusinesses(updated);
    saveActiveBusiness(slug); // ⭐ persist active business

    set({
      businesses: updated,
      currentBusiness: newBusiness,
      activeBusinessSlug: slug,
    });

    return newBusiness;
  },

  /* ---------- SWITCH BUSINESS ---------- */

  setActiveBusiness: (slug) => {
    const business =
      get().businesses.find((b) => b.slug === slug) || null;

    saveActiveBusiness(slug); // ⭐ persist selection

    set({
      activeBusinessSlug: slug,
      currentBusiness: business,
    });
  },

  /* ---------- GET BUSINESS ---------- */

  getBusinessBySlug: (slug) => {
    return get().businesses.find((b) => b.slug === slug);
  },
}));
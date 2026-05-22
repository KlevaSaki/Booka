import { create } from "zustand";

export type Business = {
  id: string;
  name: string;
  email: string;
  phone: string;
  owner: string;
  location: string;
  description: string;
  images: string[];
  slug: string;
  bookingLink: string;
  password: string;

  department?: string;
  services: { name: string; price: number }[];
  workingHours?: {
    days: string[];
    open: string;
    close: string;
  };
  isSetupComplete: boolean;
  socialLinks?: {
    instagram?: string;
    facebook?: string;
    website?: string;
  };
};

const STORAGE_KEY = "booka_businesses";
const ACTIVE_KEY = "booka_active_business";

const MAX_IMAGES_PER_BUSINESS = 4;
const MAX_BASE64_IMAGE_LENGTH = 250_000;

/* ---------------- LOAD HELPERS ---------------- */

function loadBusinesses(): Business[] {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function isBase64Image(image: string) {
  return image.startsWith("data:image/");
}

function trimImagesForStorage(images: string[] = []) {
  return images
    .filter(Boolean)
    .slice(0, MAX_IMAGES_PER_BUSINESS)
    .filter((image) => {
      if (!isBase64Image(image)) return true;
      return image.length <= MAX_BASE64_IMAGE_LENGTH;
    });
}

function prepareBusinessesForStorage(businesses: Business[]) {
  return businesses.map((business) => ({
    ...business,
    images: trimImagesForStorage(business.images),
  }));
}

function saveBusinesses(businesses: Business[]) {
  const preparedBusinesses = prepareBusinessesForStorage(businesses);

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preparedBusinesses));
    return preparedBusinesses;
  } catch (error) {
    console.warn("Storage quota exceeded. Saving businesses without images.", error);

    const businessesWithoutImages = businesses.map((business) => ({
      ...business,
      images: [],
    }));

    localStorage.setItem(STORAGE_KEY, JSON.stringify(businessesWithoutImages));
    return businessesWithoutImages;
  }
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

  updateBusiness: (slug: string, data: Partial<Business>) => void;
};

/* ---------------- INITIAL STATE ---------------- */

const businesses = loadBusinesses();
const activeSlug = loadActiveBusiness();

const activeBusiness = businesses.find((b) => b.slug === activeSlug) || null;

/* ---------------- STORE ---------------- */

export const useBusinessStore = create<Store>((set, get) => ({
  businesses,
  currentBusiness: activeBusiness,
  activeBusinessSlug: activeSlug,

  setBusiness: (businessData) => {
    const slug = createSlug(businessData.name);

    const newBusiness: Business = {
      id: crypto.randomUUID(),
      ...businessData,
      slug,
      bookingLink: `/b/${slug}`,
    };

    const updated = [...get().businesses, newBusiness];
    const savedBusinesses = saveBusinesses(updated);

    saveActiveBusiness(slug);

    const savedBusiness =
      savedBusinesses.find((business) => business.slug === slug) || newBusiness;

    set({
      businesses: savedBusinesses,
      currentBusiness: savedBusiness,
      activeBusinessSlug: slug,
    });

    return savedBusiness;
  },

  setActiveBusiness: (slug) => {
    const business = get().businesses.find((b) => b.slug === slug) || null;

    saveActiveBusiness(slug);

    set({
      activeBusinessSlug: slug,
      currentBusiness: business,
    });
  },

  getBusinessBySlug: (slug) => {
    return get().businesses.find((b) => b.slug === slug);
  },

  updateBusiness: (slug, data) => {
    const updatedBusinesses = get().businesses.map((b) =>
      b.slug === slug ? { ...b, ...data } : b
    );

    const savedBusinesses = saveBusinesses(updatedBusinesses);

    const updatedCurrent =
      savedBusinesses.find((b) => b.slug === slug) || null;

    set({
      businesses: savedBusinesses,
      currentBusiness: updatedCurrent,
    });
  },
}));
const SELECTED_BRAND_KEY = "mentionly_selected_brand_id";

export function getSelectedBrandId(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(SELECTED_BRAND_KEY);
}

export function setSelectedBrandId(brandId: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SELECTED_BRAND_KEY, brandId);
}

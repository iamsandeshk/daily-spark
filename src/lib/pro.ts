// Temporary Pro feature toggle. Stored in localStorage so it persists.
// Replace with real entitlement check once billing is wired up.

const KEY = "pro-enabled";

export const isPro = (): boolean => localStorage.getItem(KEY) === "1";

export const setPro = (v: boolean) => {
  localStorage.setItem(KEY, v ? "1" : "0");
  window.dispatchEvent(new Event("pro:updated"));
};

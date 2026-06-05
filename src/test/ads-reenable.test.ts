import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  disableAdsForHours,
  areAdsTemporarilyDisabled,
  getAdsDisabledUntil,
  adsDisabled,
  isPro,
} from "@/lib/pro";

const HOUR = 60 * 60 * 1000;
const START = new Date("2026-06-05T12:00:00.000Z").getTime();

describe("temporary ad-free window (rewarded ad)", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(START);
  });

  afterEach(() => {
    vi.useRealTimers();
    localStorage.clear();
  });

  it("disables ads immediately for 4 hours", () => {
    disableAdsForHours(4);
    expect(areAdsTemporarilyDisabled()).toBe(true);
    expect(adsDisabled()).toBe(true);
    expect(getAdsDisabledUntil()).toBe(START + 4 * HOUR);
  });

  it("keeps ads disabled right up until the final second", () => {
    disableAdsForHours(4);
    // 1ms before expiry → still disabled.
    vi.setSystemTime(START + 4 * HOUR - 1);
    expect(areAdsTemporarilyDisabled()).toBe(true);
  });

  it("re-enables ads exactly when the countdown reaches zero", () => {
    disableAdsForHours(4);
    // At the exact expiry instant the window is over.
    vi.setSystemTime(START + 4 * HOUR);
    expect(areAdsTemporarilyDisabled()).toBe(false);
    expect(adsDisabled()).toBe(false);
  });

  it("re-enables correctly after the app was backgrounded past expiry", () => {
    disableAdsForHours(4);
    expect(areAdsTemporarilyDisabled()).toBe(true);

    // Simulate the app being backgrounded (no timers fire) and resumed
    // well after the 4-hour window has elapsed.
    vi.setSystemTime(START + 5 * HOUR);
    expect(areAdsTemporarilyDisabled()).toBe(false);
  });

  it("persists the expiry so it survives a device restart", () => {
    disableAdsForHours(4);
    const persisted = localStorage.getItem("ads-disabled-until");
    expect(persisted).toBe(String(START + 4 * HOUR));

    // A restart loses in-memory timers but keeps localStorage. If we resume
    // before expiry, ads stay disabled and resolve to the persisted instant.
    vi.setSystemTime(START + 2 * HOUR);
    expect(getAdsDisabledUntil()).toBe(START + 4 * HOUR);
    expect(areAdsTemporarilyDisabled()).toBe(true);

    // Resume after expiry → ads are back on, computed purely from storage.
    vi.setSystemTime(START + 4 * HOUR + 1);
    expect(areAdsTemporarilyDisabled()).toBe(false);
  });

  it("returns no ad-free window when storage is empty (fresh install)", () => {
    expect(getAdsDisabledUntil()).toBe(0);
    expect(areAdsTemporarilyDisabled()).toBe(false);
  });

  it("treats corrupted storage values as no ad-free window", () => {
    localStorage.setItem("ads-disabled-until", "not-a-number");
    expect(getAdsDisabledUntil()).toBe(0);
    expect(areAdsTemporarilyDisabled()).toBe(false);
  });

  it("extends from the current expiry when stacking multiple rewards", () => {
    disableAdsForHours(4);
    // Watch another ad 1 hour in → should extend from the existing expiry.
    vi.setSystemTime(START + 1 * HOUR);
    disableAdsForHours(4);
    expect(getAdsDisabledUntil()).toBe(START + 8 * HOUR);
  });

  it("keeps ads off while Pro even with no temporary window", () => {
    expect(isPro()).toBe(false);
    localStorage.setItem("pro-enabled", "1");
    expect(isPro()).toBe(true);
    expect(adsDisabled()).toBe(true);
  });
});

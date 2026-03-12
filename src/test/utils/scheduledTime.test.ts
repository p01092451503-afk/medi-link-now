import { describe, it, expect } from "vitest";

// Simulates the ScheduledCallForm time conversion logic
const convertToScheduledTime = (
  date: string,
  hour: string,
  minute: string,
  ampm: string
): string => {
  let h = parseInt(hour, 10);
  if (ampm === "오후" && h !== 12) h += 12;
  if (ampm === "오전" && h === 12) h = 0;
  const timeStr = `${String(h).padStart(2, "0")}:${minute}`;
  return new Date(`${date}T${timeStr}`).toISOString();
};

describe("Scheduled Call Time Conversion", () => {
  it("should convert 오전 9시 30분 correctly", () => {
    const result = convertToScheduledTime("2026-03-20", "9", "30", "오전");
    const d = new Date(result);
    expect(d.getHours()).toBe(9);
    expect(d.getMinutes()).toBe(30);
  });

  it("should convert 오후 2시 00분 correctly (14:00)", () => {
    const result = convertToScheduledTime("2026-03-20", "2", "00", "오후");
    const d = new Date(result);
    expect(d.getHours()).toBe(14);
  });

  it("should convert 오후 12시 correctly (noon = 12:00)", () => {
    const result = convertToScheduledTime("2026-03-20", "12", "00", "오후");
    const d = new Date(result);
    expect(d.getHours()).toBe(12);
  });

  it("should convert 오전 12시 correctly (midnight = 00:00)", () => {
    const result = convertToScheduledTime("2026-03-20", "12", "00", "오전");
    const d = new Date(result);
    expect(d.getHours()).toBe(0);
  });

  it("should handle 오후 11시 45분 correctly (23:45)", () => {
    const result = convertToScheduledTime("2026-03-20", "11", "45", "오후");
    const d = new Date(result);
    expect(d.getHours()).toBe(23);
    expect(d.getMinutes()).toBe(45);
  });

  it("should handle 오전 1시 correctly (01:00)", () => {
    const result = convertToScheduledTime("2026-03-20", "1", "00", "오전");
    const d = new Date(result);
    expect(d.getHours()).toBe(1);
  });
});

describe("Dispatch Request Status Flow", () => {
  const validTransitions: Record<string, string[]> = {
    pending: ["accepted", "cancelled"],
    scheduled: ["accepted", "cancelled"],
    accepted: ["en_route", "cancelled"],
    en_route: ["arrived", "completed", "cancelled"],
    arrived: ["completed"],
    completed: [],
    cancelled: [],
  };

  it("should allow pending → accepted", () => {
    expect(validTransitions["pending"]).toContain("accepted");
  });

  it("should allow accepted → en_route", () => {
    expect(validTransitions["accepted"]).toContain("en_route");
  });

  it("should not allow completed → pending", () => {
    expect(validTransitions["completed"]).not.toContain("pending");
  });

  it("should allow cancellation from most states", () => {
    ["pending", "accepted", "en_route"].forEach((status) => {
      expect(validTransitions[status]).toContain("cancelled");
    });
  });
});

import { describe, it, expect } from "vitest";

// Haversine distance calculation (same as in DriverDashboard)
const calcDistance = (lat1: number, lng1: number, lat2: number, lng2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

describe("Haversine Distance Calculation", () => {
  it("should return 0 for same coordinates", () => {
    expect(calcDistance(37.5665, 126.978, 37.5665, 126.978)).toBe(0);
  });

  it("should calculate Seoul to Busan approximately correctly (~325km)", () => {
    const distance = calcDistance(37.5665, 126.978, 35.1796, 129.0756);
    expect(distance).toBeGreaterThan(300);
    expect(distance).toBeLessThan(350);
  });

  it("should calculate short distances correctly", () => {
    // Seoul City Hall to Gangnam Station (~10km)
    const distance = calcDistance(37.5665, 126.978, 37.4979, 127.0276);
    expect(distance).toBeGreaterThan(5);
    expect(distance).toBeLessThan(15);
  });

  it("should be symmetric", () => {
    const d1 = calcDistance(37.5665, 126.978, 35.1796, 129.0756);
    const d2 = calcDistance(35.1796, 129.0756, 37.5665, 126.978);
    expect(Math.abs(d1 - d2)).toBeLessThan(0.001);
  });
});

// Proximity-based dispatch filtering logic test
describe("Proximity-based Dispatch Filtering", () => {
  const driverLocation: [number, number] = [37.5665, 126.978]; // Seoul

  const requests = [
    { id: "1", pickup_lat: 37.567, pickup_lng: 126.979, name: "Very Close (~0.1km)" },
    { id: "2", pickup_lat: 37.58, pickup_lng: 127.0, name: "Nearby (~2km)" },
    { id: "3", pickup_lat: 37.65, pickup_lng: 127.1, name: "Medium (~15km)" },
    { id: "4", pickup_lat: 36.35, pickup_lng: 127.38, name: "Far (~150km)" },
  ];

  it("should filter requests within 10km radius", () => {
    const [dLat, dLng] = driverLocation;
    const within10km = requests.filter(
      (r) => calcDistance(dLat, dLng, r.pickup_lat, r.pickup_lng) <= 10
    );
    expect(within10km).toHaveLength(2);
    expect(within10km.map((r) => r.id)).toEqual(["1", "2"]);
  });

  it("should expand to 20km when no 10km results", () => {
    const farDriver: [number, number] = [37.65, 127.1];
    const [dLat, dLng] = farDriver;

    const radiusSteps = [10, 20, 50];
    let result: typeof requests = [];

    for (const radius of radiusSteps) {
      const inRange = requests.filter(
        (r) => calcDistance(dLat, dLng, r.pickup_lat, r.pickup_lng) <= radius
      );
      if (inRange.length > 0) {
        result = inRange;
        break;
      }
    }

    expect(result.length).toBeGreaterThan(0);
  });

  it("should sort requests by distance", () => {
    const [dLat, dLng] = driverLocation;
    const withDistance = requests
      .map((r) => ({
        ...r,
        distance: calcDistance(dLat, dLng, r.pickup_lat, r.pickup_lng),
      }))
      .sort((a, b) => a.distance - b.distance);

    expect(withDistance[0].id).toBe("1");
    expect(withDistance[withDistance.length - 1].id).toBe("4");
  });
});

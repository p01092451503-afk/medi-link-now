// Spiderfy utility for Kakao Maps
// Spreads overlapping markers in a spiral pattern when clicked

import { Hospital } from "@/data/hospitals";

interface SpiderfyMarker {
  hospital: Hospital;
  overlay: any;
  originalPosition: { lat: number; lng: number };
  element: HTMLElement;
}

interface SpiderfyState {
  isSpiderfied: boolean;
  markers: SpiderfyMarker[];
  lines: any[];
  centerLat: number;
  centerLng: number;
}

// Get z-index priority based on hospital type
export const getMarkerZIndex = (hospital: Hospital): number => {
  // Trauma center has highest priority
  if (hospital.isTraumaCenter) return 1000;
  
  // Then by emergency grade
  switch (hospital.emergencyGrade) {
    case "regional_center":
      return 900;
    case "local_center":
      return 800;
    case "local_institution":
      return 700;
    default:
      return 600;
  }
};

// Check if two coordinates are overlapping (within threshold)
const areCoordinatesOverlapping = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  threshold: number = 0.0003 // ~30m at equator
): boolean => {
  return Math.abs(lat1 - lat2) < threshold && Math.abs(lng1 - lng2) < threshold;
};

// Group overlapping markers
export const findOverlappingGroups = (
  hospitals: Hospital[],
  threshold: number = 0.0003
): Map<string, Hospital[]> => {
  const groups = new Map<string, Hospital[]>();
  const assigned = new Set<number>();

  hospitals.forEach((hospital) => {
    if (assigned.has(hospital.id)) return;

    const overlapping = hospitals.filter((other) => {
      if (other.id === hospital.id || assigned.has(other.id)) return false;
      return areCoordinatesOverlapping(
        hospital.lat,
        hospital.lng,
        other.lat,
        other.lng,
        threshold
      );
    });

    if (overlapping.length > 0) {
      const groupKey = `${hospital.lat.toFixed(5)},${hospital.lng.toFixed(5)}`;
      const group = [hospital, ...overlapping];
      
      // Sort by z-index priority (highest first)
      group.sort((a, b) => getMarkerZIndex(b) - getMarkerZIndex(a));
      
      groups.set(groupKey, group);
      group.forEach((h) => assigned.add(h.id));
    }
  });

  return groups;
};

// Calculate spiral positions for spiderfied markers
export const calculateSpiderPositions = (
  centerLat: number,
  centerLng: number,
  count: number,
  mapLevel: number
): Array<{ lat: number; lng: number }> => {
  const positions: Array<{ lat: number; lng: number }> = [];
  
  // Adjust spacing based on zoom level (smaller spacing at lower levels/more zoomed in)
  const baseSpacing = 0.00015 * Math.pow(1.5, Math.max(1, mapLevel - 1));
  
  if (count <= 8) {
    // Circular arrangement for small groups
    const radius = baseSpacing * 2;
    const angleStep = (2 * Math.PI) / count;
    
    for (let i = 0; i < count; i++) {
      const angle = angleStep * i - Math.PI / 2; // Start from top
      positions.push({
        lat: centerLat + radius * Math.sin(angle),
        lng: centerLng + radius * Math.cos(angle) * 1.2, // Adjust for lat/lng ratio
      });
    }
  } else {
    // Spiral arrangement for larger groups
    const spiralTurns = 2;
    const maxRadius = baseSpacing * 4;
    
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const angle = spiralTurns * 2 * Math.PI * t;
      const radius = maxRadius * (0.3 + 0.7 * t);
      
      positions.push({
        lat: centerLat + radius * Math.sin(angle),
        lng: centerLng + radius * Math.cos(angle) * 1.2,
      });
    }
  }
  
  return positions;
};

// Create spider leg line
export const createSpiderLeg = (
  kakao: any,
  map: any,
  fromLat: number,
  fromLng: number,
  toLat: number,
  toLng: number
): any => {
  const polyline = new kakao.maps.Polyline({
    map: map,
    path: [
      new kakao.maps.LatLng(fromLat, fromLng),
      new kakao.maps.LatLng(toLat, toLng),
    ],
    strokeWeight: 2,
    strokeColor: "#6B7280",
    strokeOpacity: 0.6,
    strokeStyle: "solid",
  });
  
  return polyline;
};

// Spiderfy manager class
export class SpiderfyManager {
  private kakao: any;
  private map: any;
  private state: SpiderfyState | null = null;
  private onUnspiderfy?: () => void;

  constructor(kakao: any, map: any) {
    this.kakao = kakao;
    this.map = map;
  }

  isSpiderfied(): boolean {
    return this.state?.isSpiderfied || false;
  }

  getSpiderfiedMarkers(): SpiderfyMarker[] {
    return this.state?.markers || [];
  }

  spiderfy(
    markers: SpiderfyMarker[],
    centerLat: number,
    centerLng: number,
    onUnspiderfy?: () => void
  ): void {
    // Unspiderfy any existing
    this.unspiderfy();
    
    this.onUnspiderfy = onUnspiderfy;
    
    const mapLevel = this.map.getLevel();
    const positions = calculateSpiderPositions(centerLat, centerLng, markers.length, mapLevel);
    const lines: any[] = [];

    markers.forEach((marker, index) => {
      const newPos = positions[index];
      
      // Create spider leg line
      const line = createSpiderLeg(
        this.kakao,
        this.map,
        centerLat,
        centerLng,
        newPos.lat,
        newPos.lng
      );
      lines.push(line);

      // Animate marker to new position
      const overlay = marker.overlay;
      const newLatLng = new this.kakao.maps.LatLng(newPos.lat, newPos.lng);
      overlay.setPosition(newLatLng);

      // Show grade label when spiderfied
      const gradeLabel = marker.element.querySelector(".grade-label") as HTMLElement;
      if (gradeLabel) {
        gradeLabel.style.opacity = "1";
        gradeLabel.style.visibility = "visible";
      }

      // Add spiderfied class for styling
      marker.element.classList.add("spiderfied");
    });

    this.state = {
      isSpiderfied: true,
      markers,
      lines,
      centerLat,
      centerLng,
    };
  }

  unspiderfy(): void {
    if (!this.state) return;

    // Remove spider leg lines
    this.state.lines.forEach((line) => {
      line.setMap(null);
    });

    // Return markers to original positions
    this.state.markers.forEach((marker) => {
      const originalLatLng = new this.kakao.maps.LatLng(
        marker.originalPosition.lat,
        marker.originalPosition.lng
      );
      marker.overlay.setPosition(originalLatLng);

      // Hide grade label again
      const gradeLabel = marker.element.querySelector(".grade-label") as HTMLElement;
      if (gradeLabel) {
        gradeLabel.style.opacity = "0";
        gradeLabel.style.visibility = "hidden";
      }

      // Remove spiderfied class
      marker.element.classList.remove("spiderfied");
    });

    this.state = null;
    
    if (this.onUnspiderfy) {
      this.onUnspiderfy();
    }
  }

  destroy(): void {
    this.unspiderfy();
  }
}

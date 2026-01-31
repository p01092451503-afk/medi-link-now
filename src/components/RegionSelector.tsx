import { useMemo } from "react";
import { MapPin } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { regionOptions, RegionType, MajorRegionType } from "@/data/hospitals";

interface RegionSelectorProps {
  majorRegion: MajorRegionType;
  subRegion: RegionType;
  onMajorRegionChange: (region: MajorRegionType) => void;
  onSubRegionChange: (region: RegionType) => void;
  hospitalCount: number;
}

const RegionSelector = ({
  majorRegion,
  subRegion,
  onMajorRegionChange,
  onSubRegionChange,
  hospitalCount,
}: RegionSelectorProps) => {
  // Get major regions (no parent)
  const majorRegions = useMemo(() => {
    return regionOptions.filter((r) => !r.parent);
  }, []);

  // Get sub-regions for selected major region
  const subRegions = useMemo(() => {
    if (majorRegion === "all") return [];
    return regionOptions.filter((r) => r.parent === majorRegion);
  }, [majorRegion]);

  // Get display label for major region
  const getMajorRegionLabel = (id: MajorRegionType) => {
    if (id === "all") return "전체";
    const region = majorRegions.find((r) => r.id === id);
    return region?.labelKr || "전체";
  };

  // Get display label for sub region
  const getSubRegionLabel = (id: RegionType) => {
    if (id === "all" || id === majorRegion) return "전체";
    const region = subRegions.find((r) => r.id === id);
    return region?.labelKr || "전체";
  };

  const handleMajorChange = (value: string) => {
    const newMajor = value as MajorRegionType;
    onMajorRegionChange(newMajor);
    // Reset sub-region to the major region itself (shows all in that region)
    onSubRegionChange(newMajor);
  };

  const handleSubChange = (value: string) => {
    onSubRegionChange(value as RegionType);
  };

  return (
    <div className="flex items-center gap-2">
      {/* Major Region Selector */}
      <Select value={majorRegion} onValueChange={handleMajorChange}>
        <SelectTrigger className="w-[140px] bg-white/50 backdrop-blur-sm shadow-md border border-white/30 h-10 rounded-xl">
          <MapPin className="w-4 h-4 mr-1 text-primary flex-shrink-0" />
          <SelectValue placeholder="광역시/도">
            {getMajorRegionLabel(majorRegion)}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-white/90 backdrop-blur-sm z-[1001] max-h-[350px]">
          {majorRegions.map((r) => (
            <SelectItem key={r.id} value={r.id} className="font-medium">
              {r.labelKr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Sub-region Selector (only show if major region selected and has sub-regions) */}
      {majorRegion !== "all" && subRegions.length > 0 && (
        <Select 
          value={subRegion === majorRegion ? "all" : subRegion} 
          onValueChange={(val) => handleSubChange(val === "all" ? majorRegion : val)}
        >
          <SelectTrigger className="w-[120px] bg-white/50 backdrop-blur-sm shadow-md border border-white/30 rounded-xl h-10">
            <SelectValue placeholder="시/군/구">
              {getSubRegionLabel(subRegion)}
            </SelectValue>
          </SelectTrigger>
          <SelectContent className="bg-white/90 backdrop-blur-sm z-[1001] max-h-[300px]">
            <SelectItem value="all" className="font-medium text-primary">
              전체
            </SelectItem>
            {subRegions.map((r) => (
              <SelectItem key={r.id} value={r.id}>
                {r.labelKr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
};

export default RegionSelector;

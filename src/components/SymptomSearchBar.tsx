import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Baby, 
  HeartPulse, 
  Bone, 
  Thermometer,
  AlertCircle,
  X,
  Loader2,
  Clock,
  MapPin,
  Navigation,
  Car
} from "lucide-react";
import { FilterType, Hospital, filterHospitals, calculateDistance, getHospitalStatus } from "@/data/hospitals";
import { analyzeSymptom, getSymptomExamples, SymptomAnalysisResult } from "@/utils/symptomAnalyzer";
import { useToast } from "@/hooks/use-toast";

interface SymptomSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterChange: (filter: FilterType) => void;
  onHospitalSelect?: (hospital: Hospital) => void;
  hospitals?: Hospital[];
  userLocation?: [number, number] | null;
  className?: string;
}

interface HospitalWithTravelTime extends Hospital {
  distance: number;
  travelTimeMinutes: number;
}

// Average speed assumptions for travel time calculation (km/h)
const TRAVEL_SPEEDS = {
  urban: 25, // Urban areas (traffic)
  suburban: 40, // Suburban
  emergency: 50, // With emergency lights
};

const estimateTravelTime = (distanceKm: number): number => {
  // Use urban speed for conservative estimate
  const hours = distanceKm / TRAVEL_SPEEDS.urban;
  return Math.max(1, Math.round(hours * 60)); // At least 1 minute
};

const getIconForResult = (icon: SymptomAnalysisResult["icon"]) => {
  switch (icon) {
    case "baby":
      return <Baby className="w-5 h-5 text-pink-500" />;
    case "trauma":
      return <Bone className="w-5 h-5 text-orange-500" />;
    case "cardio":
      return <HeartPulse className="w-5 h-5 text-red-500" />;
    case "fever":
      return <Thermometer className="w-5 h-5 text-yellow-600" />;
    default:
      return <Search className="w-5 h-5 text-primary" />;
  }
};

const getSeverityColor = (severity: SymptomAnalysisResult["severity"]) => {
  switch (severity) {
    case "high":
      return "bg-red-100 text-red-700 border-red-300";
    case "medium":
      return "bg-yellow-100 text-yellow-700 border-yellow-300";
    default:
      return "bg-green-100 text-green-700 border-green-300";
  }
};

const getStatusBadge = (hospital: Hospital) => {
  const status = getHospitalStatus(hospital);
  switch (status) {
    case "available":
      return <span className="px-1.5 py-0.5 bg-green-500 text-white text-[10px] font-medium rounded">여유</span>;
    case "limited":
      return <span className="px-1.5 py-0.5 bg-yellow-500 text-white text-[10px] font-medium rounded">혼잡</span>;
    default:
      return <span className="px-1.5 py-0.5 bg-red-500 text-white text-[10px] font-medium rounded">만실</span>;
  }
};

const SymptomSearchBar = ({ 
  value, 
  onChange, 
  onFilterChange, 
  onHospitalSelect,
  hospitals = [],
  userLocation,
  className 
}: SymptomSearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [analysis, setAnalysis] = useState<SymptomAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const { toast } = useToast();

  const examples = getSymptomExamples();

  // Rotate placeholder examples
  useEffect(() => {
    if (!isFocused && !value) {
      const interval = setInterval(() => {
        setPlaceholderIndex((prev) => (prev + 1) % examples.length);
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [isFocused, value, examples.length]);

  // Debounced symptom analysis
  useEffect(() => {
    if (!value || value.length < 2) {
      setAnalysis(null);
      return;
    }

    setIsAnalyzing(true);
    const timeout = setTimeout(() => {
      const result = analyzeSymptom(value);
      setAnalysis(result);
      setIsAnalyzing(false);
    }, 300);

    return () => clearTimeout(timeout);
  }, [value]);

  // Get nearby hospitals matching the suggested filter with travel times
  const nearbyHospitals = useMemo((): HospitalWithTravelTime[] => {
    if (!analysis || !userLocation || hospitals.length === 0) return [];

    // Filter hospitals by the suggested filter
    const filtered = filterHospitals(hospitals, analysis.suggestedFilter);

    // Calculate distance and travel time for each hospital
    const withDistances = filtered.map((hospital) => {
      const distance = calculateDistance(
        userLocation[0], userLocation[1],
        hospital.lat, hospital.lng
      );
      return {
        ...hospital,
        distance,
        travelTimeMinutes: estimateTravelTime(distance),
      };
    });

    // Sort by distance and return top 3
    return withDistances
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 3);
  }, [analysis, userLocation, hospitals]);

  const handleApplyFilter = useCallback(() => {
    if (analysis) {
      onFilterChange(analysis.suggestedFilter);
      // Show toast message
      toast({
        title: `🔍 ${analysis.message}`,
        description: `"${analysis.keywords.join(", ")}" 키워드 감지`,
      });
      setIsFocused(false);
      onChange("");
      setAnalysis(null);
    }
  }, [analysis, onFilterChange, onChange, toast]);

  const handleHospitalClick = useCallback((hospital: Hospital) => {
    if (onHospitalSelect) {
      onHospitalSelect(hospital);
      // Also apply the filter
      if (analysis) {
        onFilterChange(analysis.suggestedFilter);
      }
      // Show toast with hospital selection info
      toast({
        title: `🏥 ${hospital.nameKr} 선택됨`,
        description: analysis?.keywords ? `"${analysis.keywords.join(", ")}" 기준 추천` : "병원을 선택했습니다",
      });
      setIsFocused(false);
      onChange("");
      setAnalysis(null);
    }
  }, [onHospitalSelect, analysis, onFilterChange, onChange, toast]);

  const handleClear = () => {
    onChange("");
    setAnalysis(null);
  };

  return (
    <>

      {/* Backdrop overlay when focused */}
      <AnimatePresence>
        {isFocused && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-[9990]"
            onClick={() => setIsFocused(false)}
          />
        )}
      </AnimatePresence>
      
      <div className={`relative z-[9991] ${className}`}>
        {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          {isAnalyzing ? (
            <Loader2 className="w-5 h-5 text-primary animate-spin" />
          ) : analysis ? (
            getIconForResult(analysis.icon)
          ) : (
            <Search className="w-5 h-5 text-muted-foreground" />
          )}
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          placeholder={isFocused ? "증상을 입력하세요..." : `예: ${examples[placeholderIndex]}`}
          className="w-full bg-white rounded-2xl pl-12 pr-12 py-4 text-base shadow-lg outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        />
        {value && (
          <button
            onClick={handleClear}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Analysis Result */}
      <AnimatePresence>
        {analysis && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full left-0 right-0 mt-2 z-[9999]"
          >
            <div className={`rounded-xl p-4 border shadow-xl backdrop-blur-sm ${getSeverityColor(analysis.severity)}`}>
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getIconForResult(analysis.icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm mb-1">
                    {analysis.message}
                  </p>
                  <div className="flex flex-wrap gap-1 mb-3">
                    {analysis.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className="px-2 py-0.5 bg-white/70 rounded-full text-xs font-medium"
                      >
                        "{keyword}"
                      </span>
                    ))}
                  </div>

                  {/* Nearby Hospitals with Travel Time */}
                  {nearbyHospitals.length > 0 && (
                    <div className="mb-3 space-y-2">
                      <p className="text-xs font-medium opacity-80 flex items-center gap-1">
                        <Car className="w-3 h-3" />
                        가까운 추천 병원
                      </p>
                      {nearbyHospitals.map((hospital) => (
                        <button
                          key={hospital.id}
                          onClick={() => handleHospitalClick(hospital)}
                          className="w-full bg-white hover:bg-gray-50 rounded-lg p-2.5 text-left transition-all shadow-sm hover:shadow border border-gray-100"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="font-semibold text-xs text-gray-900 truncate">
                                  {hospital.nameKr}
                                </span>
                                {getStatusBadge(hospital)}
                              </div>
                              <div className="flex items-center gap-2 text-[10px] text-gray-600">
                                <span className="flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3" />
                                  {hospital.distance.toFixed(1)}km
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end">
                              <div className="flex items-center gap-1 text-primary font-bold text-sm">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{hospital.travelTimeMinutes}분</span>
                              </div>
                              <span className="text-[10px] text-gray-500">예상 이동</span>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* No location warning */}
                  {!userLocation && (
                    <div className="mb-3 py-2 px-3 bg-white/70 rounded-lg text-xs text-gray-600 flex items-center gap-2">
                      <Navigation className="w-4 h-4" />
                      <span>위치를 켜면 가까운 병원을 추천해드립니다</span>
                    </div>
                  )}

                  <button
                    onClick={handleApplyFilter}
                    className="w-full py-2.5 bg-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all border border-gray-100"
                  >
                    🔍 이 조건으로 검색
                  </button>
                </div>
              </div>

              {analysis.severity === "high" && (
                <div className="mt-3 pt-3 border-t border-current/20 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>심각한 증상입니다. 즉시 119에 전화하세요!</span>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hint Text */}
      {!analysis && isFocused && !value && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl p-4 shadow-xl border border-gray-200 z-[9999]"
        >
          <p className="text-xs text-muted-foreground mb-3">
            💡 증상을 자연스럽게 입력하면 AI가 적합한 병원을 추천해드립니다
          </p>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example}
                onMouseDown={() => onChange(example)}
                className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-foreground hover:bg-gray-200 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </motion.div>
      )}
      </div>
    </>
  );
};

export default SymptomSearchBar;

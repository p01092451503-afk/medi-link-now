import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Search, 
  Baby, 
  HeartPulse, 
  Bone, 
  Thermometer,
  AlertCircle,
  X,
  Loader2
} from "lucide-react";
import { FilterType } from "@/data/hospitals";
import { analyzeSymptom, getSymptomExamples, SymptomAnalysisResult } from "@/utils/symptomAnalyzer";
import { toast } from "@/hooks/use-toast";

interface SymptomSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onFilterChange: (filter: FilterType) => void;
  className?: string;
}

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

const SymptomSearchBar = ({ value, onChange, onFilterChange, className }: SymptomSearchBarProps) => {
  const [isFocused, setIsFocused] = useState(false);
  const [analysis, setAnalysis] = useState<SymptomAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

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

  const handleApplyFilter = useCallback(() => {
    if (analysis) {
      onFilterChange(analysis.suggestedFilter);
      toast({
        title: `🔍 ${analysis.message}`,
        description: `"${analysis.keywords.join(", ")}" 키워드 감지`,
      });
    }
  }, [analysis, onFilterChange]);

  const handleClear = () => {
    onChange("");
    setAnalysis(null);
  };

  return (
    <div className={`relative ${className}`}>
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
          onBlur={() => setIsFocused(false)}
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
            className="absolute top-full left-0 right-0 mt-2 z-10"
          >
            <div className={`rounded-xl p-4 border shadow-lg ${getSeverityColor(analysis.severity)}`}>
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
                        className="px-2 py-0.5 bg-white/50 rounded-full text-xs font-medium"
                      >
                        "{keyword}"
                      </span>
                    ))}
                  </div>
                  <button
                    onClick={handleApplyFilter}
                    className="w-full py-2.5 bg-white rounded-lg text-sm font-semibold shadow-sm hover:shadow-md transition-all"
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
          className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl p-4 shadow-lg border border-border z-10"
        >
          <p className="text-xs text-muted-foreground mb-3">
            💡 증상을 자연스럽게 입력하면 AI가 적합한 병원을 추천해드립니다
          </p>
          <div className="flex flex-wrap gap-2">
            {examples.map((example) => (
              <button
                key={example}
                onClick={() => onChange(example)}
                className="px-3 py-1.5 bg-gray-100 rounded-full text-xs text-foreground hover:bg-gray-200 transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default SymptomSearchBar;

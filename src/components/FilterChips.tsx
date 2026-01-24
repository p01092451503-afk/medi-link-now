import { filterOptions, FilterType } from "@/data/hospitals";
import { motion } from "framer-motion";

interface FilterChipsProps {
  activeFilter: FilterType;
  onFilterChange: (filter: FilterType) => void;
}

const FilterChips = ({ activeFilter, onFilterChange }: FilterChipsProps) => {
  return (
    <div className="absolute top-20 left-0 right-0 z-10 px-4">
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {filterOptions.map((filter) => (
          <motion.button
            key={filter.id}
            whileTap={{ scale: 0.95 }}
            onClick={() => onFilterChange(filter.id)}
            className={`filter-chip flex-shrink-0 ${
              activeFilter === filter.id ? "active" : ""
            }`}
          >
            {filter.label}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default FilterChips;

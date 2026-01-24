import { useState, useCallback, useMemo } from "react";
import { Search, Menu, Crosshair, Loader2, X, Phone, Navigation, Stethoscope, Baby, Shield, MapPin } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import {
  hospitals as hospitalData,
  Hospital,
  FilterType,
  filterOptions,
  filterHospitals,
  calculateDistance,
  getHospitalStatus,
} from "@/data/hospitals";
import { toast } from "@/hooks/use-toast";

const DEFAULT_CENTER: [number, number] = [37.5172, 127.0473];

const Index = () => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [selectedHospital, setSelectedHospital] = useState<Hospital | null>(null);
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHospitals = useMemo(() => {
    let result = filterHospitals(hospitalData, activeFilter);
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter((h) => h.name.toLowerCase().includes(query) || h.nameKr.includes(query));
    }
    if (userLocation) {
      result = result.map((h) => ({ ...h, distance: calculateDistance(userLocation[0], userLocation[1], h.lat, h.lng) }));
      result.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    }
    return result;
  }, [activeFilter, searchQuery, userLocation]);

  const handleMyLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserLocation([pos.coords.latitude, pos.coords.longitude]); setIsLocating(false); toast({ title: "Location found!" }); },
      () => { setIsLocating(false); toast({ title: "Using Seoul default" }); },
      { enableHighAccuracy: true, timeout: 5000 }
    );
  }, []);

  const selectedDistance = selectedHospital && userLocation 
    ? calculateDistance(userLocation[0], userLocation[1], selectedHospital.lat, selectedHospital.lng) 
    : undefined;

  return (
    <div className="relative h-screen w-full overflow-hidden bg-gradient-to-br from-blue-50 to-slate-100">
      {/* Header */}
      <header className="absolute top-0 left-0 right-0 z-20 p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-white rounded-xl px-4 py-2.5 shadow-md">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white font-bold text-sm">M</span>
            </div>
            <span className="font-semibold text-foreground hidden sm:block">Medi-Link</span>
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input type="text" placeholder="Find Hospital..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white rounded-xl pl-10 pr-4 py-2.5 text-sm shadow-md outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
          <button className="bg-white rounded-xl p-2.5 shadow-md"><Menu className="w-5 h-5" /></button>
        </div>
      </header>

      {/* Filter Chips */}
      <div className="absolute top-20 left-0 right-0 z-10 px-4">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {filterOptions.map((f) => (
            <button key={f.id} onClick={() => setActiveFilter(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap shadow-sm transition-all ${activeFilter === f.id ? "bg-primary text-white" : "bg-white text-muted-foreground"}`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Map Placeholder with Hospital List */}
      <div className="absolute inset-0 pt-32 pb-4 px-4 overflow-y-auto">
        <div className="grid gap-3">
          {filteredHospitals.map((hospital) => {
            const status = getHospitalStatus(hospital);
            const totalBeds = hospital.beds.general + hospital.beds.pediatric + hospital.beds.isolation;
            return (
              <motion.div key={hospital.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                onClick={() => setSelectedHospital(hospital)}
                className="bg-white rounded-xl p-4 shadow-md cursor-pointer hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-3 h-3 rounded-full ${status === "unavailable" ? "bg-red-500" : status === "limited" ? "bg-yellow-500" : "bg-green-500"}`} />
                      <span className="text-xs font-medium text-muted-foreground">{hospital.category}</span>
                    </div>
                    <h3 className="font-semibold text-foreground">{hospital.name}</h3>
                    <p className="text-xs text-muted-foreground">{hospital.nameKr}</p>
                  </div>
                  <div className="text-right">
                    <span className={`text-2xl font-bold ${status === "unavailable" ? "text-red-500" : "text-green-600"}`}>{totalBeds}</span>
                    <p className="text-xs text-muted-foreground">beds</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  {hospital.equipment.slice(0, 3).map((eq) => (
                    <span key={eq} className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded-full">{eq}</span>
                  ))}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 backdrop-blur-sm rounded-xl p-3 shadow-md">
        <h4 className="text-xs font-semibold mb-2">Availability</h4>
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span className="text-xs">Available</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span className="text-xs">Limited</span></div>
          <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-red-500" /><span className="text-xs">Full</span></div>
        </div>
      </div>

      {/* Location FAB */}
      <button onClick={handleMyLocation} disabled={isLocating} className="fixed bottom-20 right-4 z-30 rounded-full shadow-lg p-3 bg-white border">
        {isLocating ? <Loader2 className="w-6 h-6 text-primary animate-spin" /> : <Crosshair className="w-6 h-6 text-primary" />}
      </button>

      {/* Bottom Sheet */}
      <AnimatePresence>
        {selectedHospital && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedHospital(null)} className="fixed inset-0 bg-black/40 z-40" />
            <motion.div initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }} transition={{ type: "spring", damping: 25 }} className="fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl z-50 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-center py-3"><div className="w-12 h-1.5 bg-gray-300 rounded-full" /></div>
              <div className="px-5 pb-8">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold mb-2 ${getHospitalStatus(selectedHospital) === "unavailable" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}>
                      <span className={`w-2 h-2 rounded-full animate-pulse ${getHospitalStatus(selectedHospital) === "unavailable" ? "bg-red-500" : "bg-green-500"}`} />
                      {getHospitalStatus(selectedHospital) === "unavailable" ? "Full" : "Available"}
                    </span>
                    <h2 className="text-xl font-bold">{selectedHospital.name}</h2>
                    <p className="text-sm text-muted-foreground">{selectedHospital.category}</p>
                  </div>
                  <button onClick={() => setSelectedHospital(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-5">
                  {[{ label: "Adult", count: selectedHospital.beds.general, Icon: Stethoscope }, { label: "Pediatric", count: selectedHospital.beds.pediatric, Icon: Baby }, { label: "Isolation", count: selectedHospital.beds.isolation, Icon: Shield }].map(({ label, count, Icon }) => (
                    <div key={label} className={`flex flex-col items-center p-3 rounded-xl ${count > 0 ? "bg-green-50" : "bg-red-50"}`}>
                      <Icon className={`w-5 h-5 mb-1 ${count > 0 ? "text-green-600" : "text-red-600"}`} />
                      <span className={`text-xl font-bold ${count > 0 ? "text-green-600" : "text-red-600"}`}>{count}</span>
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-50 rounded-xl p-4 mb-5">
                  <div className="flex items-center gap-3 mb-1"><Phone className="w-4 h-4 text-primary" /><span className="font-medium">{selectedHospital.phone}</span></div>
                  <p className="text-xs text-muted-foreground pl-7">{selectedHospital.address}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => window.location.href = `tel:${selectedHospital.phone}`} className="py-6 rounded-xl"><Phone className="w-4 h-4 mr-2" />Call ER</Button>
                  <Button variant="outline" onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${selectedHospital.lat},${selectedHospital.lng}`, "_blank")} className="py-6 rounded-xl border-primary text-primary"><Navigation className="w-4 h-4 mr-2" />Navigate</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;

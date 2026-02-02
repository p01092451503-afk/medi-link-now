import { Search, Menu } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  onSearch?: (query: string) => void;
}

const Header = ({ onSearch }: HeaderProps) => {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch?.(query);
  };

  return (
    <header className="absolute top-0 left-0 right-0 z-20 p-4 pointer-events-none">
      <div className="flex items-center gap-3 pointer-events-auto">
        {/* Logo and Title */}
        <div className="flex items-center gap-2 bg-card rounded-xl px-4 py-2.5 shadow-soft">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">F</span>
          </div>
          <div className="hidden sm:flex items-baseline gap-1.5">
            <span className="font-logo font-extrabold text-foreground">Find-ER</span>
          </div>
        </div>

        {/* Search Bar */}
        <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Find Hospital or Region..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full bg-card rounded-xl pl-10 pr-4 py-2.5 text-sm shadow-soft border-none outline-none focus:ring-2 focus:ring-primary/20 placeholder:text-muted-foreground"
            />
          </div>
        </div>

        {/* Menu Button */}
        <button className="bg-card rounded-xl p-2.5 shadow-soft hover:bg-secondary transition-colors">
          <Menu className="w-5 h-5 text-foreground" />
        </button>
      </div>
    </header>
  );
};

export default Header;

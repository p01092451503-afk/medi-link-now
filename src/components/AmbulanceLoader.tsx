/**
 * AmbulanceLoader – a fun ambulance-driving loading indicator.
 *
 * Variants:
 *   "fullscreen" – covers the entire viewport (page-level loading)
 *   "inline"     – small inline version for buttons / cards
 *   "section"    – medium, centered in a section
 */

interface AmbulanceLoaderProps {
  /** Display variant */
  variant?: "fullscreen" | "inline" | "section";
  /** Optional message shown below the animation */
  message?: string;
}

const keyframesCSS = `
@keyframes amb-drive{0%{transform:translateX(-60px)}100%{transform:translateX(60px)}}
@keyframes amb-bounce{0%,100%{transform:translateY(0)}25%{transform:translateY(-2px)}75%{transform:translateY(1px)}}
@keyframes amb-road{0%{transform:translateX(0)}100%{transform:translateX(-24px)}}
@keyframes amb-dot{0%,80%,100%{opacity:.3}40%{opacity:1}}
`;

const AmbulanceSVG = ({ size = 48 }: { size?: number }) => {
  const h = (size * 32) / 48;
  return (
    <svg
      width={size}
      height={h}
      viewBox="0 0 48 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <rect x="4" y="8" width="40" height="18" rx="3" fill="hsl(var(--primary))" />
      <rect x="32" y="12" width="10" height="14" rx="2" fill="hsl(var(--primary))" stroke="hsl(var(--primary-foreground))" strokeWidth="0.5" />
      <rect x="34" y="14" width="6" height="5" rx="1" fill="hsl(var(--primary-foreground))" opacity="0.8" />
      <rect x="15" y="14" width="10" height="3" rx="1" fill="hsl(var(--primary-foreground))" />
      <rect x="18.5" y="11" width="3" height="9" rx="1" fill="hsl(var(--primary-foreground))" />
      <rect x="18" y="5" width="6" height="4" rx="2" fill="#EF4444">
        <animate attributeName="opacity" values="1;0.3;1" dur="0.6s" repeatCount="indefinite" />
      </rect>
      <circle cx="14" cy="27" r="3.5" fill="hsl(var(--foreground))" />
      <circle cx="14" cy="27" r="1.5" fill="hsl(var(--muted))" />
      <circle cx="36" cy="27" r="3.5" fill="hsl(var(--foreground))" />
      <circle cx="36" cy="27" r="1.5" fill="hsl(var(--muted))" />
    </svg>
  );
};

const LoadingDots = () => (
  <>
    <span style={{ animation: "amb-dot 1.4s infinite", animationDelay: "0s" }}>.</span>
    <span style={{ animation: "amb-dot 1.4s infinite", animationDelay: "0.2s" }}>.</span>
    <span style={{ animation: "amb-dot 1.4s infinite", animationDelay: "0.4s" }}>.</span>
  </>
);

const AmbulanceLoader = ({ variant = "fullscreen", message }: AmbulanceLoaderProps) => {
  if (variant === "inline") {
    return (
      <span className="inline-flex items-center gap-2">
        <style>{keyframesCSS}</style>
        <span style={{ animation: "amb-drive 2s ease-in-out infinite alternate, amb-bounce 0.3s ease-in-out infinite", display: "inline-block" }}>
          <AmbulanceSVG size={28} />
        </span>
        {message && (
          <span className="text-xs text-muted-foreground">
            {message}
            <LoadingDots />
          </span>
        )}
      </span>
    );
  }

  const wrapperClass =
    variant === "fullscreen"
      ? "min-h-screen bg-background flex items-center justify-center"
      : "flex items-center justify-center py-8";

  return (
    <div className={wrapperClass}>
      <style>{keyframesCSS}</style>
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-32 h-16 flex items-end justify-center">
          {/* Road */}
          <div className="absolute bottom-1 w-full h-[2px] bg-muted-foreground/20 rounded-full overflow-hidden">
            <div
              className="h-full w-full"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(90deg, hsl(var(--muted-foreground) / 0.4) 0px, hsl(var(--muted-foreground) / 0.4) 6px, transparent 6px, transparent 12px)",
                animation: "amb-road 0.4s linear infinite",
              }}
            />
          </div>
          {/* Ambulance */}
          <div style={{ animation: "amb-drive 2.5s ease-in-out infinite alternate, amb-bounce 0.3s ease-in-out infinite" }}>
            <AmbulanceSVG />
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground">
          {message ?? "준비 중"}
          <LoadingDots />
        </p>
      </div>
    </div>
  );
};

export default AmbulanceLoader;

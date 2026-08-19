"use client";

import { cn } from "@/lib/utils";
import { DENSITIES, DENSITY_LABEL, type Density } from "@/lib/grid-density";

export function DensityToggle({
  density,
  onChange,
}: {
  density: Density;
  onChange: (d: Density) => void;
}) {
  return (
    <div className="glass flex items-center gap-0.5 rounded-full p-0.5" role="group" aria-label="Tile size">
      {DENSITIES.map((d) => (
        <button
          key={d}
          type="button"
          onClick={() => onChange(d)}
          className={cn(
            "flex size-6 items-center justify-center rounded-full text-[11px] font-medium",
            d === density
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground",
          )}
          aria-pressed={d === density}
          aria-label={`${DENSITY_LABEL[d]} tiles`}
        >
          {DENSITY_LABEL[d]}
        </button>
      ))}
    </div>
  );
}

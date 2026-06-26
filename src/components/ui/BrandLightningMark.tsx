import { IoFlash } from "react-icons/io5";
import { cn } from "../../utils/cn";

type BrandLightningMarkProps = {
  className?: string;
  size?: "sm" | "md";
  /** When true, hide from assistive tech (use beside text or a logo with alt). */
  decorative?: boolean;
  "aria-label"?: string;
};

const sizeBox = { sm: "h-9 w-9 min-h-9 min-w-9", md: "h-11 w-11 min-h-11 min-w-11" } as const;
const iconPx = { sm: 22, md: 28 } as const;

/** Filled lightning — strong fill so it stays visible on light UI. */
export function BrandLightningMark({
  className,
  size = "md",
  decorative = false,
  "aria-label": ariaLabel = "EasyRisparmio",
}: BrandLightningMarkProps) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-xl border-2 border-[#50D890]/55 bg-[#50D890]/25 text-[#16A35A] shadow-sm",
        sizeBox[size],
        className
      )}
      {...(decorative ? { "aria-hidden": true } : { role: "img", "aria-label": ariaLabel })}
    >
      <IoFlash
        size={iconPx[size]}
        className="block shrink-0 drop-shadow-[0_1px_0_rgba(255,255,255,0.4)]"
        aria-hidden
      />
    </span>
  );
}

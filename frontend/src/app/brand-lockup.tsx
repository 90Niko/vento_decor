import Link from "next/link";

interface BrandLockupProps {
  subtitle: string;
  href?: string;
  inverse?: boolean;
}

export function BrandLockup({
  subtitle,
  href = "/",
  inverse = false,
}: BrandLockupProps) {
  return (
    <Link href={href} className="group inline-flex items-center gap-3.5">
      <span
        className={`relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[0.95rem] shadow-sm transition duration-300 group-hover:-rotate-3 group-hover:scale-105 ${
          inverse
            ? "bg-[#f3f1e9] text-[#17362d]"
            : "bg-[#17362d] text-[#f8f4ed]"
        }`}
      >
        <span className="absolute -right-3 -bottom-3 h-7 w-7 rounded-full bg-[#c77a58]/70" />
        <span className="relative text-sm font-bold">V</span>
      </span>
      <span>
        <span className="block text-sm font-bold tracking-[0.16em] uppercase">
          Vento Decor
        </span>
        <span
          className={`mt-0.5 block text-xs ${inverse ? "text-[#aabdb5]" : "text-[#60736b]"}`}
        >
          {subtitle}
        </span>
      </span>
    </Link>
  );
}

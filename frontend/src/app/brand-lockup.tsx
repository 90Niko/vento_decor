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
            ? "bg-[#eaf6ff] text-[#173b57]"
            : "bg-[#173b57] text-[#ffffff]"
        }`}
      >
        <span className="absolute -right-3 -bottom-3 h-7 w-7 rounded-full bg-[#5aa9d6]/70" />
        <span className="relative text-sm font-bold">V</span>
      </span>
      <span>
        <span className="block text-sm font-bold tracking-[0.16em] uppercase">
          Vento Decor
        </span>
        <span
          className={`mt-0.5 block text-xs ${inverse ? "text-[#eaf6ff]/75" : "text-[#173b57]/68"}`}
        >
          {subtitle}
        </span>
      </span>
    </Link>
  );
}

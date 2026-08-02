import type { InputHTMLAttributes } from "react";

export function ToggleSwitch({
  className = "",
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  return (
    <>
      <input {...props} type="checkbox" className="peer sr-only" />
      <span
        aria-hidden="true"
        className={`relative h-7 w-12 shrink-0 rounded-full bg-[#173b57]/15 shadow-inner transition-colors duration-300 peer-focus-visible:ring-4 peer-focus-visible:ring-[#5aa9d6]/25 peer-checked:bg-[#34c759] peer-checked:[&>span]:translate-x-5 ${className}`}
      >
        <span className="absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow-md transition-transform duration-300" />
      </span>
    </>
  );
}

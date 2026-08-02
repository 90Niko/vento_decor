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
        className={`relative h-8 w-[3.25rem] shrink-0 overflow-hidden rounded-xl border border-[#173b57]/12 bg-[#173b57]/8 shadow-inner transition-all duration-300 before:absolute before:top-1/2 before:right-2 before:h-1 before:w-1 before:-translate-y-1/2 before:rounded-full before:bg-[#173b57]/25 before:transition-opacity after:absolute after:top-1/2 after:right-3.5 after:h-1 after:w-1 after:-translate-y-1/2 after:rounded-full after:bg-[#173b57]/12 after:transition-opacity peer-focus-visible:ring-4 peer-focus-visible:ring-[#5aa9d6]/25 peer-checked:border-[#5aa9d6]/45 peer-checked:bg-gradient-to-r peer-checked:from-[#173b57] peer-checked:to-[#5aa9d6] peer-checked:shadow-[0_6px_18px_rgb(90_169_214/28%)] peer-checked:before:opacity-0 peer-checked:after:opacity-0 peer-checked:[&>span]:translate-x-5 peer-checked:[&>span>svg]:scale-100 peer-checked:[&>span>svg]:opacity-100 ${className}`}
      >
        <span className="absolute top-1/2 left-1 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-lg bg-white shadow-[0_3px_10px_rgb(23_59_87/22%)] transition-transform duration-300">
          <svg
            width="13"
            height="13"
            viewBox="0 0 16 16"
            fill="none"
            className="scale-75 text-[#3788b8] opacity-0 transition-all duration-300"
          >
            <path
              d="m3.25 8.2 3 3.05 6.5-6.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </span>
    </>
  );
}

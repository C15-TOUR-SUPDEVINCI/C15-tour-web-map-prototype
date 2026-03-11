import * as React from "react";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", type = "text", ...props }, ref) => {
        return (
            <input
                ref={ref}
                type={type}
                className={
                    "w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 " +
                    "placeholder:text-slate-400 " +
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 " +
                    "disabled:cursor-not-allowed disabled:opacity-50 " +
                    className
                }
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export default Input;
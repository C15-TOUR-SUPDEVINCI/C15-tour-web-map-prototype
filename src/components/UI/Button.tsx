import * as React from "react";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", type = "button", children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                type={type}

                className={
                    "inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white " +
                    "transition-colors hover:bg-slate-800 " +
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-900 focus-visible:ring-offset-2 " +
                    "disabled:pointer-events-none disabled:opacity-50 " +
                    className
                }
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export default Button;
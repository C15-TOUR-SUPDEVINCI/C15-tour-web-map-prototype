import * as React from "react";
import "./Button.css";

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement>;

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = "", type = "button", children, ...props }, ref) => {
        return (
            <button
                ref={ref}
                type={type}
                className={`ui-button ${className}`}
                {...props}
            >
                {children}
            </button>
        );
    }
);

Button.displayName = "Button";

export default Button;
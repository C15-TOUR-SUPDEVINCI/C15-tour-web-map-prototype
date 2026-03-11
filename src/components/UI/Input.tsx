import * as React from "react";
import "./Input.css";

type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className = "", type = "text", ...props }, ref) => {
        return (
            <input
                ref={ref}
                type={type}
                className={`ui-input ${className}`}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

export default Input;
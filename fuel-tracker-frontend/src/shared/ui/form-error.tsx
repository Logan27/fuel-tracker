import * as React from "react";
import { AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormErrorProps {
  error?: string | string[];
  className?: string;
}

const FormError = React.forwardRef<HTMLDivElement, FormErrorProps>(
  ({ error, className, ...props }, ref) => {
    if (!error) return null;

    const errors = Array.isArray(error) ? error : [error];

    return (
      <div
        ref={ref}
        className={cn("flex items-start space-x-2 text-sm text-destructive", className)}
        {...props}
      >
        <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
        <div className="space-y-1">
          {errors.map((err, index) => (
            <div key={index} className="block">
              {err}
            </div>
          ))}
        </div>
      </div>
    );
  }
);
FormError.displayName = "FormError";

// Enhanced form field with better error display
interface FormFieldErrorProps {
  error?: string | string[];
  className?: string;
}

export const FormFieldError = React.forwardRef<HTMLDivElement, FormFieldErrorProps>(
  ({ error, className, ...props }, ref) => {
    if (!error) return null;

    const errors = Array.isArray(error) ? error : [error];

    return (
      <div
        ref={ref}
        className={cn("mt-1 space-y-1", className)}
        {...props}
      >
        {errors.map((err, index) => (
          <div
            key={index}
            className="flex items-center space-x-1 text-sm text-destructive"
          >
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>{err}</span>
          </div>
        ))}
      </div>
    );
  }
);
FormFieldError.displayName = "FormFieldError";

// Server validation errors display
interface ServerValidationErrorsProps {
  errors: Record<string, string[]>;
  className?: string;
}

export const ServerValidationErrors = React.forwardRef<HTMLDivElement, ServerValidationErrorsProps>(
  ({ errors, className, ...props }, ref) => {
    if (!errors || Object.keys(errors).length === 0) return null;

    return (
      <div
        ref={ref}
        className={cn("space-y-2 p-4 border border-destructive/20 rounded-md bg-destructive/5", className)}
        {...props}
      >
        <div className="flex items-center space-x-2 text-sm font-medium text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>Please fix the following errors:</span>
        </div>
        <div className="space-y-1">
          {Object.entries(errors).map(([field, fieldErrors]) => (
            <div key={field} className="text-sm">
              <span className="font-medium capitalize">{field}:</span>
              <ul className="ml-4 list-disc list-inside">
                {fieldErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
ServerValidationErrors.displayName = "ServerValidationErrors";

export { FormError };

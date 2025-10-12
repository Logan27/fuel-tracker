import * as React from "react";
import { X, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { cn } from "@/lib/utils";

interface OnboardingTooltipProps {
  isVisible: boolean;
  title: string;
  description: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onClose: () => void;
  currentStep: number;
  totalSteps: number;
  className?: string;
}

export const OnboardingTooltip = React.forwardRef<HTMLDivElement, OnboardingTooltipProps>(
  ({
    isVisible,
    title,
    description,
    position = 'bottom',
    action,
    onNext,
    onPrevious,
    onSkip,
    onClose,
    currentStep,
    totalSteps,
    className,
    ...props
  }, ref) => {
    if (!isVisible) return null;

    const isFirstStep = currentStep === 0;
    const isLastStep = currentStep === totalSteps - 1;

    return (
      <div
        ref={ref}
        className={cn(
          "fixed inset-0 z-50 pointer-events-none",
          className
        )}
        {...props}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/50 pointer-events-auto" />
        
        {/* Tooltip */}
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-none">
          <Card className="max-w-sm w-full pointer-events-auto shadow-2xl">
            <CardContent className="p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="ml-2 h-8 w-8 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {/* Action Button */}
              {action && (
                <div className="mb-4">
                  <Button
                    onClick={action.onClick}
                    className="w-full"
                  >
                    {action.label}
                  </Button>
                </div>
              )}

              {/* Progress */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    {Array.from({ length: totalSteps }).map((_, index) => (
                      <div
                        key={index}
                        className={cn(
                          "h-2 w-2 rounded-full transition-colors",
                          index <= currentStep
                            ? "bg-primary"
                            : "bg-muted"
                        )}
                      />
                    ))}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {currentStep + 1} of {totalSteps}
                  </span>
                </div>
              </div>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <div className="flex space-x-2">
                  {!isFirstStep && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={onPrevious}
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Previous
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={onSkip}
                  >
                    Skip
                  </Button>
                </div>
                
                <Button
                  size="sm"
                  onClick={onNext}
                >
                  {isLastStep ? (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Finish
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }
);
OnboardingTooltip.displayName = "OnboardingTooltip";

// Hook for managing onboarding state
export const useOnboardingTooltip = (config: {
  steps: Array<{
    id: string;
    title: string;
    description: string;
    target: string;
    position?: 'top' | 'bottom' | 'left' | 'right';
    action?: {
      label: string;
      onClick: () => void;
    };
  }>;
  storageKey?: string;
  autoStart?: boolean;
}) => {
  const [currentStep, setCurrentStep] = React.useState(0);
  const [isActive, setIsActive] = React.useState(false);
  const [isCompleted, setIsCompleted] = React.useState(false);

  React.useEffect(() => {
    const completed = localStorage.getItem(config.storageKey || 'onboarding-completed') === 'true';
    setIsCompleted(completed);
    
    if (config.autoStart && !completed) {
      setIsActive(true);
    }
  }, [config.storageKey, config.autoStart]);

  const start = () => {
    setIsActive(true);
    setCurrentStep(0);
  };

  const next = () => {
    if (currentStep < config.steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      complete();
    }
  };

  const previous = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const skip = () => {
    complete();
  };

  const complete = () => {
    setIsActive(false);
    setIsCompleted(true);
    localStorage.setItem(config.storageKey || 'onboarding-completed', 'true');
  };

  const reset = () => {
    setIsCompleted(false);
    setIsActive(false);
    setCurrentStep(0);
    localStorage.removeItem(config.storageKey || 'onboarding-completed');
  };

  const currentStepData = config.steps[currentStep];

  return {
    currentStep,
    currentStepData,
    isActive,
    isCompleted,
    totalSteps: config.steps.length,
    start,
    next,
    previous,
    skip,
    complete,
    reset,
  };
};

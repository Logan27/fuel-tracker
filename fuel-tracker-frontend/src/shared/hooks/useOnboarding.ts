import { useState, useEffect, useCallback } from 'react';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector
  position?: 'top' | 'bottom' | 'left' | 'right';
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface OnboardingConfig {
  steps: OnboardingStep[];
  storageKey?: string;
  autoStart?: boolean;
}

export const useOnboarding = (config: OnboardingConfig) => {
  const { steps, storageKey = 'onboarding-completed', autoStart = false } = config;
  
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isActive, setIsActive] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  // Check if onboarding was completed
  useEffect(() => {
    const completed = localStorage.getItem(storageKey) === 'true';
    setIsCompleted(completed);
    
    if (autoStart && !completed) {
      setIsActive(true);
    }
  }, [storageKey, autoStart]);

  const start = useCallback(() => {
    setIsActive(true);
    setCurrentStep(0);
  }, []);

  const next = useCallback(() => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      complete();
    }
  }, [currentStep, steps.length]);

  const previous = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  }, [currentStep]);

  const skip = useCallback(() => {
    complete();
  }, []);

  const complete = useCallback(() => {
    setIsActive(false);
    setIsCompleted(true);
    localStorage.setItem(storageKey, 'true');
  }, [storageKey]);

  const reset = useCallback(() => {
    setIsCompleted(false);
    setIsActive(false);
    setCurrentStep(0);
    localStorage.removeItem(storageKey);
  }, [storageKey]);

  const currentStepData = steps[currentStep];

  return {
    currentStep,
    currentStepData,
    isActive,
    isCompleted,
    totalSteps: steps.length,
    start,
    next,
    previous,
    skip,
    complete,
    reset,
  };
};

// Predefined onboarding flows
export const DASHBOARD_ONBOARDING: OnboardingStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Fuel Tracker!',
    description: 'Let\'s take a quick tour to get you started with tracking your fuel consumption.',
    target: '[data-tour="welcome"]',
    position: 'bottom',
  },
  {
    id: 'add-vehicle',
    title: 'Add Your First Vehicle',
    description: 'Start by adding your vehicle to begin tracking fuel consumption.',
    target: '[data-tour="add-vehicle"]',
    position: 'bottom',
    action: {
      label: 'Add Vehicle',
      onClick: () => {
        // This will be handled by the component
      },
    },
  },
  {
    id: 'add-entry',
    title: 'Add Fuel Entry',
    description: 'Record your first fuel refill to start tracking consumption and costs.',
    target: '[data-tour="add-entry"]',
    position: 'bottom',
    action: {
      label: 'Add Entry',
      onClick: () => {
        // This will be handled by the component
      },
    },
  },
  {
    id: 'view-stats',
    title: 'View Statistics',
    description: 'Check out your fuel consumption statistics and trends here.',
    target: '[data-tour="view-stats"]',
    position: 'top',
  },
];

export const VEHICLES_ONBOARDING: OnboardingStep[] = [
  {
    id: 'vehicles-list',
    title: 'Your Vehicles',
    description: 'Here you can see all your vehicles and manage them.',
    target: '[data-tour="vehicles-list"]',
    position: 'bottom',
  },
  {
    id: 'add-vehicle-btn',
    title: 'Add New Vehicle',
    description: 'Click here to add a new vehicle to your fleet.',
    target: '[data-tour="add-vehicle-btn"]',
    position: 'left',
  },
];

export const ENTRIES_ONBOARDING: OnboardingStep[] = [
  {
    id: 'entries-list',
    title: 'Fuel Entries',
    description: 'Here you can see all your fuel refill records.',
    target: '[data-tour="entries-list"]',
    position: 'bottom',
  },
  {
    id: 'add-entry-btn',
    title: 'Add New Entry',
    description: 'Click here to record a new fuel refill.',
    target: '[data-tour="add-entry-btn"]',
    position: 'left',
  },
  {
    id: 'filters',
    title: 'Filters',
    description: 'Use these filters to find specific entries by date, vehicle, or other criteria.',
    target: '[data-tour="filters"]',
    position: 'bottom',
  },
];

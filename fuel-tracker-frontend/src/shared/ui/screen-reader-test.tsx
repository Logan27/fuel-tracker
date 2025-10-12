// Screen reader testing and accessibility testing components

import { ReactNode, useState, useEffect } from 'react';
import { cn } from '@/shared/lib/utils/cn';
import { isScreenReaderActive, validateAriaAttributes } from '@/shared/lib/accessibility';

interface ScreenReaderTestProps {
  children: ReactNode;
  className?: string;
  testMode?: boolean;
}

export const ScreenReaderTest = ({ children, className, testMode = false }: ScreenReaderTestProps) => {
  const [isActive, setIsActive] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setIsActive(isScreenReaderActive());
  }, []);

  const runAccessibilityTests = () => {
    const container = document.querySelector('[data-testid="screen-reader-test"]');
    if (!container) return;

    const allElements = container.querySelectorAll('*');
    const allErrors: string[] = [];

    allElements.forEach((element) => {
      const elementErrors = validateAriaAttributes(element as HTMLElement);
      allErrors.push(...elementErrors);
    });

    setErrors(allErrors);
  };

  if (!testMode) {
    return <>{children}</>;
  }

  return (
    <div 
      data-testid="screen-reader-test"
      className={cn('space-y-4', className)}
    >
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="text-lg font-semibold text-blue-900 mb-2">
          Screen Reader Test Mode
        </h3>
        <div className="space-y-2 text-sm text-blue-800">
          <p>
            <strong>Screen Reader Active:</strong> {isActive ? 'Yes' : 'No'}
          </p>
          <p>
            <strong>Errors Found:</strong> {errors.length}
          </p>
          {errors.length > 0 && (
            <div className="mt-2">
              <p className="font-semibold">Accessibility Issues:</p>
              <ul className="list-disc list-inside space-y-1">
                {errors.map((error, index) => (
                  <li key={index} className="text-red-600">{error}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <button
          onClick={runAccessibilityTests}
          className="mt-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700"
        >
          Run Tests
        </button>
      </div>
      {children}
    </div>
  );
};

interface AccessibilityAuditProps {
  children: ReactNode;
  className?: string;
  showAudit?: boolean;
}

export const AccessibilityAudit = ({ children, className, showAudit = false }: AccessibilityAuditProps) => {
  const [auditResults, setAuditResults] = useState<{
    totalElements: number;
    errors: string[];
    warnings: string[];
    passed: number;
  }>({
    totalElements: 0,
    errors: [],
    warnings: [],
    passed: 0
  });

  const runAudit = () => {
    const container = document.querySelector('[data-testid="accessibility-audit"]');
    if (!container) return;

    const allElements = container.querySelectorAll('*');
    const errors: string[] = [];
    const warnings: string[] = [];
    let passed = 0;

    allElements.forEach((element) => {
      const elementErrors = validateAriaAttributes(element as HTMLElement);
      if (elementErrors.length > 0) {
        errors.push(...elementErrors);
      } else {
        passed++;
      }

      // Check for common accessibility issues
      const htmlElement = element as HTMLElement;
      
      // Check for missing alt text on images
      if (htmlElement.tagName === 'IMG' && !htmlElement.getAttribute('alt')) {
        warnings.push('Image missing alt text');
      }

      // Check for missing labels on form inputs
      if (['INPUT', 'SELECT', 'TEXTAREA'].includes(htmlElement.tagName)) {
        const hasLabel = htmlElement.getAttribute('aria-label') || 
                        htmlElement.getAttribute('aria-labelledby') ||
                        htmlElement.closest('label');
        if (!hasLabel) {
          warnings.push('Form input missing label');
        }
      }

      // Check for missing headings
      if (htmlElement.tagName.match(/^H[1-6]$/) && !htmlElement.textContent?.trim()) {
        warnings.push('Heading element is empty');
      }
    });

    setAuditResults({
      totalElements: allElements.length,
      errors,
      warnings,
      passed
    });
  };

  if (!showAudit) {
    return <>{children}</>;
  }

  return (
    <div 
      data-testid="accessibility-audit"
      className={cn('space-y-4', className)}
    >
      <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
        <h3 className="text-lg font-semibold text-green-900 mb-2">
          Accessibility Audit
        </h3>
        <div className="space-y-2 text-sm text-green-800">
          <p>
            <strong>Total Elements:</strong> {auditResults.totalElements}
          </p>
          <p>
            <strong>Passed:</strong> {auditResults.passed}
          </p>
          <p>
            <strong>Errors:</strong> {auditResults.errors.length}
          </p>
          <p>
            <strong>Warnings:</strong> {auditResults.warnings.length}
          </p>
        </div>
        <button
          onClick={runAudit}
          className="mt-2 px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
        >
          Run Audit
        </button>
      </div>
      {children}
    </div>
  );
};

interface ColorContrastTestProps {
  foregroundColor: string;
  backgroundColor: string;
  className?: string;
}

export const ColorContrastTest = ({ foregroundColor, backgroundColor, className }: ColorContrastTestProps) => {
  const [contrastRatio, setContrastRatio] = useState<number>(0);
  const [isAccessible, setIsAccessible] = useState<boolean>(false);

  useEffect(() => {
    const { getContrastRatio, isAccessibleContrast } = require('@/shared/lib/accessibility');
    const ratio = getContrastRatio(foregroundColor, backgroundColor);
    const accessible = isAccessibleContrast(foregroundColor, backgroundColor);
    
    setContrastRatio(ratio);
    setIsAccessible(accessible);
  }, [foregroundColor, backgroundColor]);

  return (
    <div className={cn('p-4 border rounded-lg', className)}>
      <h3 className="text-lg font-semibold mb-2">Color Contrast Test</h3>
      <div className="space-y-2 text-sm">
        <p>
          <strong>Foreground:</strong> {foregroundColor}
        </p>
        <p>
          <strong>Background:</strong> {backgroundColor}
        </p>
        <p>
          <strong>Contrast Ratio:</strong> {contrastRatio.toFixed(2)}
        </p>
        <p>
          <strong>WCAG AA Compliant:</strong> {isAccessible ? 'Yes' : 'No'}
        </p>
      </div>
      <div 
        className="mt-2 p-2 rounded"
        style={{ 
          color: foregroundColor, 
          backgroundColor: backgroundColor 
        }}
      >
        Sample text for contrast testing
      </div>
    </div>
  );
};

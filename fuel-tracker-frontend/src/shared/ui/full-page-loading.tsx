import { LoadingSpinner } from './loading-spinner';

interface FullPageLoadingProps {
  text?: string;
}

export const FullPageLoading = ({ text = 'Loading...' }: FullPageLoadingProps) => {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
};


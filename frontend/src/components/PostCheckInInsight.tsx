import { useEffect } from 'react';
import { InsightCard } from '../services/api';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

interface PostCheckInInsightProps {
  insight: InsightCard;
  onDismiss: () => void;
  autoHideDuration?: number; // milliseconds, default 10000
}

const gradientBackgrounds: Record<InsightCard['type'], string> = {
  data_context: 'bg-gradient-to-br from-blue-50 to-blue-100',
  validation: 'bg-gradient-to-br from-green-50 to-green-100',
  pattern: 'bg-gradient-to-br from-purple-50 to-purple-100',
  community: 'bg-gradient-to-br from-orange-50 to-orange-100',
};

export default function PostCheckInInsight({
  insight,
  onDismiss,
  autoHideDuration = 10000,
}: PostCheckInInsightProps) {
  // Auto-dismiss after duration
  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onDismiss();
      }, autoHideDuration);

      return () => clearTimeout(timer);
    }
  }, [onDismiss, autoHideDuration]);

  const gradientClass = gradientBackgrounds[insight.type];

  // Split message by newlines for proper formatting
  const messageLines = insight.message.split('\n').filter((line) => line.trim());

  return (
    <Modal
      open={true}
      onClose={onDismiss}
      title=""
      showCloseButton={false}
      size="medium"
      className="!p-0"
    >
      <div
        className={`${gradientClass} p-6 sm:p-8 rounded-2xl -m-6`}
        role="region"
        aria-labelledby="insight-title"
        aria-describedby="insight-message"
      >
        <div className="relative text-center bg-white p-8 rounded-xl shadow-lg">
          {/* Close button */}
          <button
            onClick={onDismiss}
            className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-600 transition-colors"
            aria-label="Close insight"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>

          {/* Icon */}
          <div className="text-5xl sm:text-6xl mb-4" role="img" aria-label="Insight icon">
            {insight.icon}
          </div>

          {/* Title */}
          <h2
            id="insight-title"
            className="text-lg sm:text-xl font-bold text-neutral-900 mb-3"
          >
            {insight.title}
          </h2>

          {/* Message */}
          <div
            id="insight-message"
            className="text-sm sm:text-base text-neutral-600 mb-6 space-y-1"
          >
            {messageLines.map((line, index) => (
              <p key={index}>{line}</p>
            ))}
          </div>

          {/* Button */}
          <Button onClick={onDismiss} variant="primary" className="w-full sm:w-auto">
            Continue to Dashboard
          </Button>
        </div>
      </div>
    </Modal>
  );
}

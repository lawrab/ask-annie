import { useState } from 'react';
import { Card, Badge, Button, ConfirmDialog } from './ui';
import { CheckIn } from '../services/api';
import { cn } from '../utils/cn';
import type { BadgeProps } from './ui/Badge';

interface CheckInCardProps {
  checkIn: CheckIn;
  mode?: 'compact' | 'expanded';
  defaultExpanded?: boolean;
  onFlag?: (id: string, flagged: boolean) => void;
  onDelete?: (id: string) => void;
  onEdit?: (id: string) => void;
}

/**
 * Get Badge variant based on symptom severity (1-10 scale)
 * - Low (1-3): Green (success)
 * - Medium (4-7): Amber (warning)
 * - High (8-10): Red (error)
 */
// eslint-disable-next-line react-refresh/only-export-components
export const getSeverityVariant = (severity: number): BadgeProps['variant'] => {
  if (severity <= 3) return 'success';
  if (severity <= 7) return 'warning';
  return 'error';
};

/**
 * Get accessible severity label for screen readers
 */
const getSeverityLabel = (severity: number): string => {
  if (severity <= 3) return 'low severity';
  if (severity <= 7) return 'medium severity';
  return 'high severity';
};

/**
 * Format timestamp to readable string
 */
const formatTimestamp = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Format time only (for compact mode)
 */
const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
};

/**
 * CheckInCard Component
 *
 * Displays check-in data in compact or expanded mode with progressive disclosure.
 *
 * Features:
 * - Compact mode: Time + severity dots + notes snippet
 * - Expanded mode: Full details with all symptoms, activities, triggers
 * - Severity-based color coding (red/amber/green)
 * - Keyboard accessible (Enter/Space to expand)
 * - Flag for doctor toggle
 * - Delete with confirmation dialog
 */
export const CheckInCard: React.FC<CheckInCardProps> = ({
  checkIn,
  mode = 'compact',
  defaultExpanded = false,
  onFlag,
  onDelete,
  onEdit,
}) => {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isFlagged, setIsFlagged] = useState(checkIn.flaggedForDoctor);

  // Determine if we should show expanded view
  const shouldShowExpanded = mode === 'expanded' || isExpanded;

  // Get top 3 symptoms for compact mode
  const symptoms = Object.entries(checkIn.structured.symptoms);
  const topSymptoms = symptoms.slice(0, 3);

  // Truncate notes for compact mode
  const notesSnippet = checkIn.structured.notes
    ? checkIn.structured.notes.length > 60
      ? `${checkIn.structured.notes.substring(0, 60)}...`
      : checkIn.structured.notes
    : '';

  // Handle expand/collapse
  const toggleExpanded = () => {
    if (mode !== 'expanded') {
      setIsExpanded(!isExpanded);
    }
  };

  // Handle keyboard interaction
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (mode !== 'expanded' && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      toggleExpanded();
    }
  };

  // Handle flag toggle
  const handleFlagToggle = () => {
    const newFlagged = !isFlagged;
    setIsFlagged(newFlagged);
    if (onFlag) {
      onFlag(checkIn._id, newFlagged);
    }
  };

  // Handle delete
  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const confirmDelete = () => {
    if (onDelete) {
      onDelete(checkIn._id);
    }
    setShowDeleteDialog(false);
  };

  // Compact mode rendering
  if (!shouldShowExpanded) {
    return (
      <>
        <div
          className={cn(
            'group relative p-4 rounded-lg border border-gray-200 hover:border-gray-300',
            'hover:shadow-sm transition-all cursor-pointer',
            'focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
          )}
          onClick={toggleExpanded}
          onKeyDown={handleKeyDown}
          role="button"
          tabIndex={0}
          aria-expanded={isExpanded}
          aria-label={`Check-in from ${formatTime(checkIn.timestamp)}, click to expand`}
        >
          <div className="flex items-center justify-between gap-4">
            {/* Time */}
            <span className="text-sm text-gray-500 font-medium shrink-0">
              {formatTime(checkIn.timestamp)}
            </span>

            {/* Symptom dots + notes snippet */}
            <div className="flex items-center gap-3 flex-1 min-w-0">
              {/* Severity dots */}
              {topSymptoms.length > 0 && (
                <div className="flex gap-1.5 shrink-0" aria-label="Symptoms">
                  {topSymptoms.map(([symptom, value]) => {
                    const variant = getSeverityVariant(value.severity);
                    const bgColor =
                      variant === 'success'
                        ? 'bg-emerald-500'
                        : variant === 'warning'
                        ? 'bg-amber-500'
                        : 'bg-red-500';

                    return (
                      <div
                        key={symptom}
                        className={cn('w-3 h-3 rounded-full', bgColor)}
                        title={`${symptom}: ${value.severity} (${getSeverityLabel(value.severity)})`}
                        aria-label={`${symptom} severity ${value.severity}`}
                      />
                    );
                  })}
                  {symptoms.length > 3 && (
                    <span className="text-xs text-gray-400 ml-0.5">
                      +{symptoms.length - 3}
                    </span>
                  )}
                </div>
              )}

              {/* Notes snippet */}
              {notesSnippet && (
                <p className="text-sm text-gray-600 truncate flex-1">
                  &ldquo;{notesSnippet}&rdquo;
                </p>
              )}
            </div>

            {/* Flag indicator + expand icon */}
            <div className="flex items-center gap-2 shrink-0">
              {isFlagged && (
                <Badge variant="warning" size="small">
                  Flagged
                </Badge>
              )}
              <svg
                className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Delete confirmation dialog */}
        <ConfirmDialog
          open={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={confirmDelete}
          title="Delete Check-In"
          description="Are you sure you want to delete this check-in? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          confirmVariant="danger"
        />
      </>
    );
  }

  // Expanded mode rendering
  return (
    <>
      <Card variant="default">
        {/* Header: Timestamp + Flagged Badge */}
        <div className="flex justify-between items-start mb-4">
          <div>
            <span className="text-sm text-gray-600">
              {formatTimestamp(checkIn.timestamp)}
            </span>
            {mode !== 'expanded' && (
              <Button
                variant="link"
                size="small"
                onClick={toggleExpanded}
                className="ml-2 text-xs"
              >
                Show less
              </Button>
            )}
          </div>
          {isFlagged && <Badge variant="warning">Flagged for Doctor</Badge>}
        </div>

        {/* Raw Transcript */}
        {checkIn.rawTranscript && (
          <div className="mb-4">
            <p className="text-sm text-gray-700 italic">
              &ldquo;{checkIn.rawTranscript}&rdquo;
            </p>
          </div>
        )}

        {/* Structured Data */}
        <div className="space-y-3">
          {/* Symptoms with severity colors */}
          {symptoms.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Symptoms:
              </h4>
              <div className="flex flex-wrap gap-2">
                {symptoms.map(([symptom, value]) => (
                  <Badge
                    key={symptom}
                    variant={getSeverityVariant(value.severity)}
                    aria-label={`${symptom} ${getSeverityLabel(value.severity)} ${value.severity}`}
                  >
                    {symptom}: {value.severity}
                    {value.location && ` (${value.location})`}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Activities */}
          {checkIn.structured.activities.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Activities:
              </h4>
              <div className="flex flex-wrap gap-2">
                {checkIn.structured.activities.map((activity) => (
                  <Badge key={activity} variant="success">
                    {activity}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Triggers */}
          {checkIn.structured.triggers.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Triggers:
              </h4>
              <div className="flex flex-wrap gap-2">
                {checkIn.structured.triggers.map((trigger) => (
                  <Badge key={trigger} variant="error">
                    {trigger}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {checkIn.structured.notes && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Notes:
              </h4>
              <p className="text-sm text-gray-600">
                {checkIn.structured.notes}
              </p>
            </div>
          )}

          {/* Symptom location/notes details */}
          {symptoms.some(([, value]) => value.notes) && (
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                Symptom Details:
              </h4>
              <div className="space-y-1">
                {symptoms
                  .filter(([, value]) => value.notes)
                  .map(([symptom, value]) => (
                    <p key={symptom} className="text-sm text-gray-600">
                      <span className="font-medium">{symptom}:</span>{' '}
                      {value.notes}
                    </p>
                  ))}
              </div>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3 mt-4 pt-4 border-t border-gray-200">
          <Button
            variant={isFlagged ? 'secondary' : 'tertiary'}
            size="small"
            onClick={handleFlagToggle}
            icon={
              <svg
                className="w-4 h-4"
                fill={isFlagged ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9"
                />
              </svg>
            }
          >
            {isFlagged ? 'Flagged' : 'Flag for Doctor'}
          </Button>

          {onEdit && (
            <Button
              variant="tertiary"
              size="small"
              onClick={() => onEdit(checkIn._id)}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              }
            >
              Edit
            </Button>
          )}

          {onDelete && (
            <Button
              variant="tertiary"
              size="small"
              onClick={handleDelete}
              icon={
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              }
            >
              Delete
            </Button>
          )}
        </div>
      </Card>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        open={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={confirmDelete}
        title="Delete Check-In"
        description="Are you sure you want to delete this check-in? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        confirmVariant="danger"
      />
    </>
  );
};

export default CheckInCard;

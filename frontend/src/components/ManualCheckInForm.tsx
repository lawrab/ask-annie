import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from './ui/Input';
import { TextArea } from './ui/TextArea';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { SymptomValue, checkInsApi } from '../services/api';

const manualCheckInSchema = z.object({
  activities: z.string(),
  triggers: z.string(),
  notes: z.string().optional(),
});

type ManualCheckInFormData = z.infer<typeof manualCheckInSchema>;

interface StructuredCheckInData {
  symptoms: { [key: string]: SymptomValue };
  activities: string[];
  triggers: string[];
  notes: string;
}

interface ManualCheckInFormProps {
  onSubmit: (data: StructuredCheckInData) => void;
}

export default function ManualCheckInForm({ onSubmit }: ManualCheckInFormProps) {
  const [symptoms, setSymptoms] = useState<{ name: string; severity: number }[]>(
    []
  );
  const [symptomName, setSymptomName] = useState('');
  const [symptomSeverity, setSymptomSeverity] = useState(5);
  const [previousSymptoms, setPreviousSymptoms] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Fetch previous symptoms for typeahead
  useEffect(() => {
    const fetchPreviousSymptoms = async () => {
      try {
        const response = await checkInsApi.getContext();
        if (response.success && response.data.recentSymptoms) {
          const names = response.data.recentSymptoms.map((s) => s.name);
          setPreviousSymptoms(names);
        }
      } catch {
        // Silently fail - typeahead is optional
      }
    };
    fetchPreviousSymptoms();
  }, []);

  // Filter suggestions based on input
  const filteredSuggestions = symptomName.trim()
    ? previousSymptoms.filter(
        (s) =>
          s.toLowerCase().includes(symptomName.toLowerCase()) &&
          !symptoms.some((existing) => existing.name.toLowerCase() === s.toLowerCase())
      )
    : [];

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(e.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectSuggestion = (name: string) => {
    setSymptomName(name);
    setShowSuggestions(false);
    setSelectedIndex(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || filteredSuggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      selectSuggestion(filteredSuggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ManualCheckInFormData>({
    resolver: zodResolver(manualCheckInSchema),
    mode: 'onBlur',
  });

  const addSymptom = () => {
    if (symptomName.trim()) {
      setSymptoms([
        ...symptoms,
        { name: symptomName.trim(), severity: symptomSeverity },
      ]);
      setSymptomName('');
      setSymptomSeverity(5);
    }
  };

  const removeSymptom = (index: number) => {
    setSymptoms(symptoms.filter((_, i) => i !== index));
  };

  // Check if there are any symptoms (including pending input)
  const hasSymptoms = symptoms.length > 0 || symptomName.trim().length > 0;

  const handleFormSubmit = (data: ManualCheckInFormData) => {
    // Auto-add any pending symptom that wasn't explicitly added
    const finalSymptoms = symptomName.trim()
      ? [...symptoms, { name: symptomName.trim(), severity: symptomSeverity }]
      : [...symptoms];

    // Prevent submission without symptoms
    if (finalSymptoms.length === 0) {
      return;
    }

    // Convert form data to structured format
    const structuredData: StructuredCheckInData = {
      symptoms: finalSymptoms.reduce(
        (acc, s) => {
          acc[s.name] = { severity: s.severity };
          return acc;
        },
        {} as { [key: string]: SymptomValue }
      ),
      activities: data.activities
        .split(',')
        .map((a) => a.trim())
        .filter((a) => a),
      triggers: data.triggers
        .split(',')
        .map((t) => t.trim())
        .filter((t) => t),
      notes: data.notes || '',
    };

    onSubmit(structuredData);
    reset();
    setSymptoms([]);
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
        {/* Symptoms Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Symptoms
          </label>

          {/* Add Symptom */}
          <div className="flex space-x-2 mb-3">
            <div className="flex-1 relative">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Symptom name (e.g., headache)"
                value={symptomName}
                onChange={(e) => {
                  setSymptomName(e.target.value);
                  setShowSuggestions(true);
                  setSelectedIndex(-1);
                }}
                onFocus={() => setShowSuggestions(true)}
                onKeyDown={handleKeyDown}
                autoComplete="off"
              />
              {/* Typeahead suggestions */}
              {showSuggestions && filteredSuggestions.length > 0 && (
                <div
                  ref={suggestionsRef}
                  className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto"
                >
                  {filteredSuggestions.map((suggestion, index) => (
                    <button
                      key={suggestion}
                      type="button"
                      className={`w-full px-3 py-2 text-left text-sm hover:bg-indigo-50 ${
                        index === selectedIndex ? 'bg-indigo-50 text-indigo-700' : 'text-gray-700'
                      }`}
                      onClick={() => selectSuggestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="range"
                min="1"
                max="10"
                value={symptomSeverity}
                onChange={(e) => setSymptomSeverity(Number(e.target.value))}
                className="w-24"
              />
              <span className="text-sm font-medium text-gray-700 w-6">
                {symptomSeverity}
              </span>
            </div>
            <Button type="button" onClick={addSymptom} variant="primary" size="small" aria-label="Add symptom">
              Add
            </Button>
          </div>

          {/* Symptoms List */}
          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {symptoms.map((symptom, index) => (
                <Badge
                  key={index}
                  variant="primary"
                  removable
                  onRemove={() => removeSymptom(index)}
                >
                  {symptom.name}: {symptom.severity}
                </Badge>
              ))}
            </div>
          )}
        </div>

        {/* Activities */}
        <Input
          {...register('activities')}
          id="activities"
          type="text"
          label="Activities"
          placeholder="e.g., working, exercising, reading (comma-separated)"
          error={errors.activities?.message}
        />

        {/* Triggers */}
        <Input
          {...register('triggers')}
          id="triggers"
          type="text"
          label="Triggers"
          placeholder="e.g., stress, lack of sleep, weather (comma-separated)"
          error={errors.triggers?.message}
        />

        {/* Notes */}
        <TextArea
          {...register('notes')}
          id="notes"
          label="Additional Notes"
          rows={4}
          placeholder="Any additional details about how you're feeling..."
          error={errors.notes?.message}
        />

        {/* Submit Button */}
        <Button
          type="submit"
          variant="primary"
          size="medium"
          fullWidth
          disabled={!hasSymptoms}
        >
          {hasSymptoms ? 'Submit Check-In' : 'Add at least one symptom'}
        </Button>
      </form>
    </div>
  );
}

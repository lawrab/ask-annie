import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Input } from './ui/Input';
import { TextArea } from './ui/TextArea';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import { SymptomValue } from '../services/api';

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

  const handleFormSubmit = (data: ManualCheckInFormData) => {
    // Convert form data to structured format
    const structuredData: StructuredCheckInData = {
      symptoms: symptoms.reduce(
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
            <Input
              type="text"
              placeholder="Symptom name (e.g., headache)"
              value={symptomName}
              onChange={(e) => setSymptomName(e.target.value)}
              className="flex-1"
            />
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
            <Button type="button" onClick={addSymptom} variant="primary" size="small">
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
        <Button type="submit" variant="primary" size="medium" fullWidth>
          Submit Check-In
        </Button>
      </form>
    </div>
  );
}

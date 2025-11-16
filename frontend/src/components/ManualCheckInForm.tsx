import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const manualCheckInSchema = z.object({
  activities: z.string(),
  triggers: z.string(),
  notes: z.string().optional(),
});

type ManualCheckInFormData = z.infer<typeof manualCheckInSchema>;

interface StructuredCheckInData {
  symptoms: { [key: string]: number };
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
          acc[s.name] = s.severity;
          return acc;
        },
        {} as { [key: string]: number }
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
            <input
              type="text"
              placeholder="Symptom name (e.g., headache)"
              value={symptomName}
              onChange={(e) => setSymptomName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <button
              type="button"
              onClick={addSymptom}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>

          {/* Symptoms List */}
          {symptoms.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {symptoms.map((symptom, index) => (
                <div
                  key={index}
                  className="flex items-center space-x-2 px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full"
                >
                  <span className="text-sm">
                    {symptom.name}: {symptom.severity}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeSymptom(index)}
                    className="text-indigo-600 hover:text-indigo-800"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activities */}
        <div>
          <label
            htmlFor="activities"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Activities
          </label>
          <input
            {...register('activities')}
            id="activities"
            type="text"
            placeholder="e.g., working, exercising, reading (comma-separated)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.activities && (
            <p className="mt-1 text-sm text-red-600">
              {errors.activities.message}
            </p>
          )}
        </div>

        {/* Triggers */}
        <div>
          <label
            htmlFor="triggers"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Triggers
          </label>
          <input
            {...register('triggers')}
            id="triggers"
            type="text"
            placeholder="e.g., stress, lack of sleep, weather (comma-separated)"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.triggers && (
            <p className="mt-1 text-sm text-red-600">{errors.triggers.message}</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Additional Notes
          </label>
          <textarea
            {...register('notes')}
            id="notes"
            rows={4}
            placeholder="Any additional details about how you're feeling..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          {errors.notes && (
            <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>
          )}
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md font-medium transition-colors"
        >
          Submit Check-In
        </button>
      </form>
    </div>
  );
}

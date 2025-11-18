/**
 * Design System Visual Reference
 *
 * This page demonstrates all design tokens from the Ask Annie design system.
 * Use this as a visual reference and testing page for the design system.
 *
 * Note: This page is for development/documentation purposes only.
 */

import { useState } from 'react';
import {
  Button,
  Input,
  TextArea,
  Checkbox,
  Radio,
  RadioGroup,
  Card,
  Badge,
  Alert,
  Divider,
} from '../components/ui';

export default function DesignSystemPage() {
  const [inputValue, setInputValue] = useState('');
  const [textAreaValue, setTextAreaValue] = useState('');
  const [checkboxValue, setCheckboxValue] = useState(false);
  const [radioValue, setRadioValue] = useState('');
  const [showAlert, setShowAlert] = useState(true);
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold text-gray-900">
            Ask Annie Design System
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Visual reference for all design tokens and components
          </p>
        </div>

        {/* Color System */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Colors</h2>

          {/* Primary Colors */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Primary (Indigo)
            </h3>
            <div className="grid grid-cols-11 gap-2">
              <div className="text-center">
                <div className="h-20 bg-primary-50 rounded border border-gray-200"></div>
                <span className="text-xs text-gray-600">50</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-primary-100 rounded border border-gray-200"></div>
                <span className="text-xs text-gray-600">100</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-primary-200 rounded"></div>
                <span className="text-xs text-gray-600">200</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-primary-300 rounded"></div>
                <span className="text-xs text-gray-600">300</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-primary-400 rounded"></div>
                <span className="text-xs text-gray-600">400</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-primary-500 rounded"></div>
                <span className="text-xs text-gray-600">500</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-primary-600 rounded border-4 border-gray-900"></div>
                <span className="text-xs font-bold text-gray-900">600 ⭐</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-primary-700 rounded"></div>
                <span className="text-xs text-gray-600">700</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-primary-800 rounded"></div>
                <span className="text-xs text-gray-600">800</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-primary-900 rounded"></div>
                <span className="text-xs text-gray-600">900</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-primary-950 rounded"></div>
                <span className="text-xs text-gray-600">950</span>
              </div>
            </div>
          </div>

          {/* Secondary Colors */}
          <div className="mb-8">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Secondary (Teal)
            </h3>
            <div className="grid grid-cols-11 gap-2">
              <div className="text-center">
                <div className="h-20 bg-secondary-50 rounded border border-gray-200"></div>
                <span className="text-xs text-gray-600">50</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-secondary-100 rounded border border-gray-200"></div>
                <span className="text-xs text-gray-600">100</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-secondary-200 rounded"></div>
                <span className="text-xs text-gray-600">200</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-secondary-300 rounded"></div>
                <span className="text-xs text-gray-600">300</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-secondary-400 rounded"></div>
                <span className="text-xs text-gray-600">400</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-secondary-500 rounded"></div>
                <span className="text-xs text-gray-600">500</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-secondary-600 rounded border-4 border-gray-900"></div>
                <span className="text-xs font-bold text-gray-900">600 ⭐</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-secondary-700 rounded"></div>
                <span className="text-xs text-gray-600">700</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-secondary-800 rounded"></div>
                <span className="text-xs text-gray-600">800</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-secondary-900 rounded"></div>
                <span className="text-xs text-gray-600">900</span>
              </div>
              <div className="text-center">
                <div className="h-20 bg-secondary-950 rounded"></div>
                <span className="text-xs text-gray-600">950</span>
              </div>
            </div>
          </div>

          {/* Semantic Colors */}
          <div>
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              Semantic Colors
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-green-50 border border-green-400 rounded p-4">
                <div className="font-semibold text-green-700">Success</div>
                <div className="text-sm text-green-600">green-600</div>
                <div className="mt-2 text-xs text-green-700">
                  WCAG AA: 4.8:1 ✓
                </div>
              </div>
              <div className="bg-red-50 border border-red-400 rounded p-4">
                <div className="font-semibold text-red-700">Error/Danger</div>
                <div className="text-sm text-red-600">red-600</div>
                <div className="mt-2 text-xs text-red-700">
                  WCAG AA: 5.9:1 ✓
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-400 rounded p-4">
                <div className="font-semibold text-amber-700">Warning</div>
                <div className="text-sm text-amber-600">amber-600</div>
                <div className="mt-2 text-xs text-amber-700">
                  WCAG AA: 5.0:1 ✓
                </div>
              </div>
              <div className="bg-blue-50 border border-blue-400 rounded p-4">
                <div className="font-semibold text-blue-700">Info</div>
                <div className="text-sm text-blue-600">blue-600</div>
                <div className="mt-2 text-xs text-blue-700">
                  WCAG AAA: 8.6:1 ✓
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Typography */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Typography</h2>

          <div className="space-y-4">
            <div>
              <span className="text-xs text-gray-500 font-mono">text-4xl font-extrabold</span>
              <div className="text-4xl font-extrabold text-gray-900">
                Page Hero Title (36px)
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-mono">text-3xl font-bold</span>
              <div className="text-3xl font-bold text-gray-900">
                Page Title (30px)
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-mono">text-2xl font-bold</span>
              <div className="text-2xl font-bold text-gray-900">
                Section Heading (24px)
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-mono">text-xl font-semibold</span>
              <div className="text-xl font-semibold text-gray-800">
                Subheading (20px)
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-mono">text-base</span>
              <div className="text-base text-gray-700">
                Body text - minimum 16px for accessibility (Lorem ipsum dolor sit amet, consectetur adipiscing elit.)
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-mono">text-sm</span>
              <div className="text-sm text-gray-600">
                Secondary text (14px) - used for labels, metadata
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-500 font-mono">text-xs</span>
              <div className="text-xs text-gray-500">
                Small caption text (12px) - use sparingly
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Font Weights</h3>
            <div className="space-y-2">
              <div className="font-normal">Normal (400) - Body text</div>
              <div className="font-medium">Medium (500) - Labels, emphasis</div>
              <div className="font-semibold">Semibold (600) - Subheadings</div>
              <div className="font-bold">Bold (700) - Headings</div>
              <div className="font-extrabold">Extrabold (800) - Hero text</div>
            </div>
          </div>
        </section>

        {/* Buttons */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Buttons</h2>

          <div className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <button className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                Primary Button
              </button>
              <button className="px-4 py-2 border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2">
                Secondary Button
              </button>
              <button className="px-4 py-2 bg-secondary-600 hover:bg-secondary-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-secondary-500 focus:ring-offset-2">
                Accent Button
              </button>
              <button className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2">
                Danger Button
              </button>
              <button disabled className="px-4 py-2 bg-gray-300 text-gray-500 font-medium rounded-md cursor-not-allowed opacity-50">
                Disabled
              </button>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <button className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-sm font-medium rounded-md transition-colors">
                Small Button
              </button>
              <button className="px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white text-lg font-medium rounded-md transition-colors">
                Large Button
              </button>
            </div>
          </div>
        </section>

        {/* Badges */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Badges & Pills</h2>

          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Semantic Badges</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full">
                  Success
                </span>
                <span className="px-3 py-1 bg-red-100 text-red-800 text-sm rounded-full">
                  Error
                </span>
                <span className="px-3 py-1 bg-amber-100 text-amber-800 text-sm rounded-full">
                  Warning
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                  Info
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Brand Badges</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full">
                  Primary
                </span>
                <span className="px-3 py-1 bg-secondary-100 text-secondary-800 text-sm rounded-full">
                  Secondary
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm rounded-full">
                  Neutral
                </span>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Symptom Severity</h3>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full">
                  headache: 7
                </span>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full">
                  fatigue: 8
                </span>
                <span className="px-3 py-1 bg-primary-100 text-primary-800 text-sm rounded-full">
                  nausea: 6
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Alerts */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Alerts</h2>

          <div className="space-y-4">
            <div className="bg-green-50 border border-green-400 text-green-700 px-4 py-3 rounded" role="alert">
              <span className="font-medium">Success!</span> Your check-in has been saved.
            </div>

            <div className="bg-red-50 border border-red-400 text-red-700 px-4 py-3 rounded" role="alert">
              <span className="font-medium">Error:</span> Failed to submit check-in. Please try again.
            </div>

            <div className="bg-amber-50 border border-amber-400 text-amber-700 px-4 py-3 rounded" role="alert">
              <span className="font-medium">Warning:</span> This check-in has been flagged for doctor review.
            </div>

            <div className="bg-blue-50 border border-blue-400 text-blue-700 px-4 py-3 rounded" role="alert">
              <span className="font-medium">Info:</span> Voice recordings are processed asynchronously.
            </div>
          </div>
        </section>

        {/* Cards */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Cards</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Default Card</h3>
              <p className="text-gray-600">Card with shadow-md elevation.</p>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Hover Card</h3>
              <p className="text-gray-600">Shadow lifts on hover (shadow-lg).</p>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Elevated Card</h3>
              <p className="text-gray-600">Higher elevation (shadow-lg).</p>
            </div>
          </div>
        </section>

        {/* Form Elements */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Form Elements</h2>

          <div className="max-w-md space-y-4">
            <div>
              <label htmlFor="input-text" className="block text-sm font-medium text-gray-700 mb-1">
                Text Input
              </label>
              <input
                id="input-text"
                type="text"
                placeholder="Enter text..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div>
              <label htmlFor="input-error" className="block text-sm font-medium text-gray-700 mb-1">
                Input with Error
              </label>
              <input
                id="input-error"
                type="text"
                aria-invalid="true"
                aria-describedby="error-message"
                className="w-full px-3 py-2 border border-red-400 rounded-md text-gray-900 focus:outline-none focus:ring-red-500 focus:border-red-500"
              />
              <p id="error-message" className="mt-1 text-sm text-red-600" role="alert">
                This field is required
              </p>
            </div>

            <div>
              <label htmlFor="textarea" className="block text-sm font-medium text-gray-700 mb-1">
                Textarea
              </label>
              <textarea
                id="textarea"
                rows={3}
                placeholder="Enter notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-primary-500 focus:border-primary-500"
              />
            </div>

            <div className="flex items-center">
              <input
                id="checkbox"
                type="checkbox"
                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
              />
              <label htmlFor="checkbox" className="ml-2 text-sm text-gray-700">
                Checkbox option
              </label>
            </div>
          </div>
        </section>

        {/* Spacing Examples */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Spacing</h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Vertical Rhythm (space-y-4)</h3>
              <div className="space-y-4">
                <div className="bg-primary-100 p-3 rounded">Item 1 (16px gap)</div>
                <div className="bg-primary-100 p-3 rounded">Item 2</div>
                <div className="bg-primary-100 p-3 rounded">Item 3</div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-2">Grid Gap (gap-4)</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-secondary-100 p-3 rounded text-center">1</div>
                <div className="bg-secondary-100 p-3 rounded text-center">2</div>
                <div className="bg-secondary-100 p-3 rounded text-center">3</div>
              </div>
            </div>
          </div>
        </section>

        {/* Border Radius */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Border Radius</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="h-20 bg-primary-200 rounded-sm mb-2"></div>
              <p className="text-xs text-center text-gray-600">rounded-sm (2px)</p>
            </div>
            <div>
              <div className="h-20 bg-primary-200 rounded-md mb-2"></div>
              <p className="text-xs text-center text-gray-600">rounded-md (6px) ⭐</p>
            </div>
            <div>
              <div className="h-20 bg-primary-200 rounded-lg mb-2"></div>
              <p className="text-xs text-center text-gray-600">rounded-lg (8px)</p>
            </div>
            <div>
              <div className="h-20 bg-primary-200 rounded-full mb-2"></div>
              <p className="text-xs text-center text-gray-600">rounded-full</p>
            </div>
          </div>
        </section>

        {/* Shadows */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Shadows (Elevation)</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white shadow-sm rounded-lg p-6">
              <p className="text-sm font-medium text-gray-700">shadow-sm</p>
              <p className="text-xs text-gray-500">Subtle elevation</p>
            </div>
            <div className="bg-white shadow-md rounded-lg p-6">
              <p className="text-sm font-medium text-gray-700">shadow-md ⭐</p>
              <p className="text-xs text-gray-500">Default cards</p>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6">
              <p className="text-sm font-medium text-gray-700">shadow-lg</p>
              <p className="text-xs text-gray-500">Elevated cards</p>
            </div>
          </div>
        </section>

        {/* Component Library */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Component Library</h2>
          <p className="text-sm text-gray-600 mb-6">
            Reusable, accessible components following the design system
          </p>

          <div className="space-y-8">
            {/* Buttons */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Button Component</h3>
              <div className="flex flex-wrap gap-3">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="tertiary">Tertiary</Button>
                <Button variant="danger">Danger</Button>
                <Button variant="link">Link</Button>
                <Button disabled>Disabled</Button>
                <Button loading>Loading...</Button>
                <Button size="small">Small</Button>
                <Button size="large">Large</Button>
              </div>
            </div>

            {/* Input */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Input Component</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                <Input
                  label="Email address"
                  type="email"
                  placeholder="you@example.com"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  helperText="We'll never share your email"
                />
                <Input
                  label="Password"
                  type="password"
                  placeholder="••••••••"
                  required
                />
                <Input
                  label="With error"
                  value="invalid@"
                  error="Please enter a valid email"
                />
                <Input
                  label="Disabled"
                  disabled
                  value="Cannot edit"
                />
              </div>
            </div>

            {/* TextArea */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">TextArea Component</h3>
              <div className="max-w-2xl">
                <TextArea
                  label="Additional notes"
                  placeholder="Enter any additional notes..."
                  value={textAreaValue}
                  onChange={(e) => setTextAreaValue(e.target.value)}
                  maxLength={500}
                  showCount
                  helperText="Describe any symptoms, triggers, or activities"
                />
              </div>
            </div>

            {/* Checkbox */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Checkbox Component</h3>
              <div className="space-y-3 max-w-md">
                <Checkbox
                  label="I agree to the terms and conditions"
                  checked={checkboxValue}
                  onChange={(e) => setCheckboxValue(e.target.checked)}
                />
                <Checkbox
                  label="Send me email notifications"
                  helperText="You can change this later in settings"
                />
                <Checkbox
                  label="Disabled checkbox"
                  disabled
                />
              </div>
            </div>

            {/* Radio */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Radio Component</h3>
              <div className="max-w-md">
                <RadioGroup
                  label="Severity level"
                  helperText="Select the severity of your symptoms"
                  required
                >
                  <Radio
                    name="severity"
                    value="mild"
                    label="Mild (1-3)"
                    checked={radioValue === 'mild'}
                    onChange={(e) => setRadioValue(e.target.value)}
                  />
                  <Radio
                    name="severity"
                    value="moderate"
                    label="Moderate (4-6)"
                    checked={radioValue === 'moderate'}
                    onChange={(e) => setRadioValue(e.target.value)}
                  />
                  <Radio
                    name="severity"
                    value="severe"
                    label="Severe (7-10)"
                    checked={radioValue === 'severe'}
                    onChange={(e) => setRadioValue(e.target.value)}
                  />
                </RadioGroup>
              </div>
            </div>

            {/* Card */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Card Component</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl">
                <Card variant="elevated">
                  <Card.Header>
                    <h4 className="font-semibold text-gray-900">Elevated Card</h4>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-sm text-gray-600">
                      This card has a shadow for elevation. Use for primary content.
                    </p>
                  </Card.Body>
                </Card>

                <Card variant="outlined">
                  <Card.Header>
                    <h4 className="font-semibold text-gray-900">Outlined Card</h4>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-sm text-gray-600">
                      This card has a border. Use for secondary content.
                    </p>
                  </Card.Body>
                </Card>

                <Card variant="interactive" onClick={() => alert('Card clicked!')}>
                  <Card.Header>
                    <h4 className="font-semibold text-gray-900">Interactive Card</h4>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-sm text-gray-600">
                      Click me! Hoverable and clickable with keyboard support.
                    </p>
                  </Card.Body>
                </Card>

                <Card variant="elevated">
                  <Card.Header>
                    <h4 className="font-semibold text-gray-900">With Footer</h4>
                  </Card.Header>
                  <Card.Body>
                    <p className="text-sm text-gray-600">
                      Cards can have headers, body, and footers.
                    </p>
                  </Card.Body>
                  <Card.Footer>
                    <Button size="small" variant="tertiary">Edit</Button>
                    <Button size="small" variant="danger">Delete</Button>
                  </Card.Footer>
                </Card>
              </div>
            </div>

            {/* Badge */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Badge Component</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Semantic variants:</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="default">Default</Badge>
                    <Badge variant="primary">Primary</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="success">Success</Badge>
                    <Badge variant="warning">Warning</Badge>
                    <Badge variant="error">Error</Badge>
                    <Badge variant="info">Info</Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Sizes:</p>
                  <div className="flex flex-wrap gap-2 items-center">
                    <Badge size="small" variant="primary">Small</Badge>
                    <Badge size="medium" variant="primary">Medium</Badge>
                    <Badge size="large" variant="primary">Large</Badge>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Removable badges (click × to remove):</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="primary" removable onRemove={() => alert('Removed!')}>
                      headache: 7
                    </Badge>
                    <Badge variant="success" removable onRemove={() => alert('Removed!')}>
                      exercise
                    </Badge>
                    <Badge variant="error" removable onRemove={() => alert('Removed!')}>
                      stress
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Alert */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Alert Component</h3>
              <div className="space-y-3 max-w-2xl">
                <Alert type="success">
                  Check-in saved successfully!
                </Alert>

                <Alert type="error" title="Error">
                  Failed to save check-in. Please try again.
                </Alert>

                <Alert type="warning" title="Warning">
                  This symptom has been flagged for doctor review.
                </Alert>

                <Alert type="info" title="Info" dismissible onDismiss={() => setShowAlert(false)}>
                  Voice recordings are processed asynchronously. Click × to dismiss.
                </Alert>

                {!showAlert && (
                  <Button size="small" onClick={() => setShowAlert(true)}>
                    Show dismissible alert again
                  </Button>
                )}
              </div>
            </div>

            {/* Divider */}
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Divider Component</h3>
              <div className="space-y-6 max-w-2xl">
                <div>
                  <p className="text-sm text-gray-600 mb-2">Plain divider:</p>
                  <Divider />
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Divider with label:</p>
                  <Divider label="or" />
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-2">Divider with custom label:</p>
                  <Divider label="Continue with" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <div className="text-center pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Ask Annie Design System v1.1.0 • Component Library v1.1.0<br />
            See{' '}
            <a href="/docs/DESIGN_SYSTEM.md" className="text-primary-600 hover:text-primary-700 underline">
              full documentation
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import { useEffect, useState } from 'react';
import { 
  validatePassword, 
  getStrengthColor, 
  getStrengthBgColor,
  getPasswordRequirements,
  type PasswordStrength 
} from '@/lib/password-validator';
import { Check, X, AlertCircle, Eye, EyeOff, RefreshCw } from 'lucide-react';

interface PasswordStrengthIndicatorProps {
  password: string;
  showRequirements?: boolean;
  onValidationChange?: (isValid: boolean) => void;
}

export function PasswordStrengthIndicator({ 
  password, 
  showRequirements = true,
  onValidationChange 
}: PasswordStrengthIndicatorProps) {
  const [validation, setValidation] = useState(validatePassword(''));

  useEffect(() => {
    const result = validatePassword(password);
    setValidation(result);
    if (onValidationChange) {
      onValidationChange(result.strength.isValid);
    }
  }, [password, onValidationChange]);

  const { strength } = validation;

  if (!password) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Strength Bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Password Strength:
          </span>
          <span className={`font-bold ${getStrengthColor(strength.level)}`}>
            {strength.level.replace('-', ' ').toUpperCase()}
          </span>
        </div>
        
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${getStrengthBgColor(strength.level)}`}
            style={{ width: `${strength.score}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>Weak</span>
          <span>Strong</span>
        </div>
      </div>

      {/* Validation Errors */}
      {validation.errors.length > 0 && (
        <div className="space-y-1">
          {validation.errors.map((error, index) => (
            <div key={index} className="flex items-start space-x-2 text-sm text-red-600 dark:text-red-400">
              <X className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          ))}
        </div>
      )}

      {/* Positive Feedback */}
      {strength.feedback.length > 0 && validation.errors.length === 0 && (
        <div className="space-y-1">
          {strength.feedback.map((feedback, index) => (
            <div key={index} className="flex items-start space-x-2 text-sm text-green-600 dark:text-green-400">
              <Check className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{feedback}</span>
            </div>
          ))}
        </div>
      )}

      {/* Requirements Checklist */}
      {showRequirements && (
        <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            Password Requirements
          </h4>
          <div className="space-y-2">
            <RequirementItem 
              met={password.length >= 12}
              text="At least 12 characters"
            />
            <RequirementItem 
              met={/[A-Z]/.test(password)}
              text="One uppercase letter (A-Z)"
            />
            <RequirementItem 
              met={/[a-z]/.test(password)}
              text="One lowercase letter (a-z)"
            />
            <RequirementItem 
              met={/\d/.test(password)}
              text="One number (0-9)"
            />
            <RequirementItem 
              met={/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)}
              text="One special character (!@#$%...)"
            />
            <RequirementItem 
              met={validation.errors.length === 0 && strength.score >= 50}
              text="Strong and secure"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function RequirementItem({ met, text }: { met: boolean; text: string }) {
  return (
    <div className={`flex items-center space-x-2 text-sm transition-colors ${
      met ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
    }`}>
      {met ? (
        <Check className="w-4 h-4 flex-shrink-0" />
      ) : (
        <div className="w-4 h-4 rounded-full border-2 border-current flex-shrink-0" />
      )}
      <span className={met ? 'font-medium' : ''}>{text}</span>
    </div>
  );
}

interface PasswordInputWithStrengthProps {
  value: string;
  onChange: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
  placeholder?: string;
  id?: string;
  name?: string;
  autoComplete?: string;
  required?: boolean;
  className?: string;
  showRequirements?: boolean;
}

export function PasswordInputWithStrength({
  value,
  onChange,
  onValidationChange,
  placeholder = 'Enter password',
  id = 'password',
  name = 'password',
  autoComplete = 'new-password',
  required = true,
  className = '',
  showRequirements = true
}: PasswordInputWithStrengthProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="space-y-3">
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          id={id}
          name={name}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={`w-full px-4 py-3 pr-12 bg-gray-50 dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-colors ${className}`}
        />
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" />
          ) : (
            <Eye className="w-5 h-5" />
          )}
        </button>
      </div>
      
      {value && (
        <PasswordStrengthIndicator
          password={value}
          showRequirements={showRequirements}
          onValidationChange={onValidationChange}
        />
      )}
    </div>
  );
}


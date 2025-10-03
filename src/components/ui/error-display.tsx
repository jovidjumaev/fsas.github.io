'use client';

import { AlertCircle, XCircle, Info, RefreshCw, Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ErrorDisplayProps {
  error: string;
  title?: string;
  onRetry?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function ErrorDisplay({ 
  error, 
  title = 'Error',
  onRetry,
  showDetails = false,
  className = ''
}: ErrorDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  if (!error) return null;

  // Parse error message for sections
  const sections = error.split('\n\n');
  const mainMessage = sections[0];
  const additionalInfo = sections.slice(1);

  const handleCopy = () => {
    navigator.clipboard.writeText(error);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start space-x-3">
        <XCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-red-800 dark:text-red-300 mb-2">
            {title}
          </h3>
          <p className="text-sm text-red-700 dark:text-red-300 whitespace-pre-wrap">
            {mainMessage}
          </p>

          {/* Additional Info */}
          {additionalInfo.length > 0 && (
            <div className="mt-3 space-y-2">
              {additionalInfo.map((info, index) => (
                <div 
                  key={index}
                  className="text-sm text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 rounded-lg p-3"
                >
                  {info.startsWith('💡') ? (
                    <div className="flex items-start space-x-2">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="whitespace-pre-wrap">{info.replace('💡 ', '')}</span>
                    </div>
                  ) : info.startsWith('🆘') ? (
                    <div className="flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span className="whitespace-pre-wrap">{info.replace('🆘 ', '')}</span>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{info}</p>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Actions */}
          <div className="mt-4 flex flex-wrap gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Again</span>
              </button>
            )}
            
            {showDetails && (
              <button
                onClick={handleCopy}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-red-100 dark:bg-red-900/30 hover:bg-red-200 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-sm font-medium rounded-lg transition-colors"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copy Error</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SuccessDisplayProps {
  message: string;
  title?: string;
  className?: string;
}

export function SuccessDisplay({ 
  message, 
  title = 'Success',
  className = ''
}: SuccessDisplayProps) {
  if (!message) return null;

  return (
    <div className={`bg-green-50 dark:bg-green-900/20 border-2 border-green-200 dark:border-green-800 rounded-xl p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <Check className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-green-800 dark:text-green-300 mb-1">
            {title}
          </h3>
          <p className="text-sm text-green-700 dark:text-green-300 whitespace-pre-wrap">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}

interface InfoDisplayProps {
  message: string;
  title?: string;
  className?: string;
}

export function InfoDisplay({ 
  message, 
  title = 'Information',
  className = ''
}: InfoDisplayProps) {
  if (!message) return null;

  return (
    <div className={`bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-xl p-4 ${className}`}>
      <div className="flex items-start space-x-3">
        <Info className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-bold text-blue-800 dark:text-blue-300 mb-1">
            {title}
          </h3>
          <p className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Card } from '@/components/ui/card';

interface QRCodeScannerProps {
  onScan: (qrData: string) => void;
  isScanning: boolean;
  disabled?: boolean;
}

export function QRCodeScanner({ onScan, isScanning, disabled = false }: QRCodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);
  const [internalScanning, setInternalScanning] = useState(false);

  useEffect(() => {
    if (!disabled && hasPermission === null) {
      initializeCamera();
    }
  }, [disabled, hasPermission]);

  const initializeCamera = async () => {
    try {
      setIsInitializing(true);
      setError(null);

      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access is not supported on this device');
      }

      // Request camera permission
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Use back camera on mobile
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setHasPermission(true);
      }
    } catch (err: any) {
      console.error('Camera error:', err);
      setError(err.message);
      setHasPermission(false);
    } finally {
      setIsInitializing(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Draw current video frame to canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Get image data for QR code detection
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    
    // In a real implementation, you would use a QR code detection library here
    // For now, we'll simulate detection
    simulateQRDetection();
  };

  const simulateQRDetection = () => {
    // This is a placeholder - in a real implementation, you would use a library like @zxing/library
    // to detect QR codes in the captured frame
    
    // Simulate QR code detection with a timeout
    setTimeout(() => {
      // Mock QR code data - in real implementation, this would come from actual detection
      const mockQRData = JSON.stringify({
        sessionId: 'mock-session-id',
        timestamp: Date.now(),
        nonce: 'mock-nonce',
        signature: 'mock-signature'
      });
      
      onScan(mockQRData);
    }, 1000);
  };

  const startScanning = () => {
    if (hasPermission && !isScanning) {
      // Start continuous scanning
      const interval = setInterval(() => {
        if (!isScanning) {
          captureFrame();
        }
      }, 1000);

      // Clean up interval after 30 seconds
      setTimeout(() => {
        clearInterval(interval);
      }, 30000);
    }
  };

  useEffect(() => {
    if (isScanning && hasPermission) {
      startScanning();
    }
  }, [isScanning, hasPermission]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (isInitializing) {
    return (
      <div className="flex flex-col items-center justify-center p-8">
        <LoadingSpinner size="lg" text="Initializing camera..." />
      </div>
    );
  }

  if (hasPermission === false) {
    return (
      <Card className="p-8 text-center">
        <div className="text-red-600 mb-4">
          <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Camera Access Required
        </h3>
        <p className="text-gray-600 mb-4">
          {error || 'Please allow camera access to scan QR codes.'}
        </p>
        <Button onClick={initializeCamera} variant="primary">
          Try Again
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Camera Preview */}
      <div className="relative">
        <div className="qr-scanner-container">
          <video
            ref={videoRef}
            className="w-full h-auto rounded-lg"
            playsInline
            muted
          />
          
          {/* Scanning Overlay */}
          {isScanning && (
            <div className="qr-scanner-overlay">
              <div className="qr-scanner-frame" />
            </div>
          )}
        </div>
        
        {/* Hidden canvas for frame capture */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />
      </div>

      {/* Controls */}
      <div className="flex justify-center space-x-4">
        {!isScanning ? (
          <Button
            onClick={() => {
              setInternalScanning(true);
              startScanning();
            }}
            disabled={disabled || hasPermission !== true}
            variant="primary"
            size="lg"
          >
            Start Scanning
          </Button>
        ) : (
          <Button
            onClick={() => setInternalScanning(false)}
            variant="secondary"
            size="lg"
          >
            Stop Scanning
          </Button>
        )}
      </div>

      {/* Instructions */}
      <div className="text-center text-sm text-gray-600">
        {isScanning ? (
          <p className="animate-pulse-slow">
            Point your camera at the QR code...
          </p>
        ) : (
          <p>
            Click "Start Scanning" to begin QR code detection
          </p>
        )}
      </div>

      {/* Browser Support Check */}
      <div className="text-xs text-gray-500 text-center">
        <p>
          Make sure you're using a modern browser with camera support.
          <br />
          For best results, use Chrome, Firefox, or Safari on a mobile device.
        </p>
      </div>
    </div>
  );
}

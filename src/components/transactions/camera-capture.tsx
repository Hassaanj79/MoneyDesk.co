
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertTitle, AlertDescription } from "../ui/alert";
import { RotateCcw, Camera, CameraOff } from "lucide-react";

type CameraCaptureProps = {
  onPhotoTaken: (dataUrl: string) => void;
};

export function CameraCapture({ onPhotoTaken }: CameraCaptureProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState<number>(0);
  const [isSwitchingCamera, setIsSwitchingCamera] = useState(false);
  const { toast } = useToast();

  // Function to get available cameras
  const getAvailableCameras = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(videoDevices);
      return videoDevices;
    } catch (error) {
      console.error('Error enumerating cameras:', error);
      return [];
    }
  };

  // Function to start camera with specific device
  const startCamera = async (deviceId?: string) => {
    try {
      setIsSwitchingCamera(true);
      
      // Stop current stream
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: deviceId ? { deviceId: { exact: deviceId } } : true
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setHasCameraPermission(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      setHasCameraPermission(false);
      toast({
        variant: 'destructive',
        title: 'Camera Access Denied',
        description: 'Please enable camera permissions in your browser settings to use this app.',
      });
    } finally {
      setIsSwitchingCamera(false);
    }
  };

  // Function to switch to next camera
  const switchCamera = async () => {
    if (availableCameras.length <= 1) return;
    
    const nextIndex = (currentCameraIndex + 1) % availableCameras.length;
    const nextCamera = availableCameras[nextIndex];
    
    setCurrentCameraIndex(nextIndex);
    await startCamera(nextCamera.deviceId);
  };

  useEffect(() => {
    const initializeCamera = async () => {
      // First get permission and available cameras
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setHasCameraPermission(true);
        
        // Get available cameras
        const cameras = await getAvailableCameras();
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions in your browser settings to use this app.',
        });
      }
    };

    initializeCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const stream = videoRef.current.srcObject as MediaStream;
        stream.getTracks().forEach(track => track.stop());
      }
    }
  }, [toast]);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
        const dataUrl = canvas.toDataURL("image/jpeg");
        onPhotoTaken(dataUrl);

        // Stop the camera stream
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
        {hasCameraPermission === false && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
            <p className="text-white">Camera not available</p>
          </div>
        )}
        {isSwitchingCamera && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-md">
            <div className="flex items-center gap-2 text-white">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Switching camera...</span>
            </div>
          </div>
        )}
      </div>

      {hasCameraPermission === false && (
          <Alert variant="destructive">
            <AlertTitle>Camera Access Required</AlertTitle>
            <AlertDescription>
                Please allow camera permissions in your browser settings to use this feature.
            </AlertDescription>
          </Alert>
      )}

      <div className="flex gap-2">
        <Button 
          onClick={switchCamera} 
          disabled={!hasCameraPermission || availableCameras.length <= 1 || isSwitchingCamera}
          variant="outline"
          className="flex-1"
        >
          <RotateCcw className="mr-2 h-4 w-4" />
          Switch Camera
        </Button>
        <Button 
          onClick={handleCapture} 
          disabled={!hasCameraPermission || isSwitchingCamera} 
          className="flex-1"
        >
          <Camera className="mr-2 h-4 w-4" />
          Capture Photo
        </Button>
      </div>

      {availableCameras.length > 1 && (
        <div className="text-xs text-muted-foreground text-center">
          {availableCameras.length} camera{availableCameras.length > 1 ? 's' : ''} available
        </div>
      )}

      <canvas ref={canvasRef} className="hidden"></canvas>
    </div>
  );
}

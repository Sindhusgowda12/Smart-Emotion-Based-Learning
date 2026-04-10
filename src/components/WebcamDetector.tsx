import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Camera, CameraOff, Brain, Sparkles, Loader2 } from 'lucide-react';
import { detectEmotionFromImage } from '../services/geminiService';
import { Emotion } from '../types';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface WebcamDetectorProps {
  onEmotionDetected: (emotion: Emotion) => void;
  isAnalyzing: boolean;
}

export const WebcamDetector: React.FC<WebcamDetectorProps> = ({ onEmotionDetected, isAnalyzing }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isActive, setIsActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const [stream, setStream] = useState<MediaStream | null>(null);

  const startVideo = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480, facingMode: 'user' } 
      });
      setStream(mediaStream);
      setIsActive(true);
      setError(null);
    } catch (err) {
      console.error("Error accessing webcam:", err);
      setError("Could not access webcam. Please check permissions.");
    }
  };

  useEffect(() => {
    if (isActive && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch(e => console.error("Error playing video:", e));
    }
  }, [isActive, stream]);

  const stopVideo = () => {
    stream?.getTracks().forEach(track => track.stop());
    setStream(null);
    setIsActive(false);
  };

  const captureAndAnalyze = useCallback(async () => {
    if (!isActive || !videoRef.current || !canvasRef.current || isProcessing || !isAnalyzing) return;

    setIsProcessing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      const base64Image = canvas.toDataURL('image/jpeg', 0.8);
      
      const emotion = await detectEmotionFromImage(base64Image);
      setCurrentEmotion(emotion);
      onEmotionDetected(emotion);
    }
    setIsProcessing(false);
  }, [isActive, isProcessing, isAnalyzing, onEmotionDetected]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isActive && isAnalyzing) {
      interval = setInterval(captureAndAnalyze, 5000); // Analyze every 5 seconds
    }
    return () => clearInterval(interval);
  }, [isActive, isAnalyzing, captureAndAnalyze]);

  const emotionColors: Record<Emotion, string> = {
    happy: 'text-green-500 bg-green-50 border-green-100',
    sad: 'text-blue-500 bg-blue-50 border-blue-100',
    angry: 'text-red-500 bg-red-50 border-red-100',
    surprised: 'text-yellow-500 bg-yellow-50 border-yellow-100',
    neutral: 'text-gray-500 bg-gray-50 border-gray-100',
    confused: 'text-purple-500 bg-purple-50 border-purple-100',
    bored: 'text-orange-500 bg-orange-50 border-orange-100',
    focused: 'text-indigo-500 bg-indigo-50 border-indigo-100',
  };

  return (
    <div className="relative group">
      <div className={cn(
        "relative rounded-3xl overflow-hidden bg-slate-900 aspect-video shadow-2xl transition-all duration-500",
        isActive ? "ring-4 ring-indigo-500/20" : "ring-0"
      )}>
        {!isActive ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-4">
            <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center mb-2">
              <CameraOff size={32} />
            </div>
            <p className="text-sm font-medium">Webcam is inactive</p>
            <button
              onClick={startVideo}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-semibold transition-all shadow-lg shadow-indigo-900/20"
            >
              Start Camera
            </button>
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{ transform: 'scaleX(-1)' }}
              className="w-full h-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
            
            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={stopVideo}
                className="p-2 bg-black/40 hover:bg-black/60 text-white rounded-full backdrop-blur-md transition-all"
              >
                <CameraOff size={18} />
              </button>
            </div>

            <AnimatePresence>
              {currentEmotion && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, y: 10 }}
                  className={cn(
                    "absolute bottom-4 left-4 right-4 p-4 rounded-2xl backdrop-blur-xl border flex items-center justify-between shadow-xl",
                    emotionColors[currentEmotion] || 'bg-white/80 border-white/20'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/50">
                      <Brain size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-wider opacity-60">Current State</p>
                      <p className="text-lg font-bold capitalize">{currentEmotion}</p>
                    </div>
                  </div>
                  {isProcessing && (
                    <Loader2 className="animate-spin opacity-50" size={20} />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </>
        )}
      </div>

      {error && (
        <p className="mt-2 text-sm text-red-500 font-medium text-center">{error}</p>
      )}

      <div className="mt-4 flex flex-col items-center gap-4">
        {isActive && (
          <button
            onClick={stopVideo}
            className="flex items-center gap-2 px-6 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-xl font-semibold transition-all border border-red-100"
          >
            <CameraOff size={18} />
            Stop Camera
          </button>
        )}

        <div className="flex items-center justify-center gap-6 text-xs font-semibold text-gray-400 uppercase tracking-widest">
          <div className="flex items-center gap-2">
            <div className={cn("w-2 h-2 rounded-full", isActive ? "bg-green-500 animate-pulse" : "bg-gray-300")} />
            Live Detection
          </div>
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-indigo-400" />
            AI Analysis
          </div>
        </div>
      </div>
    </div>
  );
};

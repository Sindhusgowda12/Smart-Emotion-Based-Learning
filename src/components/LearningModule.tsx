import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { BookOpen, Sparkles, AlertCircle, CheckCircle2, ArrowRight, BrainCircuit, Volume2, VolumeX } from 'lucide-react';
import { generateLearningContent, getAdaptiveContentSuggestion, getAdaptiveLessonTweak } from '../services/geminiService';
import { Emotion } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { AITutor } from './AITutor';

interface LearningModuleProps {
  topic: string;
  currentEmotion: Emotion | null;
  onComplete?: () => void;
  onNext?: () => void;
}

export const LearningModule: React.FC<LearningModuleProps> = ({ topic, currentEmotion, onComplete, onNext }) => {
  const [content, setContent] = useState<{ title: string; body: string } | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [adaptiveTweak, setAdaptiveTweak] = useState<{ type: string; content: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdapting, setIsAdapting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const fetchInitialContent = async () => {
      setIsLoading(true);
      setIsCompleted(false);
      setAdaptiveTweak(null);
      const data = await generateLearningContent(topic);
      setContent(data);
      setIsLoading(false);
    };
    fetchInitialContent();
    
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [topic]);

  const handleComplete = () => {
    setIsCompleted(true);
    if (onComplete) onComplete();
  };

  const toggleSpeech = () => {
    if (!('speechSynthesis' in window) || !content) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const textToRead = `${content.title}. ${content.body.replace(/[#*`]/g, '')}`;
    const utterance = new SpeechSynthesisUtterance(textToRead);
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (currentEmotion && content) {
      const adaptContent = async () => {
        setIsAdapting(true);
        
        // Get the short suggestion
        const advice = await getAdaptiveContentSuggestion(currentEmotion, topic);
        setSuggestion(advice);

        // If emotion is significant, get a content tweak
        if (['confused', 'bored', 'focused'].includes(currentEmotion)) {
          const tweak = await getAdaptiveLessonTweak(currentEmotion, topic, content.body);
          setAdaptiveTweak(tweak);
        } else {
          setAdaptiveTweak(null);
        }

        setIsAdapting(false);
      };
      adaptContent();
    }
  }, [currentEmotion, content, topic]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="w-16 h-16 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse">Generating your learning module...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 relative">
      <AnimatePresence mode="wait">
        {suggestion && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-6 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-3xl text-white shadow-xl shadow-indigo-200 relative overflow-hidden group"
          >
            <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform">
              <BrainCircuit size={120} />
            </div>
            <div className="relative flex items-start gap-4">
              <div className="p-3 bg-white/20 rounded-2xl backdrop-blur-md">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="text-lg font-bold mb-1 flex items-center gap-2">
                  AI Adaptation
                  {isAdapting && <span className="w-2 h-2 bg-white rounded-full animate-ping" />}
                </h3>
                <p className="text-indigo-50 font-medium leading-relaxed">
                  {suggestion}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl shadow-sm border border-gray-100 p-8 md:p-12 relative"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <BookOpen size={20} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900">{content?.title}</h2>
          </div>
          <button
            onClick={toggleSpeech}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all",
              isSpeaking ? "bg-red-50 text-red-600" : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
            )}
          >
            {isSpeaking ? <VolumeX size={20} /> : <Volume2 size={20} />}
            {isSpeaking ? 'Stop Listening' : 'Listen to Lesson'}
          </button>
        </div>

        <div className="prose prose-indigo max-w-none prose-headings:font-bold prose-p:text-gray-600 prose-p:leading-relaxed prose-li:text-gray-600">
          <ReactMarkdown>{(content?.body || '').replace(/\\n/g, '\n').replace(/\n/g, '  \n')}</ReactMarkdown>
          
          <AnimatePresence>
            {adaptiveTweak && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className={cn(
                  "mt-8 p-6 rounded-2xl border-l-4 shadow-sm",
                  adaptiveTweak.type === 'explanation' ? "bg-purple-50 border-purple-500" :
                  adaptiveTweak.type === 'challenge' ? "bg-amber-50 border-amber-500" :
                  "bg-blue-50 border-blue-500"
                )}
              >
                <div className="flex items-center gap-2 mb-3">
                  {adaptiveTweak.type === 'explanation' ? <AlertCircle className="text-purple-600" size={20} /> :
                   adaptiveTweak.type === 'challenge' ? <Sparkles className="text-amber-600" size={20} /> :
                   <BrainCircuit className="text-blue-600" size={20} />}
                  <h4 className="font-bold text-gray-900 capitalize">
                    {adaptiveTweak.type === 'explanation' ? 'Simplified Breakdown' :
                     adaptiveTweak.type === 'challenge' ? 'Quick Challenge' :
                     'Pro Tip'}
                  </h4>
                </div>
                <div className="text-gray-700">
                  <ReactMarkdown>{adaptiveTweak.content}</ReactMarkdown>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {content?.title === "Error" && (
            <button 
              onClick={() => {
                setContent(null);
                setIsLoading(true);
                generateLearningContent(topic).then(data => {
                  setContent(data);
                  setIsLoading(false);
                });
              }}
              className="mt-6 px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-all"
            >
              Retry Generation
            </button>
          )}
        </div>

        <div className="mt-12 pt-8 border-t border-gray-50 flex flex-wrap gap-4">
          <button 
            onClick={handleComplete}
            disabled={isCompleted}
            className={cn(
              "flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-indigo-900/10",
              isCompleted ? "bg-green-500 text-white" : "bg-indigo-600 hover:bg-indigo-500 text-white"
            )}
          >
            {isCompleted ? 'Lesson Completed' : 'Complete Lesson'}
            <CheckCircle2 size={18} />
          </button>
          <button 
            onClick={onNext}
            className="flex items-center gap-2 px-6 py-3 bg-white border-2 border-gray-100 hover:border-indigo-100 hover:bg-indigo-50/30 text-gray-700 rounded-2xl font-bold transition-all"
          >
            Next Topic
            <ArrowRight size={18} />
          </button>
        </div>
      </motion.div>

      <AITutor topic={topic} context={content?.body} />
    </div>
  );
};

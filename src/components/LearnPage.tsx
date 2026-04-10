import React, { useState, useEffect } from 'react';
import { WebcamDetector } from './WebcamDetector';
import { LearningModule } from './LearningModule';
import { Emotion, EmotionLog } from '../types';
import { db, auth, collection, addDoc, Timestamp, handleFirestoreError, OperationType, query, where, limit, getDocs } from '../firebase';
import { Brain, Sparkles, BookOpen, ChevronRight, Search, LayoutGrid, GraduationCap, Lightbulb, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import { getTopicRecommendation } from '../services/geminiService';

export const LearnPage: React.FC = () => {
  const [currentEmotion, setCurrentEmotion] = useState<Emotion | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(true);
  const [recommendation, setRecommendation] = useState<string | null>(null);
  const [isRecommending, setIsRecommending] = useState(false);

  const topics = [
    { id: 'react', title: 'React Fundamentals', icon: Brain, color: 'bg-indigo-50 text-indigo-600' },
    { id: 'ai', title: 'Artificial Intelligence', icon: Sparkles, color: 'bg-violet-50 text-violet-600' },
    { id: 'web', title: 'Modern Web Design', icon: LayoutGrid, color: 'bg-emerald-50 text-emerald-600' },
    { id: 'edu', title: 'Adaptive Learning', icon: GraduationCap, color: 'bg-amber-50 text-amber-600' },
  ];

  useEffect(() => {
    const fetchRecommendation = async () => {
      if (!auth.currentUser) return;
      setIsRecommending(true);
      try {
        const logsQuery = query(
          collection(db, 'emotionLogs'),
          where('userId', '==', auth.currentUser.uid),
          limit(20)
        );
        const completionsQuery = query(
          collection(db, 'completions'),
          where('userId', '==', auth.currentUser.uid),
          limit(10)
        );

        const [logsSnap, completionsSnap] = await Promise.all([
          getDocs(logsQuery),
          getDocs(completionsQuery)
        ]);

        const emotions = logsSnap.docs.map(doc => (doc.data() as EmotionLog).emotion);
        const completedTopics = completionsSnap.docs.map(doc => doc.data().topicId);

        const rec = await getTopicRecommendation(emotions, completedTopics);
        setRecommendation(rec);
      } catch (error) {
        console.error("Error fetching recommendation data:", error);
        setRecommendation("Modern Web Design"); // Fallback
      } finally {
        setIsRecommending(false);
      }
    };

    if (!selectedTopic) fetchRecommendation();
  }, [selectedTopic]);

  const handleEmotionDetected = async (emotion: Emotion) => {
    setCurrentEmotion(emotion);
    
    if (auth.currentUser && selectedTopic) {
      try {
        await addDoc(collection(db, 'emotionLogs'), {
          userId: auth.currentUser.uid,
          emotion,
          timestamp: Timestamp.now(),
          topicId: selectedTopic,
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'emotionLogs');
      }
    }
  };

  const handleLessonComplete = async () => {
    if (auth.currentUser && selectedTopic) {
      try {
        await addDoc(collection(db, 'completions'), {
          userId: auth.currentUser.uid,
          topicId: selectedTopic,
          timestamp: Timestamp.now(),
        });
      } catch (error) {
        handleFirestoreError(error, OperationType.CREATE, 'completions');
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {!selectedTopic ? (
        <div className="space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">What would you like to learn today?</h1>
            <p className="text-lg text-gray-500">Select a topic to start your AI-powered adaptive learning session.</p>
          </div>

          <AnimatePresence>
            {recommendation && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 p-6 rounded-3xl flex items-center justify-between gap-6"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                    <Lightbulb size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-amber-900">Recommended for You</h3>
                    <p className="text-amber-700 text-sm">Based on your recent focus and progress, we suggest: <span className="font-bold underline cursor-pointer" onClick={() => setSelectedTopic(recommendation)}>{recommendation}</span></p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedTopic(recommendation)}
                  className="px-6 py-2 bg-amber-600 text-white rounded-xl font-bold hover:bg-amber-500 transition-colors shadow-lg shadow-amber-900/10"
                >
                  Start Now
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {topics.map((topic, i) => (
              <motion.button
                key={topic.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                onClick={() => setSelectedTopic(topic.title)}
                className="group relative bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all text-left overflow-hidden"
              >
                <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                  <topic.icon size={120} />
                </div>
                <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm", topic.color)}>
                  <topic.icon size={28} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{topic.title}</h3>
                <p className="text-sm text-gray-500 mb-6">Master the core concepts of {topic.title.toLowerCase()} with real-time feedback.</p>
                <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 group-hover:gap-3 transition-all">
                  Start Learning
                  <ChevronRight size={16} />
                </div>
              </motion.button>
            ))}
          </div>

          <div className="bg-indigo-50/50 rounded-3xl p-8 border border-indigo-100 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                <Search size={32} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Custom Topic</h3>
                <p className="text-gray-500">Want to learn something else? Enter any topic below.</p>
              </div>
            </div>
            <div className="flex-1 max-w-md w-full relative">
              <input 
                type="text" 
                placeholder="e.g. Quantum Physics, Cooking, Spanish..."
                className="w-full bg-white border-2 border-gray-100 rounded-2xl px-6 py-4 outline-none focus:border-indigo-500 transition-all font-medium"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setSelectedTopic((e.target as HTMLInputElement).value);
                }}
              />
              <button className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-500 transition-colors">
                Go
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8">
            <div className="flex items-center gap-4 mb-8">
              <button 
                onClick={() => setSelectedTopic(null)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-500"
              >
                <ChevronRight size={24} className="rotate-180" />
              </button>
              <h1 className="text-3xl font-bold text-gray-900">{selectedTopic}</h1>
            </div>
            <LearningModule 
              topic={selectedTopic} 
              currentEmotion={currentEmotion} 
              onNext={() => setSelectedTopic(null)}
              onComplete={handleLessonComplete}
            />
          </div>

          <div className="lg:col-span-4 sticky top-24 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                  <Brain size={20} className="text-indigo-600" />
                  Emotion AI
                </h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active</span>
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                </div>
              </div>
              <WebcamDetector onEmotionDetected={handleEmotionDetected} isAnalyzing={isAnalyzing} />
              
              <div className="mt-6 pt-6 border-t border-gray-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-gray-500">Auto-Analysis</span>
                  <button 
                    onClick={() => setIsAnalyzing(!isAnalyzing)}
                    className={cn(
                      "w-12 h-6 rounded-full transition-all relative",
                      isAnalyzing ? "bg-indigo-600" : "bg-gray-200"
                    )}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                      isAnalyzing ? "right-1" : "left-1"
                    )} />
                  </button>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Your webcam captures frames every 5 seconds to analyze engagement levels and adapt content.
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-indigo-600 to-violet-700 p-6 rounded-3xl text-white shadow-xl shadow-indigo-200">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles size={20} />
                <h3 className="font-bold">Pro Tip</h3>
              </div>
              <p className="text-sm text-indigo-50 leading-relaxed">
                Try to stay focused! EmoLearn detects when you're distracted and will suggest a break or a more engaging topic.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

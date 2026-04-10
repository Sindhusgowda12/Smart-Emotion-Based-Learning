import React, { useState, useEffect } from 'react';
import { db, auth, collection, query, where, orderBy, limit, onSnapshot } from '../firebase';
import { EmotionLog } from '../types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Brain, Clock, Target, TrendingUp, Activity, LayoutGrid, Calendar } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';

export const Dashboard: React.FC = () => {
  const [logs, setLogs] = useState<EmotionLog[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const logsQuery = query(
      collection(db, 'emotionLogs'),
      where('userId', '==', auth.currentUser.uid),
      limit(200)
    );

    const completionsQuery = query(
      collection(db, 'completions'),
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as EmotionLog));
      const sortedData = data.sort((a, b) => {
        const timeA = a.timestamp?.toMillis() || 0;
        const timeB = b.timestamp?.toMillis() || 0;
        return timeA - timeB;
      });
      setLogs(sortedData);
    });

    const unsubscribeCompletions = onSnapshot(completionsQuery, (snapshot) => {
      setCompletions(snapshot.docs.map(doc => doc.data()));
      setIsLoading(false);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeCompletions();
    };
  }, []);

  const emotionValues: Record<string, number> = {
    happy: 5,
    focused: 4,
    surprised: 3,
    neutral: 2,
    confused: 1,
    bored: 0,
    sad: -1,
    angry: -2,
  };

  const chartData = logs.map(log => ({
    time: new Date(log.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    value: emotionValues[log.emotion] || 0,
    emotion: log.emotion,
  }));

  // Calculate real stats
  // Neutral is considered a productive state in learning, so we include it in focus score calculation
  const focusLogs = logs.filter(l => l.emotion === 'focused' || l.emotion === 'happy' || l.emotion === 'neutral').length;
  const focusScore = logs.length > 0 ? Math.round((focusLogs / logs.length) * 100) : 0;
  
  // Estimate learning time: each log represents roughly 5 seconds of active learning
  const learningTimeMinutes = Math.round((logs.length * 5) / 60);
  const learningTimeDisplay = learningTimeMinutes < 60 
    ? `${learningTimeMinutes}m` 
    : `${(learningTimeMinutes / 60).toFixed(1)}h`;

  // Adjusted thresholds for engagement
  const engagement = focusScore > 80 ? 'High' : focusScore > 50 ? 'Moderate' : 'Low';

  const stats = [
    { label: 'Focus Score', value: `${focusScore}%`, icon: Target, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Learning Time', value: learningTimeDisplay, icon: Clock, color: 'text-violet-600 bg-violet-50' },
    { label: 'Engagement', value: engagement, icon: Activity, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Modules Done', value: completions.length.toString(), icon: LayoutGrid, color: 'text-amber-600 bg-amber-50' },
  ];

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 rounded-2xl shadow-xl border border-gray-100">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{payload[0].payload.time}</p>
          <p className="text-lg font-bold text-indigo-600 capitalize">{payload[0].payload.emotion}</p>
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome back, {auth.currentUser?.displayName?.split(' ')[0]}!</h1>
          <p className="text-gray-500 mt-1">Here's your learning performance overview.</p>
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-100 rounded-xl shadow-sm text-sm font-medium text-gray-600">
          <Calendar size={16} />
          {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", stat.color)}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                <TrendingUp size={20} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Emotion Trend</h2>
            </div>
            <select className="text-sm font-medium text-gray-500 bg-gray-50 border-none rounded-lg px-3 py-1 outline-none">
              <option>Last 24 Hours</option>
              <option>Last 7 Days</option>
            </select>
          </div>
          
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#cbd5e1' }}
                  domain={[-2, 5]}
                  ticks={[-2, -1, 0, 1, 2, 3, 4, 5]}
                  tickFormatter={(val) => {
                    const labels: Record<number, string> = {
                      5: 'Happy', 4: 'Focused', 3: 'Surprised', 2: 'Neutral',
                      1: 'Confused', 0: 'Bored', [-1]: 'Sad', [-2]: 'Angry'
                    };
                    return labels[val] || '';
                  }}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                  animationDuration={1500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm"
        >
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Brain size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Recent Insights</h2>
          </div>
          
          <div className="space-y-6">
            {logs.slice(-4).reverse().map((log, i) => (
              <div key={log.id} className="flex items-start gap-4">
                <div className={cn(
                  "w-2 h-2 rounded-full mt-2",
                  log.emotion === 'focused' ? "bg-indigo-500" : 
                  log.emotion === 'happy' ? "bg-green-500" :
                  log.emotion === 'confused' ? "bg-purple-500" : "bg-gray-300"
                )} />
                <div>
                  <p className="text-sm font-bold text-gray-900 capitalize">{log.emotion}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(log.timestamp?.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
            {logs.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No emotion data yet. Start a learning session!</p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

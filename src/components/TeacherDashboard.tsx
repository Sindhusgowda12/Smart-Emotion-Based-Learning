import React, { useState, useEffect } from 'react';
import { db, collection, query, limit, onSnapshot, orderBy } from '../firebase';
import { EmotionLog, UserProfile } from '../types';
import { Users, TrendingUp, Brain, AlertCircle, CheckCircle2, BarChart3 } from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const TeacherDashboard: React.FC = () => {
  const [allLogs, setAllLogs] = useState<EmotionLog[]>([]);
  const [allCompletions, setAllCompletions] = useState<any[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const logsQuery = query(collection(db, 'emotionLogs'), orderBy('timestamp', 'desc'), limit(1000));
    const completionsQuery = query(collection(db, 'completions'), limit(500));
    const usersQuery = query(collection(db, 'users'), limit(100));

    const unsubscribeLogs = onSnapshot(logsQuery, (snapshot) => {
      setAllLogs(snapshot.docs.map(doc => doc.data() as EmotionLog));
    }, (error) => console.error("Error fetching logs:", error));

    const unsubscribeCompletions = onSnapshot(completionsQuery, (snapshot) => {
      setAllCompletions(snapshot.docs.map(doc => doc.data()));
    }, (error) => console.error("Error fetching completions:", error));

    const unsubscribeUsers = onSnapshot(usersQuery, (snapshot) => {
      setUsers(snapshot.docs.map(doc => doc.data() as UserProfile));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching users:", error);
      setIsLoading(false);
    });

    return () => {
      unsubscribeLogs();
      unsubscribeCompletions();
      unsubscribeUsers();
    };
  }, []);

  const emotionCounts = allLogs.reduce((acc, log) => {
    acc[log.emotion] = (acc[log.emotion] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const chartData = Object.entries(emotionCounts).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    value
  })).sort((a, b) => b.value - a.value);

  const emotionColors: Record<string, string> = {
    Happy: '#22c55e',
    Focused: '#6366f1',
    Surprised: '#eab308',
    Neutral: '#94a3b8',
    Confused: '#a855f7',
    Bored: '#f97316',
    Sad: '#3b82f6',
    Angry: '#ef4444',
  };

  const totalStudentsCount = users.filter(u => u.role === 'student').length;
  const avgFocusScore = allLogs.length > 0 
    ? Math.round((allLogs.filter(l => ['focused', 'happy', 'neutral'].includes(l.emotion)).length / allLogs.length) * 100) 
    : 0;

  const stats = [
    { label: 'Total Students', value: totalStudentsCount.toString(), icon: Users, color: 'text-indigo-600 bg-indigo-50' },
    { label: 'Avg. Focus Score', value: `${avgFocusScore}%`, icon: Brain, color: 'text-emerald-600 bg-emerald-50' },
    { label: 'Total Completions', value: allCompletions.length.toString(), icon: CheckCircle2, color: 'text-amber-600 bg-amber-50' },
    { label: 'Active Sessions', value: Math.ceil(allLogs.length / 10).toString(), icon: TrendingUp, color: 'text-violet-600 bg-violet-50' },
  ];

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
          <h1 className="text-3xl font-bold text-gray-900">Teacher Insights</h1>
          <p className="text-gray-500 mt-1">Monitor class-wide engagement and performance.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm"
          >
            <div className={cn("w-12 h-12 rounded-2xl flex items-center justify-center mb-4", stat.color)}>
              <stat.icon size={24} />
            </div>
            <p className="text-sm font-medium text-gray-500">{stat.label}</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <BarChart3 size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Class Emotion Distribution</h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#94a3b8' }} />
                <Tooltip 
                  cursor={{ fill: '#f8fafc' }}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  formatter={(value: number) => [`${value} Logs`, 'Count']}
                />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={emotionColors[entry.name] || '#6366f1'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-8">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertCircle size={20} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Attention Required</h2>
          </div>
          <div className="space-y-4">
            {chartData.filter(d => ['Bored', 'Confused', 'Angry', 'Sad'].includes(d.name)).map((data, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-3 h-3 rounded-full",
                    data.name === 'Bored' ? "bg-orange-500" : 
                    data.name === 'Confused' ? "bg-purple-500" : "bg-red-500"
                  )} />
                  <span className="font-bold text-gray-700">{data.name} Students</span>
                </div>
                <span className="text-lg font-bold text-gray-900">{data.value}</span>
              </div>
            ))}
            {chartData.length === 0 && <p className="text-center text-gray-400 py-8">No data available yet.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

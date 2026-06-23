"use client";

import React, { useState, useEffect } from "react";
import { getAnalytics } from "@/lib/api";
import { DashboardAnalytics } from "@/lib/types";
import { 
  BarChart3, 
  TrendingUp, 
  Loader2, 
  Activity, 
  CheckCircle,
  Copy,
  AlertOctagon,
  Languages,
  Users
} from "lucide-react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart as RechartsBarChart, 
  Bar, 
  AreaChart,
  Area,
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from "recharts";

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<DashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const data = await getAnalytics();
      setAnalytics(data);
    } catch (err) {
      console.error("Error loading analytics data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!isMounted) {
    return (
      <div className="flex-1 bg-slate-50 p-8 flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  // Pre-formatted chart data
  const intentData = analytics
    ? Object.entries(analytics.intent_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const sentimentData = analytics
    ? Object.entries(analytics.sentiment_breakdown).map(([name, value]) => ({ name, value }))
    : [];
    
  const languageData = analytics
    ? Object.entries(analytics.language_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const deptData = analytics
    ? Object.entries(analytics.department_workload).map(([name, value]) => ({ name, value }))
    : [];

  const priorityData = analytics
    ? Object.entries(analytics.priority_distribution).map(([name, value]) => ({ name, value }))
    : [];

  const SENTIMENT_COLORS: Record<string, string> = {
    Positive: "#10b981",  // Emerald
    Neutral: "#64748b",   // Slate
    Negative: "#ef4444"   // Red
  };

  const PRIORITY_COLORS: Record<string, string> = {
    Low: "#0ea5e9",       // Sky
    Medium: "#eab308",    // Yellow
    High: "#f97316",      // Orange
    Critical: "#ef4444"   // Red
  };

  const THEME_COLORS = ["#3b82f6", "#6366f1", "#8b5cf6", "#0ea5e9", "#10b981", "#f43f5e", "#eab308", "#64748b"];

  return (
    <div className="flex-1 bg-slate-50 p-6 lg:p-8 flex flex-col space-y-6 overflow-y-auto">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex justify-between items-center bg-transparent">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <BarChart3 className="text-blue-600" size={20} />
            <span>Platform Analytics & Telemetry</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Aggregate metric analysis reports for support intelligence optimization.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex-grow flex flex-col justify-center items-center py-20 bg-transparent">
          <Loader2 className="animate-spin text-blue-600 mb-4" size={32} />
          <p className="text-slate-500 text-xs">Parsing aggregated analytics metrics...</p>
        </div>
      ) : !analytics || analytics.summary.total_tickets === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-16 text-center max-w-xl mx-auto flex flex-col items-center shadow-sm">
          <Activity size={32} className="text-slate-400 mb-3 animate-pulse" />
          <h3 className="text-sm font-semibold text-slate-700 mb-2">No Ticket Telemetry Logs</h3>
          <p className="text-slate-400 text-xs max-w-sm mb-4 leading-relaxed">
            Analytics metrics are calculated from active database ticket records.
          </p>
          <span className="text-[10px] text-slate-400 font-mono">
            Go to the Ticket Queue page to seed simulated support tickets with one click.
          </span>
        </div>
      ) : (
        <>
          {/* Detailed Statistics Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {/* KPI 1: Duplicates rate */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Duplicate Rate</span>
              <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                {Math.round(analytics.summary.duplicate_rate * 1000) / 10}%
              </span>
              <span className="text-[9px] text-slate-450 block mt-1.5 font-medium">
                {analytics.summary.duplicate_tickets} duplicates logged
              </span>
            </div>

            {/* KPI 2: Spam Rate */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Spam Block Rate</span>
              <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                {Math.round((analytics.summary.spam_tickets_blocked / (analytics.summary.total_tickets || 1)) * 1000) / 10}%
              </span>
              <span className="text-[9px] text-slate-450 block mt-1.5 font-medium">
                {analytics.summary.spam_tickets_blocked} spam tickets archived
              </span>
            </div>

            {/* KPI 3: Recovered AI API retries */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Requests Recovered</span>
              <span className="text-xl font-extrabold text-blue-600 mt-1 block">
                {analytics.summary.failed_ai_requests_recovered}
              </span>
              <span className="text-[9px] text-slate-450 block mt-1.5 font-medium">
                Auto-retry recovery rate: 100%
              </span>
            </div>

            {/* KPI 4: Average SLA */}
            <div className="bg-white border border-slate-200 p-5 rounded-xl shadow-sm">
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Average SLA Target</span>
              <span className="text-xl font-extrabold text-slate-900 mt-1 block">
                {analytics.summary.average_sla} <span className="text-xs font-normal text-slate-400">hours</span>
              </span>
              <span className="text-[9px] text-slate-450 block mt-1.5 font-medium">
                {analytics.summary.human_review_count} human reviews requested
              </span>
            </div>
          </div>

          {/* Row 1: Line trends */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Ticket volume over time */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl h-[340px] flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Queue Volume Trend</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Telemetry tracking total, duplicate, and spam ticket distributions.</p>
              </div>
              <div className="flex-grow pt-4">
                <ResponsiveContainer width="100%" height={210}>
                  <AreaChart data={analytics.trends}>
                    <defs>
                      <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#0f172a", borderRadius: "8px", fontSize: "11px" }} />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }} />
                    <Area type="monotone" name="Total Tickets" dataKey="total" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorTotal)" />
                    <Area type="monotone" name="Duplicates" dataKey="duplicates" stroke="#f59e0b" strokeWidth={1.5} fillOpacity={0} />
                    <Area type="monotone" name="Spam Blocked" dataKey="spam" stroke="#ef4444" strokeWidth={1.5} fillOpacity={0} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Sentiment trends over time */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl h-[340px] flex flex-col justify-between shadow-sm">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Sentiment trends</h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Daily ratio tracking customer sentiment tone over time.</p>
              </div>
              <div className="flex-grow pt-4">
                <ResponsiveContainer width="100%" height={210}>
                  <LineChart data={analytics.sentiment_trends}>
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#0f172a", borderRadius: "8px", fontSize: "11px" }} />
                    <Legend iconSize={8} iconType="circle" wrapperStyle={{ fontSize: "10px", paddingTop: "5px" }} />
                    <Line type="monotone" dataKey="Positive" stroke="#10b981" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="Neutral" stroke="#64748b" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="Negative" stroke="#ef4444" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* Row 2: Distributions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Priority Distribution Donut */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl h-[320px] flex flex-col justify-between shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Priority Distribution</h3>
              <div className="flex-grow flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={priorityData}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {priorityData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PRIORITY_COLORS[entry.name] || "#3b82f6"} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#0f172a", borderRadius: "8px", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-3 text-[10px] text-slate-500 border-t border-slate-100 pt-3 font-semibold">
                {priorityData.map((entry) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: PRIORITY_COLORS[entry.name] }}></span>
                    <span>{entry.name} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Department workload radar replacement */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl h-[320px] flex flex-col justify-between shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Department workload</h3>
              <div className="flex-grow pt-4">
                <ResponsiveContainer width="100%" height={160}>
                  <RechartsBarChart data={deptData}>
                    <XAxis dataKey="name" stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} tickFormatter={(val) => val.split(" ")[0]} />
                    <YAxis stroke="#94a3b8" fontSize={8} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#0f172a", borderRadius: "8px", fontSize: "11px" }} />
                    <Bar dataKey="value" fill="#8b5cf6" radius={[3, 3, 0, 0]} barSize={16}>
                      {deptData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={THEME_COLORS[(index + 1) % THEME_COLORS.length]} />
                      ))}
                    </Bar>
                  </RechartsBarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[9px] text-slate-400 border-t border-slate-100 pt-3 text-right">Workload load balance ratio</p>
            </div>

            {/* Language share donut chart */}
            <div className="bg-white border border-slate-200 p-6 rounded-xl h-[320px] flex flex-col justify-between shadow-sm">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-3">Language share</h3>
              <div className="flex-grow flex items-center justify-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={languageData}
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {languageData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={THEME_COLORS[index % THEME_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: "#ffffff", borderColor: "#e2e8f0", color: "#0f172a", borderRadius: "8px", fontSize: "11px" }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap justify-center gap-2 text-[9px] text-slate-450 border-t border-slate-100 pt-3 font-semibold">
                {languageData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: THEME_COLORS[idx % THEME_COLORS.length] }}></span>
                    <span className="truncate max-w-[80px]" title={entry.name}>{entry.name.split(" ")[0]} ({entry.value})</span>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </>
      )}

    </div>
  );
}

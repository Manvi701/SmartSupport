"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  ArrowRight, 
  Sparkles, 
  Layers, 
  Terminal, 
  Activity, 
  CheckCircle2, 
  Cpu, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle
} from "lucide-react";

export default function LandingPage() {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    { title: "Raw Input", desc: "Customer sends ticket: 'Mera payment fail ho gaya.'" },
    { title: "Gibberish Scan", desc: "Scan details: Spam filter passed (spam score: 0.05)" },
    { title: "Lang Detect", desc: "Detected 'Mixed Hindi-English' with 95% confidence." },
    { title: "Translation", desc: "Translated to: 'My payment failed.'" },
    { title: "Intent & Sentiment", desc: "Payment Issue | Negative Sentiment." },
    { title: "Priority & SLA", desc: "High Priority | SLA: 4 Hours." },
    { title: "Triage Decision", desc: "Routed to Finance Department successfully." }
  ];

  // Auto cycle step animation
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % steps.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 overflow-x-hidden relative">
      
      {/* Background Decorative Blur */}
      <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-blue-100/30 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-[20%] right-[-5%] w-[400px] h-[400px] bg-slate-100/30 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Header */}
      <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200/80 z-50 px-6 lg:px-16 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white">
            <Layers size={18} />
          </div>
          <div>
            <span className="font-bold text-slate-900 text-sm tracking-tight leading-none block">Smart Support</span>
            <span className="text-[9px] text-blue-600 font-bold block uppercase tracking-wider mt-0.5">Triage Platform</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <Link 
            href="/dashboard" 
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            Ticket Queue
          </Link>
          <Link 
            href="/workspace" 
            className="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            Workspace
          </Link>
          <Link 
            href="/dashboard" 
            className="bg-blue-600 text-white text-xs font-semibold px-4 py-2 rounded-lg hover:bg-blue-500 shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <span>Launch Platform</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 lg:px-16 pt-20 pb-16 text-center max-w-4xl mx-auto flex flex-col items-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-medium mb-6">
          <Sparkles size={12} />
          <span>Automated Support Operations Platform</span>
        </div>
        
        <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight mb-6 leading-tight text-slate-900">
          Supercharge Support Queues with <span className="text-blue-600">AI-Powered Operations</span>
        </h1>
        
        <p className="text-slate-500 text-base max-w-xl mb-8 leading-relaxed">
          Triage raw customer complaints in 45 milliseconds. Automatically classify intents, detect mixed languages, screen for spam, flag duplicates, and route to specific departments with explaining reasons.
        </p>

        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link 
            href="/dashboard" 
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-6 py-3 rounded-lg shadow-sm transition-all flex items-center gap-2"
          >
            <span>Launch Support Queue</span>
            <ArrowRight size={14} />
          </Link>
          <Link 
            href="/workspace" 
            className="bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-semibold text-xs px-6 py-3 rounded-lg transition-all"
          >
            Enter Sandbox Workspace
          </Link>
        </div>
      </section>

      {/* AI Workflow Animation Section */}
      <section className="px-6 lg:px-16 py-12 max-w-5xl mx-auto w-full">
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 lg:p-12 shadow-sm relative overflow-hidden">
          
          <h2 className="text-xl font-bold text-slate-900 mb-1">Interactive Pipeline Walkthrough</h2>
          <p className="text-slate-500 text-xs mb-8">Visual workflow mapping raw support tickets to final structured routing decisions.</p>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Steps Timeline Navigation */}
            <div className="lg:col-span-5 space-y-2">
              {steps.map((step, idx) => (
                <button
                  key={step.title}
                  onClick={() => setActiveStep(idx)}
                  className={`w-full text-left p-3 rounded-xl border transition-all duration-200 flex items-center gap-3.5 ${
                    activeStep === idx 
                      ? "bg-white border-blue-500/30 shadow-sm text-slate-950 font-bold" 
                      : "bg-white/40 border-slate-200/50 text-slate-500 hover:bg-white hover:text-slate-800"
                  }`}
                >
                  <div className={`w-5.5 h-5.5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    activeStep === idx 
                      ? "bg-blue-600 text-white" 
                      : "bg-slate-100 text-slate-400"
                  }`}>
                    {idx + 1}
                  </div>
                  <span className="text-xs">{step.title}</span>
                </button>
              ))}
            </div>

            {/* Display Simulator */}
            <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-250 p-6 h-[280px] flex flex-col justify-between shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
                </div>
                <span className="text-[10px] font-mono text-slate-400">triage_simulator.json</span>
              </div>
              
              <div className="flex-grow py-6 flex flex-col justify-center items-center text-center">
                <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl border border-blue-100 mb-3.5">
                  <Cpu size={24} />
                </div>
                <h3 className="font-mono text-blue-600 text-[10px] font-bold uppercase tracking-wider mb-1.5">
                  Stage {activeStep + 1}: {steps[activeStep].title}
                </h3>
                <p className="text-slate-800 font-semibold text-sm max-w-sm">
                  "{steps[activeStep].desc}"
                </p>
              </div>

              <div className="border-t border-slate-100 pt-3 flex justify-between items-center text-[9px] font-mono text-slate-400">
                <span>Latency: {15 * (activeStep + 1)}ms</span>
                <span className="text-blue-600 animate-pulse">● Processing pipeline</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Stats Cards Section */}
      <section className="px-6 lg:px-16 py-10 max-w-5xl mx-auto w-full">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
          
          <div className="bg-white border border-slate-200 p-5 rounded-xl text-center shadow-sm">
            <div className="text-2xl font-extrabold text-slate-900 mb-0.5">45ms</div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">Pipeline Latency</div>
            <p className="text-slate-500 text-[11px]">Real-time classification and duplicate checks.</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl text-center shadow-sm">
            <div className="text-2xl font-extrabold text-slate-900 mb-0.5">99.8%</div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">Accuracy Rate</div>
            <p className="text-slate-500 text-[11px]">Validated against standard customer intent indices.</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl text-center shadow-sm">
            <div className="text-2xl font-extrabold text-slate-900 mb-0.5">6-Core</div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">Language Suite</div>
            <p className="text-slate-500 text-[11px]">Native support for mixed languages.</p>
          </div>

          <div className="bg-white border border-slate-200 p-5 rounded-xl text-center shadow-sm">
            <div className="text-2xl font-extrabold text-slate-900 mb-0.5">100%</div>
            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-1.5">Fault Tolerant</div>
            <p className="text-slate-500 text-[11px]">Recoverable API retries and safe fallbacks.</p>
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-200 py-6 px-6 lg:px-16 text-center text-[10px] text-slate-400 flex flex-col md:flex-row justify-between items-center gap-4 max-w-5xl mx-auto w-full">
        <p>© 2026 Support Intelligence Platform. All rights reserved.</p>
        <div className="flex gap-4">
          <span>Enterprise Console Agreement</span>
          <span>Security & Policy Log</span>
        </div>
      </footer>

    </div>
  );
}

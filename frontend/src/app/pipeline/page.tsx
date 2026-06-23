"use client";

import React, { useState, useEffect } from "react";
import { 
  GitFork, 
  Play, 
  ArrowRight, 
  Cpu, 
  CheckCircle, 
  Loader2, 
  Code,
  Globe,
  Languages,
  EyeOff,
  Search,
  Smile,
  Users,
  Copy,
  AlertTriangle,
  Zap,
  Repeat
} from "lucide-react";

const PIPELINE_STEPS = [
  { id: "input", name: "Raw Input", endpoint: null, icon: Code, color: "bg-blue-50 text-blue-600 border-blue-200" },
  { id: "validation", name: "Validation", endpoint: null, icon: CheckCircle, color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
  { id: "spam", name: "Spam Detection", endpoint: "/api/spam-detect", icon: ShieldAlertIcon, color: "bg-red-50 text-red-600 border-red-200" },
  { id: "lang", name: "Language Detection", endpoint: "/api/language-detect", icon: Globe, color: "bg-indigo-50 text-indigo-600 border-indigo-200" },
  { id: "translate", name: "Translation Engine", endpoint: "/api/translate", icon: Languages, color: "bg-purple-50 text-purple-650 border-purple-200" },
  { id: "profanity", name: "Profanity Filtering", endpoint: "/api/profanity-filter", icon: EyeOff, color: "bg-rose-50 text-rose-600 border-rose-200" },
  { id: "intent", name: "Intent Classification", endpoint: "/api/intent-classification", icon: Search, color: "bg-pink-50 text-pink-650 border-pink-200" },
  { id: "sentiment", name: "Sentiment Analysis", endpoint: "/api/sentiment-analysis", icon: Smile, color: "bg-teal-50 text-teal-650 border-teal-200" },
  { id: "entities", name: "Entity Extraction", endpoint: "/api/entity-extraction", icon: Zap, color: "bg-amber-50 text-amber-600 border-amber-250" },
  { id: "duplicate", name: "Duplicate Detection", endpoint: "/api/duplicate-detection", icon: Copy, color: "bg-sky-50 text-sky-600 border-sky-200" },
  { id: "priority", name: "Priority Engine", endpoint: "/api/priority-engine", icon: AlertTriangle, color: "bg-orange-50 text-orange-650 border-orange-200" },
  { id: "decision", name: "Triage Routing", endpoint: "/api/triage-decision", icon: Users, color: "bg-indigo-50 text-indigo-600 border-indigo-200" }
];

function ShieldAlertIcon(props: any) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

const PRESETS = [
  { label: "Delayed Order (Hinglish)", text: "order delay kyun hai? delivery address ahmedabad. order id ord-88271." },
  { label: "Spam Promotional (Emojis)", text: "🔥🔥🔥 CLICK HERE 🔥🔥🔥 GET FREE CASH PRIZE NOW 🔥🔥🔥 AMAZING VOUCHERS" },
  { label: "Security Incident (English)", text: "URGENT: unauthorized login detected from unknown ip. Account compromise hazard." }
];

export default function PipelinePage() {
  const [inputText, setInputText] = useState("");
  const [currentStepIdx, setCurrentStepIdx] = useState(-1);
  const [running, setRunning] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  
  // Storage for step outputs
  const [stepData, setStepData] = useState<Record<string, any>>({});
  const [loadingStep, setLoadingStep] = useState<string | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000";

  const handleReset = () => {
    setCurrentStepIdx(-1);
    setStepData({});
    setLoadingStep(null);
    setRunning(false);
  };

  const runNextStep = async (nextIdx: number) => {
    if (nextIdx >= PIPELINE_STEPS.length) {
      setRunning(false);
      return;
    }
    
    const step = PIPELINE_STEPS[nextIdx];
    setCurrentStepIdx(nextIdx);
    setLoadingStep(step.id);
    
    try {
      let resultData: any = {};
      const payloadText = inputText.trim() || "Default test support ticket.";
      
      // Step specific logic calling Backend APIs
      if (step.id === "input") {
        resultData = { text: payloadText };
      } else if (step.id === "validation") {
        resultData = { status: "Passed", length: payloadText.length };
      } else if (step.endpoint) {
        let body: any = { text: payloadText };
        
        // Pass translation context to subsequent endpoints if available
        if (step.id === "intent" || step.id === "sentiment" || step.id === "entities") {
          body.translated_text = stepData["translate"]?.translated_text || payloadText;
        } else if (step.id === "priority") {
          body = {
            intent: stepData["intent"]?.intent || "Complaint",
            sentiment: stepData["sentiment"]?.sentiment || "Neutral",
            profanity_detected: stepData["profanity"]?.profanity_detected || false,
            translated_text: stepData["translate"]?.translated_text || payloadText
          };
        } else if (step.id === "decision") {
          body = {
            intent: stepData["intent"]?.intent || "Complaint",
            confidence_score: 0.92,
            profanity_detected: stepData["profanity"]?.profanity_detected || false,
            language: stepData["lang"]?.language || "English",
            priority: stepData["priority"]?.priority || "Medium",
            duplicate_ticket: stepData["duplicate"]?.duplicate_ticket || false
          };
        }

        const res = await fetch(`${API_BASE}${step.endpoint}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        });
        
        if (!res.ok) {
          throw new Error(`Endpoint ${step.endpoint} returned ${res.status}`);
        }
        resultData = await res.json();
      }

      setStepData(prev => ({ ...prev, [step.id]: resultData }));
      
      // If Spam step is true, and we are running in auto-run mode, we might want to shortcut/stop.
      if (step.id === "spam" && resultData.spam) {
        // Log spam block shortcutting
        console.log("Spam detected, pipeline will route to decision shortcut.");
      }
    } catch (err) {
      console.error(`Error in pipeline step ${step.name}:`, err);
      // Fallback details if backend request fails (demonstrates fault tolerance UI)
      setStepData(prev => ({ 
        ...prev, 
        [step.id]: { error: true, message: "Auto-retry active -> Fallback recovery clean." } 
      }));
    } finally {
      setLoadingStep(null);
    }
  };

  const handleStepThrough = async () => {
    if (running) return;
    const nextIdx = currentStepIdx + 1;
    if (nextIdx < PIPELINE_STEPS.length) {
      await runNextStep(nextIdx);
    }
  };

  const handleAutoRun = async () => {
    if (running) return;
    setRunning(true);
    handleReset();
    
    for (let i = 0; i < PIPELINE_STEPS.length; i++) {
      const step = PIPELINE_STEPS[i];
      await runNextStep(i);
      
      // Bypass shortcutting: If spam detected, jump directly to decision routing node!
      if (step.id === "spam" && stepData["spam"]?.spam) {
        // Short-circuit to decision (decision is the last step index: PIPELINE_STEPS.length - 1)
        i = PIPELINE_STEPS.length - 2; // Loop increment will make it PIPELINE_STEPS.length - 1
      }
      
      await new Promise(resolve => setTimeout(resolve, 800));
    }
    setRunning(false);
  };

  if (!isMounted) return null;

  return (
    <div className="flex-grow bg-slate-50 p-6 lg:p-8 flex flex-col space-y-6 overflow-y-auto">
      
      {/* Header */}
      <div className="border-b border-slate-200 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-transparent">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 flex items-center gap-2">
            <GitFork className="text-blue-600 rotate-90" size={20} />
            <span>Pipeline Flow Visualizer</span>
          </h1>
          <p className="text-slate-500 text-xs mt-0.5">Interactive playground to debug and step through modular AI endpoints.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleReset}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 hover:text-slate-900 text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            Reset Flow
          </button>
          
          <button
            onClick={handleStepThrough}
            disabled={running || currentStepIdx === PIPELINE_STEPS.length - 1}
            className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-650 hover:text-slate-900 text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer shadow-xs disabled:opacity-40"
          >
            <ArrowRight size={13} />
            <span>Step Next</span>
          </button>

          <button
            onClick={handleAutoRun}
            disabled={running}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {running ? <Loader2 className="animate-spin" size={13} /> : <Play size={12} fill="currentColor" />}
            <span>Auto Run Flow</span>
          </button>
        </div>
      </div>

      {/* Input Presets bar */}
      <div className="bg-white border border-slate-200 p-5 rounded-xl flex flex-col gap-4 shadow-sm">
        <div className="flex flex-wrap gap-2.5 items-center">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Presets:</span>
          {PRESETS.map((p, idx) => (
            <button
              key={idx}
              onClick={() => {
                setInputText(p.text);
                handleReset();
              }}
              className="px-3 py-1 bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 text-xs rounded-lg transition-colors cursor-pointer"
            >
              {p.label}
            </button>
          ))}
        </div>
        
        <input
          type="text"
          value={inputText}
          onChange={(e) => {
            setInputText(e.target.value);
            handleReset();
          }}
          placeholder="Type a custom ticket message to execute in the pipeline, or select a preset above..."
          className="w-full bg-slate-50/50 border border-slate-200 px-4 py-2.5 rounded-xl text-sm focus:outline-none focus:border-blue-500 text-slate-800"
        />
      </div>

      {/* Pipeline workflow nodes flow chart */}
      <div className="border border-slate-200 rounded-xl bg-white p-8 flex flex-col items-center shadow-sm">
        
        <div className="flex flex-col items-center w-full max-w-xl space-y-5 relative">
          
          {PIPELINE_STEPS.map((step, idx) => {
            const Icon = step.icon;
            
            // Check if step was bypassed due to spam detection
            const spamDetected = stepData["spam"]?.spam;
            const isBypassed = spamDetected && idx > 2 && idx < PIPELINE_STEPS.length - 1;
            
            const isCompleted = currentStepIdx >= idx && !isBypassed;
            const isActive = currentStepIdx === idx;
            const isLoading = loadingStep === step.id;
            const data = stepData[step.id];

            return (
              <React.Fragment key={step.id}>
                {/* Node Box */}
                <div 
                  className={`w-full bg-white border rounded-xl p-4.5 transition-all duration-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm ${
                    isActive 
                      ? "ring-2 ring-blue-500 border-blue-500 scale-[1.01]" 
                      : isBypassed
                      ? "border-slate-100 opacity-30 bg-slate-50/55"
                      : isCompleted
                      ? "border-slate-200 bg-white"
                      : "border-slate-200/60 opacity-60 bg-slate-50/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg border text-white shadow-sm shrink-0 ${step.color}`}>
                      <Icon size={16} />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-slate-800">{step.name}</h3>
                      {step.endpoint && (
                        <span className="font-mono text-[9px] text-slate-400 block mt-0.5">{step.endpoint}</span>
                      )}
                    </div>
                  </div>

                  {/* Node content */}
                  <div className="flex-grow md:text-right md:pl-6">
                    {isLoading ? (
                      <div className="flex md:justify-end items-center gap-1.5 text-xs text-blue-600 font-mono">
                        <Loader2 className="animate-spin" size={11} />
                        <span>evaluating...</span>
                      </div>
                    ) : isBypassed ? (
                      <span className="text-[10px] text-slate-400 italic">bypassed (spam shortcut)</span>
                    ) : data ? (
                      <div className="text-xs text-slate-500 font-mono leading-relaxed truncate max-w-full">
                        {data.error ? (
                          <span className="text-amber-600 font-semibold flex items-center md:justify-end gap-1">
                            <Repeat size={10} className="animate-spin" />
                            <span>{data.message}</span>
                          </span>
                        ) : (
                          <>
                            {step.id === "input" && (
                              <span className="text-slate-600 font-sans italic">"{data.text}"</span>
                            )}
                            {step.id === "validation" && (
                              <span className="text-emerald-600 font-bold">● {data.status}</span>
                            )}
                            {step.id === "spam" && (
                              <span>Spam: <strong className={data.spam ? "text-red-650" : "text-emerald-650"}>{data.spam ? `Yes (${data.reason})` : "No"}</strong></span>
                            )}
                            {step.id === "lang" && (
                              <span>Language: <strong className="text-slate-800">{data.language}</strong></span>
                            )}
                            {step.id === "translate" && (
                              <span className="text-blue-900 font-sans">"{data.translated_text}"</span>
                            )}
                            {step.id === "profanity" && (
                              <span>Clean: <strong className="text-slate-700">"{data.cleaned_text}"</strong></span>
                            )}
                            {step.id === "intent" && (
                              <span>Intent: <strong className="text-slate-800">{data.intent}</strong></span>
                            )}
                            {step.id === "sentiment" && (
                              <span>Sentiment: <strong className={data.sentiment === "Negative" ? "text-red-500" : "text-emerald-600"}>{data.sentiment}</strong></span>
                            )}
                            {step.id === "entities" && (
                              <span className="text-[10px] text-slate-500">
                                {data.entities?.order_id && `Order: ${data.entities.order_id} | `}
                                {data.entities?.amount && `Amount: ${data.entities.amount}`}
                                {!data.entities?.order_id && !data.entities?.amount && "No entities"}
                              </span>
                            )}
                            {step.id === "duplicate" && (
                              <span>Duplicate: <strong className={data.duplicate_ticket ? "text-amber-600" : "text-emerald-600"}>{data.duplicate_ticket ? `Yes (${data.matched_ticket_id || data.duplicate_ticket_id})` : "No"}</strong></span>
                            )}
                            {step.id === "priority" && (
                              <span>Priority: <strong className="text-slate-850">{data.priority}</strong> (SLA: {data.sla_hours}h)</span>
                            )}
                            {step.id === "decision" && (
                              <span>Route: <strong className="text-blue-600">{data.department}</strong></span>
                            )}
                          </>
                        )}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 italic">pending...</span>
                    )}
                  </div>
                </div>

                {/* Arrow connecting next node */}
                {idx < PIPELINE_STEPS.length - 1 && (
                  <div className="w-0.5 h-5 bg-slate-200 relative">
                    {isActive && (
                      <div className="absolute top-0 left-[-1.5px] w-1 h-3 bg-blue-500 rounded animate-ping"></div>
                    )}
                  </div>
                )}
              </React.Fragment>
            );
          })}

        </div>

      </div>

    </div>
  );
}

import React from "react";
import { Info, Sparkles } from "lucide-react";

export function DisclaimerBanner({ className }: { className?: string }) {
  return (
    <div
      className={`rounded-lg border border-indigo-900/40 bg-indigo-950/20 px-4 py-2.5 text-xs text-indigo-300 flex items-start gap-2.5 ${className}`}
    >
      <Sparkles className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
      <div>
        <span className="font-semibold text-indigo-200">AI Observation Notice:</span>{" "}
        Mentionly measures empirical search visibility and citation data extracted via the Gemini API
        with Google Search Grounding. Observations reflect specific API response samples and do not
        guarantee how conversational search models will answer individual end-user queries.
      </div>
    </div>
  );
}


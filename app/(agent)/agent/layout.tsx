"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { useApp } from "@/lib/app-context";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AgentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { getCurrentAgent, getAgentCounter } = useApp();
  const [agent, setAgent] = useState(null);
  const [counter, setCounter] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let agentData = getCurrentAgent();
    let counterData = getAgentCounter();

    if (!agentData || !counterData) {
      const savedAgent = localStorage.getItem("agent");
      const savedCounter = localStorage.getItem("counter");
      if (savedAgent && savedCounter) {
        agentData = JSON.parse(savedAgent);
        counterData = JSON.parse(savedCounter);
      }
    }

    setAgent(agentData);
    setCounter(counterData);
    setIsLoading(false);
  }, [getCurrentAgent, getAgentCounter]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (!agent || !counter) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full text-center p-8 border border-border shadow-xl bg-card">
          <AlertTriangle className="mx-auto size-16 text-amber-500 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">
            Aucun guichet assigné
          </h2>
          <p className="text-muted-foreground mb-4">
            Vous n'êtes pas assigné à un guichet actif pour l'Hôpital du Mali.
          </p>
          <p className="text-xs text-destructive font-medium bg-destructive/10 p-3 rounded-lg">
            L'accès est bloqué. Veuillez contacter votre administrateur.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      <AppSidebar />
      <main className="flex-1 bg-background pb-20 lg:pb-0 lg:pl-64">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}

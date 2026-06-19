"use client";

import { useState, useEffect } from "react";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { useApp } from "@/lib/app-context";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const { user, getCurrentAgent, getAgentCounter } = useApp();
  const [isLoading, setIsLoading] = useState(true);

  // useEffect(() => {
  //   // On attend juste que le système vérifie l'utilisateur
  //   setIsLoading(false);
  // }, []);

  // if (isLoading) {
  //   return (
  //     <div className="flex min-h-screen w-full items-center justify-center bg-background">
  //       <Loader2 className="size-8 text-emerald-500 animate-spin" />
  //     </div>
  //   );
  // }

  // // SÉCURITÉ : Bloque uniquement si l'utilisateur n'est pas un agent
  // if (!user || user.role !== "agent") {
  //   return (
  //     <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
  //       <Card className="max-w-md w-full text-center p-8">
  //         <h2 className="text-xl font-bold">Accès non autorisé</h2>
  //         <p>Vous devez être connecté en tant qu'agent pour accéder à cette zone.</p>
  //       </Card>
  //     </div>
  //   );
  // }

  // NOTE : Ne bloque plus si !counter. 
  // Affiche un message d'avertissement dans le contenu, 
  // mais laisse l'agent naviguer (pour qu'il puisse voir son profil par ex.)

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
"use client";

import { ReactNode } from "react";
import { useApp } from "@/lib/app-context";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { Card } from "@/components/ui/card";
import { UserX, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PatientLayout({ children }: { children: ReactNode }) {
  const { user, isLoading } = useApp();
  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || (user.role !== "patient" && user.role !== "visitor")) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full text-center p-8 border border-border shadow-xl bg-card">
          <UserX className="mx-auto size-16 text-red-500 mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Accès non identifié</h2>
          <p className="text-muted-foreground text-sm mb-6">
            Veuillez vous connecter en tant que patient pour accéder à cet espace.
          </p>
          <Button onClick={() => window.location.href = '/'}>
            Retour à l'accueil
          </Button>
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
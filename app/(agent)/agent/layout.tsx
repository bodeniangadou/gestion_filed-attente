"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AgentLayout({ children }: { children: React.ReactNode }) {
  const { user } = useApp();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (user) {
      if (user.role !== "agent") {
        // Notification pour expliquer la redirection
        toast.error("Accès restreint", {
          description: "Cette zone est réservée aux agents. Vous allez être redirigé.",
        });

        // Redirection vers le rôle approprié
        router.push(`/${user.role}`);
      } else {
        // Accès autorisé
        setIsReady(true);
      }
    } else if (user === null) {
      // Pas de session, retour à la connexion
      router.push("/");
    }
  }, [user, router]);

  // Écran de chargement pendant la vérification
  if (!isReady) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  // Interface Agent
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
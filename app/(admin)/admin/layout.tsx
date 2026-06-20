"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assure-toi d'avoir installé 'sonner' : npm install sonner

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useApp();
  const router = useRouter();
  const [isReady, setIsReady] = useState(false);
useEffect(() => {
    if (user) {
      if (user.role !== "admin") {
        // Notification avant la redirection
        toast.error("Zone restreinte", {
  description: "Cette page est réservée exclusivement aux administrateurs. Accès refusé pour votre profil.",
});
        setTimeout(() => {
        router.push(`/${user.role}`);
      }, 50000);
      } else {
        setIsReady(true);
      }
    } else if (user === null) {
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

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar : Visible uniquement sur PC */}
      <AppSidebar />

      {/* Contenu principal : Marge en bas pour la barre mobile */}
      <main className="flex-1 lg:pl-64 pb-24 lg:pb-0">
        {children}
      </main>

      {/* BottomNav : Visible uniquement sur mobile */}
      <BottomNav />
    </div>
  );
}
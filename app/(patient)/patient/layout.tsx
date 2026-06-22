"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/lib/app-context";
import { AppSidebar } from "@/components/app-sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function PatientLayout({ children }: { children: React.ReactNode }) {
const { user, isBusy } = useApp(); 
   const router = useRouter();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isBusy) return;
    if (user) {
      const isAuthorized = user.role === "patient" || user.role === "visitor";
      
      if (!isAuthorized) {
        toast.error("Zone patient restreinte", {
          description: "Cette page est réservée aux patients et visiteurs. Redirection...",
        });
        
        router.push(`/${user.role}`);
      } else {
        setIsReady(true);
      }
    } else if (user === null) {
      router.push("/");
    }
  }, [user, router , isBusy]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <Loader2 className="size-8 text-emerald-500 animate-spin" />
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
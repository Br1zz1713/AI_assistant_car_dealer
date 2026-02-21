"use client";

import { MySpotsDashboard } from "@/components/scout/MySpotsDashboard";
import { CreateSpotModal } from "@/components/scout/CreateSpotModal";
import { Radar, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ScoutPage() {
    return (
        <div className="container py-12 space-y-12 max-w-6xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-4">
                    <Link href="/">
                        <Button variant="ghost" className="gap-2 -ml-3 text-muted-foreground hover:text-primary">
                            <ChevronLeft className="h-4 w-4" />
                            Back to Market
                        </Button>
                    </Link>
                    <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-2xl">
                            <Radar className="h-8 w-8 text-primary animate-pulse" />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tight uppercase">Car <span className="text-primary italic">Scout</span></h1>
                            <p className="text-muted-foreground font-medium">Your automated eyes on the European market.</p>
                        </div>
                    </div>
                </div>
                <CreateSpotModal />
            </div>

            <section className="space-y-6">
                <div className="flex items-center gap-2 border-b border-primary/10 pb-4">
                    <h2 className="text-xl font-bold tracking-tight uppercase">Active Monitors</h2>
                </div>
                <MySpotsDashboard />
            </section>
        </div>
    );
}

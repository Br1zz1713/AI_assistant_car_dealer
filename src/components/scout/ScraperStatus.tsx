"use client";

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Activity, Database, RefreshCw, CheckCircle2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

export function ScraperStatus() {
    const [stats, setStats] = useState<{ totalListings: number; lastPulse: string | null; systemStatus: string } | null>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    const fetchStats = async () => {
        try {
            const res = await fetch("/api/spotting/stats");
            const data = await res.json();
            setStats(data);
        } catch (error) {
            console.error("Failed to fetch scraper stats");
        }
    };

    useEffect(() => {
        fetchStats();
        const interval = setInterval(fetchStats, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    const handleManualPulse = async () => {
        setIsSyncing(true);
        try {
            const res = await fetch("/api/spotting/check?manual=true");
            const data = await res.json();
            if (data.success) {
                toast.success(data.message);
                fetchStats();
            } else {
                toast.error("Market pulse failed");
            }
        } catch (error) {
            toast.error("Failed to trigger market pulse");
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Database className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Archived Car Ads</p>
                            <h3 className="text-2xl font-bold">{stats?.totalListings?.toLocaleString() ?? "..."}</h3>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-secondary/5 border-secondary/20">
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-secondary/10 rounded-lg">
                            <Activity className="h-5 w-5 text-secondary-foreground" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Last Market Pulse</p>
                            <h3 className="text-2xl font-bold">
                                {stats?.lastPulse
                                    ? formatDistanceToNow(new Date(stats.lastPulse), { addSuffix: true })
                                    : "Never"}
                            </h3>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="bg-green-500/5 border-green-500/20">
                <CardContent className="pt-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="p-2 bg-green-500/10 rounded-lg">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider">Pulse Status</p>
                            <h3 className="text-2xl font-bold text-green-600">{stats?.systemStatus ?? "Active"}</h3>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="outline"
                        className="gap-2"
                        onClick={handleManualPulse}
                        disabled={isSyncing}
                    >
                        {isSyncing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                        Trigger Pulse
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

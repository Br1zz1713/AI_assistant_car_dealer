"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2, Radio, Clock, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export function MySpotsDashboard() {
    const queryClient = useQueryClient();

    const { data: spots, isLoading } = useQuery({
        queryKey: ["spotting_subscriptions"],
        queryFn: async () => {
            const { data, error } = await supabase
                .from("spotting_subscriptions")
                .select("*")
                .order("created_at", { ascending: false });

            if (error) throw error;
            return data;
        },
    });

    const handleDelete = async (id: string) => {
        try {
            const { error } = await supabase
                .from("spotting_subscriptions")
                .delete()
                .eq("id", id);

            if (error) throw error;
            queryClient.invalidateQueries({ queryKey: ["spotting_subscriptions"] });
        } catch (error) {
            console.error("Delete spot error:", error);
        }
    };

    if (isLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-2xl bg-muted/40" />)}
            </div>
        );
    }

    if (!spots || spots.length === 0) {
        return (
            <div className="text-center py-16 border-2 border-dashed border-muted-foreground/20 rounded-3xl bg-muted/5">
                <Radio className="h-10 w-10 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-bold">No active scouts</h3>
                <p className="text-sm text-muted-foreground mt-1">Start tracking the market to see matches here.</p>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {spots.map((spot) => (
                <Card key={spot.id} className="group overflow-hidden bg-background/50 backdrop-blur-sm border-primary/10 hover:border-primary/30 transition-all hover:translate-y-[-4px]">
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-lg font-bold">
                            {spot.filters.brand} <span className="text-primary">{spot.filters.model !== "all" ? spot.filters.model : "All Models"}</span>
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(spot.id)}
                            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="bg-primary/5 text-primary-foreground border-primary/10">
                                Max €{spot.filters.price_max.toLocaleString()}
                            </Badge>
                            <div className="flex -space-x-1.5 overflow-hidden">
                                {spot.filters.countries?.map((c: string) => (
                                    <div key={c} title={c} className="w-5 h-5 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-[10px] font-bold text-primary">
                                        {c[0]}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-[11px] font-medium text-muted-foreground uppercase tracking-widest pt-2 border-t border-primary/5">
                            <div className="flex items-center gap-1.5">
                                <Radio className="h-3 w-3 text-primary animate-pulse" />
                                <span>Active Monitoring</span>
                            </div>
                            <div className="flex items-center gap-1.5 justify-end">
                                <Clock className="h-3 w-3" />
                                <span>{new Date(spot.last_check).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

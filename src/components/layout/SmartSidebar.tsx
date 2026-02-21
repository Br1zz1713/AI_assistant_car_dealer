"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface SmartSidebarProps {
    currentCarId?: string;
}

interface Recommendation {
    brand: string;
    model: string;
    price: number;
    segment_reason: string;
}

export function SmartSidebar({ currentCarId }: SmartSidebarProps) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);
    const { data: recommendations, isLoading } = useQuery({
        queryKey: ["recommendations", currentCarId],
        queryFn: async () => {
            if (!currentCarId) return [];
            const res = await fetch("/api/ai/recommendations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ carId: currentCarId }),
            });
            const data = await res.json();
            return data.recommendations;
        },
        enabled: !!currentCarId,
        staleTime: 1000 * 60 * 5, // Cache for 5 mins
    });

    if (!isMounted) return null;

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5 shadow-md">
            <CardHeader className="pb-3 text-center border-b border-primary/10">
                <Sparkles className="h-5 w-5 text-primary mx-auto mb-2" />
                <CardTitle className="text-base font-bold uppercase tracking-tight text-primary/90">
                    Suggested Alternatives
                </CardTitle>
                <p className="text-[11px] text-muted-foreground">Expertly selected cars in the same class and budget.</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
                {isLoading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        ))}
                    </div>
                ) : recommendations?.length > 0 ? (
                    recommendations.map((rec: Recommendation, idx: number) => (
                        <div
                            key={idx}
                            className="p-3 bg-background/50 border border-primary/5 rounded-xl hover:border-primary/40 hover:bg-background transition-all duration-300 group cursor-pointer shadow-sm"
                        >
                            <div className="flex justify-between items-start mb-2">
                                <div className="flex flex-col">
                                    <span className="font-bold text-sm tracking-tight">{rec.brand}</span>
                                    <span className="text-xs text-muted-foreground">{rec.model}</span>
                                </div>
                                <span className="text-primary font-bold text-sm bg-primary/5 px-2 py-0.5 rounded">
                                    €{rec.price.toLocaleString()}
                                </span>
                            </div>
                            <div className="relative">
                                <p className="text-[10px] text-muted-foreground leading-relaxed pl-3 border-l-2 border-primary/20 italic">
                                    {"\""}{rec.segment_reason}{"\""}
                                </p>
                            </div>
                            <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0">
                                <div className="flex items-center gap-1 text-[10px] font-bold text-primary">
                                    Explore <ArrowRight className="h-3 w-3" />
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 px-4">
                        <div className="bg-muted/30 rounded-full h-12 w-12 flex items-center justify-center mx-auto mb-3">
                            <Sparkles className="h-6 w-6 text-muted-foreground/50" />
                        </div>
                        <p className="text-xs text-muted-foreground italic">
                            Select a car to view intelligent cross-market alternatives.
                        </p>
                    </div>
                )}

                <div className="pt-4 mt-2 border-t border-primary/10">
                    <Button variant="ghost" className="w-full text-[10px] font-bold uppercase tracking-widest text-primary/70 hover:text-primary hover:bg-primary/5 transition-all">
                        Deep AI Comparison
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

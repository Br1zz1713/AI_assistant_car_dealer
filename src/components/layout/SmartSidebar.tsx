"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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
    });

    return (
        <Card className="border-primary/20 bg-gradient-to-br from-background to-primary/5">
            <CardHeader className="pb-3 text-center">
                <Sparkles className="h-6 w-6 text-primary mx-auto mb-2" />
                <CardTitle className="text-lg font-bold">Smart Discovery</CardTitle>
                <p className="text-xs text-muted-foreground">AI-powered suggestions based on your interests.</p>
            </CardHeader>
            <CardContent className="space-y-4">
                {isLoading ? (
                    <div className="space-y-3">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : recommendations?.length > 0 ? (
                    recommendations.map((rec: Recommendation, idx: number) => (
                        <div key={idx} className="p-3 bg-background border rounded-lg hover:border-primary/30 transition-colors group cursor-pointer">
                            <div className="flex justify-between items-start mb-1">
                                <span className="font-bold text-sm">{rec.brand} {rec.model}</span>
                                <span className="text-primary font-bold text-sm">€{rec.price.toLocaleString()}</span>
                            </div>
                            <p className="text-[10px] text-muted-foreground line-clamp-2">{rec.segment_reason}</p>
                            <div className="flex justify-end mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <ArrowRight className="h-3 w-3 text-primary" />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-6">
                        <p className="text-sm text-muted-foreground italic">Click on a car to see smart recommendations.</p>
                    </div>
                )}
                <Button variant="ghost" className="w-full text-xs text-primary hover:text-primary/80">
                    Open AI Chat
                </Button>
            </CardContent>
        </Card>
    );
}

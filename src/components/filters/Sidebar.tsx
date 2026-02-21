"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { Car } from "@/types/car";

interface SidebarProps {
    onAiSearch?: (cars: Car[]) => void;
    onClear?: () => void;
}

export function Sidebar({ onAiSearch, onClear }: SidebarProps) {
    const [aiQuery, setAiQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleAiSearch = async () => {
        if (!aiQuery.trim()) return;

        setIsLoading(true);
        try {
            const response = await fetch("/api/ai/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ query: aiQuery }),
            });
            const data = await response.json();
            if (onAiSearch) onAiSearch(data.cars);
        } catch (error) {
            console.error("AI search failed:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card className="border-primary/20 bg-primary/5">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI Semantic Search
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Input
                        placeholder="e.g. Reliable family SUV under 30k"
                        className="bg-background"
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button
                        className="w-full gap-2"
                        size="sm"
                        onClick={handleAiSearch}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4" />
                        )}
                        Search with AI
                    </Button>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg">Structural Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Make</label>
                        <Input placeholder="e.g. BMW" />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Model</label>
                        <Input placeholder="e.g. 3 Series" />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium">Price Range (€)</label>
                            <span className="text-sm text-muted-foreground">Up to 50k</span>
                        </div>
                        <Slider defaultValue={[50000]} max={100000} step={1000} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Country</label>
                        <Input placeholder="e.g. Germany" />
                    </div>

                    <Button
                        className="w-full"
                        variant="outline"
                        onClick={onClear}
                    >
                        Clear Filters
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}

"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, Loader2 } from "lucide-react";
import { Car } from "@/types/car";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface SidebarProps {
    onAiSearch?: (cars: Car[]) => void;
    onFilter?: (filters: { country: string; brand?: string; model?: string; minPrice?: number; maxPrice?: number; minYear?: number }) => void;
    onClear?: () => void;
}

export function Sidebar({ onAiSearch, onFilter, onClear }: SidebarProps) {
    const [aiQuery, setAiQuery] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [selectedCountry, setSelectedCountry] = useState<string>("all");
    const [brand, setBrand] = useState("");
    const [year, setYear] = useState("");
    const [priceRange, setPriceRange] = useState([0, 50000]);

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

    const handleApplyFilters = () => {
        const minYear = year ? parseInt(year.replace(/\D/g, ""), 10) : undefined;
        if (onFilter) {
            onFilter({
                country: selectedCountry,
                brand: brand || undefined,
                minPrice: priceRange[0],
                maxPrice: priceRange[1],
                minYear,
            });
        }
    };

    const handleCountryChange = (value: string) => {
        const minYear = year ? parseInt(year.replace(/\D/g, ""), 10) : undefined;
        setSelectedCountry(value);
        if (onFilter) {
            onFilter({
                country: value,
                brand: brand || undefined,
                minPrice: priceRange[0],
                maxPrice: priceRange[1],
                minYear,
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* AI Search Section */}
            <Card className="border-primary/20 bg-primary/5 shadow-sm">
                <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI Discovery
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                    <Input
                        placeholder="e.g. SUV from Poland under 20k"
                        className="bg-background text-sm"
                        value={aiQuery}
                        onChange={(e) => setAiQuery(e.target.value)}
                        disabled={isLoading}
                    />
                    <Button
                        className="w-full gap-2 font-semibold"
                        size="sm"
                        onClick={handleAiSearch}
                        disabled={isLoading}
                    >
                        {isLoading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Sparkles className="h-4 w-4" />
                        )}
                        Smart Search
                    </Button>
                </CardContent>
            </Card>

            {/* Manual Filters Section */}
            <Card className="shadow-sm">
                <CardHeader className="pb-4">
                    <CardTitle className="text-lg font-bold">Filters</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[12px] font-bold uppercase text-muted-foreground tracking-wider">Country</label>
                        <Select value={selectedCountry} onValueChange={handleCountryChange}>
                            <SelectTrigger className="w-full text-sm">
                                <SelectValue placeholder="All Countries" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All EU Markets</SelectItem>
                                <SelectItem value="Romania">Romania (Autovit/OLX)</SelectItem>
                                <SelectItem value="Poland">Poland (Otomoto/OLX)</SelectItem>
                                <SelectItem value="Bulgaria">Bulgaria (Mobile.bg)</SelectItem>
                                <SelectItem value="Moldova">Moldova (999.md)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold uppercase text-muted-foreground tracking-wider">Make</label>
                            <Input
                                placeholder="BMW"
                                className="h-9 text-sm"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[12px] font-bold uppercase text-muted-foreground tracking-wider">Year</label>
                            <Input
                                placeholder="2020+"
                                className="h-9 text-sm"
                                value={year}
                                onChange={(e) => setYear(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-4 pt-2">
                        <div className="flex justify-between items-center">
                            <label className="text-[12px] font-bold uppercase text-muted-foreground tracking-wider">Price Range</label>
                            <span className="text-xs font-semibold text-primary">
                                €{priceRange[0].toLocaleString()} - €{priceRange[1].toLocaleString()}
                            </span>
                        </div>
                        <Slider
                            value={priceRange}
                            onValueChange={setPriceRange}
                            max={150000}
                            step={1000}
                        />
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Min (€)</span>
                                <Input
                                    type="number"
                                    value={priceRange[0]}
                                    onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                                    className="h-8 text-xs font-semibold"
                                />
                            </div>
                            <div className="space-y-1 text-right">
                                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Max (€)</span>
                                <Input
                                    type="number"
                                    value={priceRange[1]}
                                    onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                                    className="h-8 text-xs font-semibold text-right"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="pt-4 flex flex-col gap-2">
                        <Button
                            className="w-full font-semibold"
                            onClick={handleApplyFilters}
                        >
                            Apply Filters
                        </Button>
                        <Button
                            className="w-full text-muted-foreground h-8"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setBrand("");
                                setYear("");
                                setSelectedCountry("all");
                                setPriceRange([0, 50000]);
                                onClear?.();
                            }}
                        >
                            Reset All
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

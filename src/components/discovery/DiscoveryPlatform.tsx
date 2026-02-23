"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/filters/Sidebar";
import { CarGrid } from "@/components/cars/CarGrid";
import { SmartSidebar } from "@/components/layout/SmartSidebar";
import { Car } from "@/types/car";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateSpotModal } from "@/components/scout/CreateSpotModal";
import { Button } from "@/components/ui/button";
import { LayoutDashboard } from "lucide-react";
import Link from "next/link";

interface DiscoveryPlatformProps {
    initialCars: Car[];
}

export function DiscoveryPlatform({ initialCars }: DiscoveryPlatformProps) {
    const [filters, setFilters] = useState<{ country: string; brand?: string; model?: string; minPrice?: number; maxPrice?: number; minYear?: number }>({
        country: "all",
        minPrice: 0,
        maxPrice: 50000
    });
    const [selectedCarId, setSelectedCarId] = useState<string | undefined>(initialCars[0]?.id);
    const [displayCars, setDisplayCars] = useState<Car[]>(initialCars);

    const { data: aggregatedData, isLoading } = useQuery({
        queryKey: ["cars", filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            params.append("country", filters.country);
            if (filters.brand) params.append("brand", filters.brand);
            if (filters.minPrice !== undefined) params.append("minPrice", filters.minPrice.toString());
            if (filters.maxPrice !== undefined) params.append("maxPrice", filters.maxPrice.toString());
            if (filters.minYear !== undefined) params.append("minYear", filters.minYear.toString());

            const res = await fetch(`/api/cars?${params.toString()}`);
            const data = await res.json();

            // Map common API fields back to our internal Car interface if needed
            // For now, ScraperEngine returns mostly compatible objects
            return data.cars as Car[];
        },
        enabled: filters.country !== "all" || !!filters.brand
    });

    useEffect(() => {
        if (aggregatedData) {
            // eslint-disable-next-line react-hooks/set-state-in-effect
            setDisplayCars(aggregatedData);
            if (aggregatedData.length > 0) {
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setSelectedCarId(aggregatedData[0].id);
            }
        }
    }, [aggregatedData]);

    const handleAiSearch = (filteredCars: Car[]) => {
        setDisplayCars(filteredCars);
    };

    const handleClear = () => {
        setFilters({ country: "all" });
        setDisplayCars(initialCars);
    };

    const title = filters.country !== "all" ? `${filters.country} Listings` : "Explore World Cars";
    const description = filters.country !== "all"
        ? `Direct from top ${filters.country} platforms.`
        : "Discover the best deals on cars across the EU.";

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-72 shrink-0">
                <Sidebar
                    onAiSearch={handleAiSearch}
                    onFilter={setFilters}
                    onClear={handleClear}
                />
            </aside>

            <div className="flex-1">
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex justify-between items-center">
                        <div className="flex flex-col gap-1">
                            <h1 className="text-3xl font-bold tracking-tight text-foreground transition-all duration-500">
                                {title}
                            </h1>
                            <p className="text-muted-foreground text-sm">
                                {description}
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <Button asChild variant="outline" className="gap-2 border-primary/20 hover:border-primary/50">
                                <Link href="/scout">
                                    <LayoutDashboard className="h-4 w-4" />
                                    My Scouts
                                </Link>
                            </Button>
                            <CreateSpotModal />
                        </div>
                    </div>
                </div>

                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                            <Skeleton key={i} className="h-[400px] w-full rounded-xl" />
                        ))}
                    </div>
                ) : (
                    <CarGrid
                        cars={displayCars}
                        selectedCarId={selectedCarId}
                        onSelect={setSelectedCarId}
                    />
                )}
            </div>

            <aside className="w-full lg:w-72 shrink-0 space-y-8">
                <SmartSidebar currentCarId={selectedCarId} />
            </aside>
        </div>
    );
}

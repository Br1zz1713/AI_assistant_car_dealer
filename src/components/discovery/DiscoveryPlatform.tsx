"use client";

import { useState } from "react";
import { Sidebar } from "@/components/filters/Sidebar";
import { CarGrid } from "@/components/cars/CarGrid";
import { SmartSidebar } from "@/components/layout/SmartSidebar";
import { Car } from "@/types/car";

interface DiscoveryPlatformProps {
    initialCars: Car[];
}

export function DiscoveryPlatform({ initialCars }: DiscoveryPlatformProps) {
    const [cars, setCars] = useState<Car[]>(initialCars);
    const [selectedCarId, setSelectedCarId] = useState<string | undefined>(initialCars[0]?.id);

    const handleAiSearch = (filteredCars: Car[]) => {
        setCars(filteredCars);
    };

    const handleClear = () => {
        setCars(initialCars);
    };

    return (
        <div className="flex flex-col lg:flex-row gap-8">
            <aside className="w-full lg:w-72 shrink-0">
                <Sidebar onAiSearch={handleAiSearch} onClear={handleClear} />
            </aside>

            <div className="flex-1">
                <div className="flex flex-col gap-4 mb-8">
                    <div className="flex justify-between items-baseline">
                        <h1 className="text-3xl font-bold tracking-tight">Available Listings</h1>
                        <span className="text-sm text-muted-foreground">{cars.length} cars found</span>
                    </div>
                    <p className="text-muted-foreground">
                        Discover the best deals on cars across the European Union.
                    </p>
                </div>
                <CarGrid cars={cars} />
            </div>

            <aside className="w-full lg:w-72 shrink-0 space-y-8">
                <SmartSidebar currentCarId={selectedCarId} />
            </aside>
        </div>
    );
}

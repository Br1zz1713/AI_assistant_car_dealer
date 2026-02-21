"use client";

import { useState } from "react";
import { Sidebar } from "@/components/filters/Sidebar";
import { CarGrid } from "@/components/cars/CarGrid";
import { mockCars } from "@/lib/mockData";
import { Car } from "@/types/car";

export default function HomePage() {
  const [cars, setCars] = useState<Car[]>(mockCars);

  const handleAiSearch = (filteredCars: Car[]) => {
    setCars(filteredCars);
  };

  const handleClear = () => {
    setCars(mockCars);
  };

  return (
    <main className="container py-8 px-4 md:px-0">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-80 shrink-0">
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
      </div>
    </main>
  );
}

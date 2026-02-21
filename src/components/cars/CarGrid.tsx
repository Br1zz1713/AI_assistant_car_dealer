import { CarCard } from "./CarCard";
import { Car } from "@/types/car";

interface CarGridProps {
    cars: Car[];
    selectedCarId?: string;
    onSelect?: (id: string) => void;
}

export function CarGrid({ cars, selectedCarId, onSelect }: CarGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {cars.length > 0 ? (
                cars.map((car) => (
                    <CarCard
                        key={car.id}
                        car={car}
                        isSelected={car.id === selectedCarId}
                        onSelect={onSelect}
                    />
                ))
            ) : (
                <div className="col-span-full text-center py-12">
                    <p className="text-muted-foreground italic">No cars found matching your criteria.</p>
                </div>
            )}
        </div>
    );
}

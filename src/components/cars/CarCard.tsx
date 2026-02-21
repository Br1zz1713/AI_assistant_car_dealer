"use client";

import Image from "next/image";
import { MapPin, Fuel, Calendar, Gauge, Heart } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car } from "@/types/car";
import { toggleFavorite } from "@/actions/favorites";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CarCardProps {
    car: Car;
    isFavorited?: boolean;
}

export function CarCard({ car, isFavorited: initialIsFavorited = false }: CarCardProps) {
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);

    const handleToggleFavorite = async () => {
        try {
            setIsFavorited(!isFavorited);
            await toggleFavorite(car.id);
        } catch (error) {
            console.error(error);
            setIsFavorited(isFavorited); // revert on error
        }
    };

    return (
        <Card className="overflow-hidden group hover:shadow-lg transition-shadow duration-300">
            <div className="relative aspect-video overflow-hidden">
                <Image
                    src={car.image}
                    alt={`${car.brand} ${car.model}`}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="bg-background/80 backdrop-blur-sm hover:bg-background/90"
                        onClick={handleToggleFavorite}
                    >
                        <Heart className={cn("h-5 w-5", isFavorited && "fill-destructive text-destructive")} />
                    </Button>
                    <Badge className="bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/80">
                        {car.country}
                    </Badge>
                </div>
            </div>
            <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-bold text-lg leading-none">{car.brand}</h3>
                        <p className="text-muted-foreground">{car.model}</p>
                    </div>
                    <p className="font-bold text-xl text-primary">€{car.price.toLocaleString()}</p>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-2 grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{car.year}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Gauge className="h-4 w-4" />
                    <span>{car.mileage.toLocaleString()} km</span>
                </div>
                <div className="flex items-center gap-2">
                    <Fuel className="h-4 w-4" />
                    <span>{car.fuel}</span>
                </div>
                <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>{car.country}</span>
                </div>
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button className="w-full">View Details</Button>
            </CardFooter>
        </Card>
    );
}

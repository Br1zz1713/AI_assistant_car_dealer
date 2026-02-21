"use client";

import Image from "next/image";
import { MapPin, Fuel, Calendar, Gauge, Heart, Sparkles } from "lucide-react";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car } from "@/types/car";
import { toggleFavorite } from "@/actions/favorites";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ValueBadge } from "./ValueBadge";
import { Skeleton } from "@/components/ui/skeleton";

interface CarCardProps {
    car: Car;
    isFavorited?: boolean;
}

export function CarCard({ car, isFavorited: initialIsFavorited = false }: CarCardProps) {
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);

    const { data: insights, isLoading: isInsightsLoading } = useQuery({
        queryKey: ["insights", car.id],
        queryFn: async () => {
            const res = await fetch("/api/ai/insights", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ carId: car.id }),
            });
            const data = await res.json();
            return data.insights;
        },
    });

    const handleToggleFavorite = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
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
                <div className="absolute top-2 right-2 flex flex-col gap-2 items-end">
                    <div className="flex gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            className="bg-background/80 backdrop-blur-sm hover:bg-background/90 h-8 w-8"
                            onClick={handleToggleFavorite}
                        >
                            <Heart className={cn("h-4 w-4", isFavorited && "fill-destructive text-destructive")} />
                        </Button>
                        <Badge className="bg-background/80 backdrop-blur-sm text-foreground hover:bg-background/80 border-none">
                            {car.country}
                        </Badge>
                    </div>
                    {isInsightsLoading ? (
                        <Skeleton className="h-6 w-24 bg-background/50" />
                    ) : insights && (
                        <ValueBadge score={insights.valueScore} status={insights.marketStatus} />
                    )}
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
            <CardContent className="p-4 pt-2 space-y-3">
                <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3" />
                        <span>{car.year}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Gauge className="h-3 w-3" />
                        <span>{car.mileage.toLocaleString()} km</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Fuel className="h-3 w-3" />
                        <span>{car.fuel}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin className="h-3 w-3" />
                        <span>{car.country}</span>
                    </div>
                </div>

                {insights?.summary && (
                    <div className="pt-2 border-t text-[11px] text-muted-foreground italic flex gap-2">
                        <Sparkles className="h-3 w-3 shrink-0 text-primary" />
                        <p className="line-clamp-2">{insights.summary}</p>
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0">
                <Button className="w-full h-9">View Details</Button>
            </CardFooter>
        </Card>
    );
}

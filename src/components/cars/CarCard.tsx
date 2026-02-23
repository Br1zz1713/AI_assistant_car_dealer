"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
    Fuel, Calendar, Gauge, Heart, Sparkles,
    ExternalLink, Cog, ChevronLeft, ChevronRight
} from "lucide-react";
import { SourceBadge } from "./SourceBadge";
import { ImageCarousel } from "./ImageCarousel";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Car } from "@/types/car";
import { toggleFavorite } from "@/actions/favorites";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ValueBadge } from "./ValueBadge";
import { Skeleton } from "@/components/ui/skeleton";

interface CarCardProps {
    car: Car;
    isFavorited?: boolean;
    isSelected?: boolean;
    onSelect?: (id: string) => void;
}

export function CarCard({ car, isFavorited: initialIsFavorited = false, isSelected, onSelect }: CarCardProps) {
    const [isMounted, setIsMounted] = useState(false);
    const [isFavorited, setIsFavorited] = useState(initialIsFavorited);
    const [isGalleryOpen, setIsGalleryOpen] = useState(false);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    const allImages = car.images || [];

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

    const handleOpenGallery = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsGalleryOpen(true);
    };

    const nextImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
    };

    const prevImage = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
    };

    return (
        <>
            <Card
                className={cn(
                    "overflow-hidden group hover:shadow-lg transition-all duration-300 cursor-pointer flex flex-col h-full",
                    isSelected ? "ring-2 ring-primary border-primary" : "border-border"
                )}
                onClick={() => onSelect?.(car.id)}
            >
                <div className="relative aspect-video overflow-hidden bg-muted group/image">
                    <Image
                        src={allImages[currentImageIndex]}
                        alt={`${car.brand} ${car.model}`}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                        onClick={handleOpenGallery}
                    />

                    {/* Inline Carousel Controls */}
                    {allImages.length > 1 && (
                        <div className="absolute inset-0 flex items-center justify-between p-2 opacity-0 group-hover/image:opacity-100 transition-opacity">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                                onClick={prevImage}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-black/50 text-white hover:bg-black/70"
                                onClick={nextImage}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Overlay Badges */}
                    <div className="absolute top-2 left-2 flex flex-col gap-2">
                        <SourceBadge platform={car.sourcePlatform} />
                    </div>

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

                    <div className="absolute bottom-2 left-2 flex gap-1">
                        {allImages.map((_, i) => (
                            <div
                                key={i}
                                className={cn(
                                    "h-1 w-4 rounded-full transition-all",
                                    i === currentImageIndex ? "bg-white" : "bg-white/40"
                                )}
                            />
                        ))}
                    </div>

                    {allImages.length > 1 && (
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded backdrop-blur-sm">
                            {currentImageIndex + 1} / {allImages.length}
                        </div>
                    )}
                </div>

                <CardHeader className="p-4 pb-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <h3 className="font-bold text-lg leading-none">{car.brand}</h3>
                            <p className="text-xs text-muted-foreground mt-1">{car.model}</p>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-xl text-primary leading-none">
                                €{isMounted ? car.price_eur.toLocaleString() : car.price_eur}
                            </p>
                            <p className="text-[10px] text-muted-foreground mt-1 uppercase font-semibold">{car.location}</p>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-4 pt-2 space-y-3 flex-1">
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-3.5 w-3.5 text-primary/70" />
                            <span>{car.year}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Gauge className="h-3.5 w-3.5 text-primary/70" />
                            <span>{isMounted ? car.mileage.toLocaleString() : car.mileage} km</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Fuel className="h-3.5 w-3.5 text-primary/70" />
                            <span>{car.fuel}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Cog className="h-3.5 w-3.5 text-primary/70" />
                            <span>{car.gearbox}</span>
                        </div>
                    </div>

                    {insights?.summary && (
                        <div className="pt-3 border-t text-[11px] text-muted-foreground leading-relaxed flex gap-2">
                            <Sparkles className="h-3.5 w-3.5 shrink-0 text-primary mt-0.5" />
                            <p className="line-clamp-3">{insights.summary}</p>
                        </div>
                    )}
                </CardContent>

                <CardFooter className="p-4 pt-0 gap-2">
                    <Button
                        className="flex-1 h-9 font-semibold transition-all group/btn"
                        variant={isSelected ? "default" : "outline"}
                    >
                        {isSelected ? "Currently Viewing" : "Analyze Specs"}
                        <Sparkles className="ml-2 h-3 w-3 opacity-0 group-hover/btn:opacity-100 transition-opacity" />
                    </Button>
                    <Button
                        variant="secondary"
                        className="h-9 px-3 gap-2 font-semibold bg-secondary/50 hover:bg-secondary"
                        asChild
                        onClick={(e) => e.stopPropagation()}
                    >
                        <a href={car.sourceUrl} target="_blank" rel="noopener noreferrer">
                            <span className="hidden sm:inline">Original</span>
                            <ExternalLink className="h-4 w-4" />
                        </a>
                    </Button>
                </CardFooter>
            </Card>

            <ImageCarousel
                images={allImages}
                isOpen={isGalleryOpen}
                onOpenChange={setIsGalleryOpen}
                title={`${car.brand} ${car.model} (${car.year})`}
            />
        </>
    );
}

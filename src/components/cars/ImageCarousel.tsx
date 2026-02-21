"use client";

import * as React from "react";
import Image from "next/image";
import {
    Carousel,
    CarouselContent,
    CarouselItem,
    CarouselNext,
    CarouselPrevious,
} from "@/components/ui/carousel";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";

interface ImageCarouselProps {
    images: string[];
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    title: string;
}

export function ImageCarousel({ images, isOpen, onOpenChange, title }: ImageCarouselProps) {
    if (!images || images.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none shadow-2xl">
                <DialogHeader className="absolute top-4 left-4 z-50 p-0 text-left">
                    <DialogTitle className="text-white text-lg font-bold drop-shadow-md">
                        {title}
                    </DialogTitle>
                </DialogHeader>

                <div className="relative w-full aspect-video flex items-center justify-center p-8">
                    <Carousel className="w-full max-w-3xl">
                        <CarouselContent>
                            {images.map((img, index) => (
                                <CarouselItem key={index} className="flex items-center justify-center">
                                    <div className="relative w-full aspect-video">
                                        <Image
                                            src={img}
                                            alt={`${title} - image ${index + 1}`}
                                            fill
                                            className="object-contain"
                                            priority={index === 0}
                                        />
                                    </div>
                                </CarouselItem>
                            ))}
                        </CarouselContent>
                        {images.length > 1 && (
                            <>
                                <CarouselPrevious className="left-4 bg-white/20 hover:bg-white/40 border-none text-white" />
                                <CarouselNext className="right-4 bg-white/20 hover:bg-white/40 border-none text-white" />
                            </>
                        )}
                    </Carousel>
                </div>

                <div className="absolute bottom-4 left-0 right-0 text-center z-50">
                    <p className="text-white/60 text-xs">
                        Click outside or press ESC to close
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

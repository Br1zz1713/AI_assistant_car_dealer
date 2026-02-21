"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Radar, Save, Globe } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

const COUNTRIES = ["Romania", "Poland", "Bulgaria", "Moldova"];

export function CreateSpotModal() {
    const [open, setOpen] = useState(false);
    const [brand, setBrand] = useState("");
    const [model, setModel] = useState("");
    const [priceMax, setPriceMax] = useState("");
    const [selectedCountries, setSelectedCountries] = useState<string[]>(["Romania"]);
    const [isSaving, setIsSaving] = useState(false);

    const queryClient = useQueryClient();

    const handleSaveSpot = async () => {
        setIsSaving(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Auth required");

            const { error } = await supabase.from("spotting_subscriptions").insert({
                user_id: user.id,
                filters: {
                    brand,
                    model: model || "all",
                    price_max: Number(priceMax),
                    countries: selectedCountries
                }
            });

            if (error) throw error;

            queryClient.invalidateQueries({ queryKey: ["spotting_subscriptions"] });
            setOpen(false);
            // Reset form
            setBrand("");
            setModel("");
            setPriceMax("");
        } catch (error) {
            console.error("Failed to save spot:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2 bg-primary/90 hover:bg-primary shadow-lg shadow-primary/20">
                    <Radar className="h-4 w-4" />
                    Set Up Car Scout
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md bg-background/95 backdrop-blur-md border-primary/20">
                <DialogHeader>
                    <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                        <Radar className="h-6 w-6 text-primary animate-pulse" />
                    </div>
                    <DialogTitle className="text-xl font-bold">New Auto-Spotter</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        Automated scanning of regional markets for your perfect match.
                    </p>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Brand</label>
                            <Input
                                placeholder="e.g. BMW"
                                value={brand}
                                onChange={(e) => setBrand(e.target.value)}
                                className="bg-background/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Model</label>
                            <Input
                                placeholder="e.g. M3"
                                value={model}
                                onChange={(e) => setModel(e.target.value)}
                                className="bg-background/50"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Budget Max (€)</label>
                        <Input
                            type="number"
                            placeholder="35000"
                            value={priceMax}
                            onChange={(e) => setPriceMax(e.target.value)}
                            className="bg-background/50"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tracking Countries</label>
                        <div className="flex flex-wrap gap-2 pt-1">
                            {COUNTRIES.map(c => (
                                <button
                                    key={c}
                                    onClick={() => {
                                        if (selectedCountries.includes(c)) {
                                            setSelectedCountries(selectedCountries.filter(sc => sc !== c));
                                        } else {
                                            setSelectedCountries([...selectedCountries, c]);
                                        }
                                    }}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-[10px] font-bold transition-all border",
                                        selectedCountries.includes(c)
                                            ? "bg-primary text-primary-foreground border-primary"
                                            : "bg-background text-muted-foreground border-muted-foreground/30 hover:border-primary/50"
                                    )}
                                >
                                    <Globe className="h-3 w-3 inline mr-1" />
                                    {c}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t border-primary/10">
                    <Button
                        onClick={handleSaveSpot}
                        disabled={!brand || !priceMax || isSaving}
                        className="w-full gap-2 font-bold"
                    >
                        <Save className="h-4 w-4" />
                        {isSaving ? "Initializing Scout..." : "Start Tracking Market"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

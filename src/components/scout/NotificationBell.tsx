"use client";

import { useState, useEffect } from "react";
import { Bell, Sparkles, ExternalLink, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Notification {
    id: string;
    title: string;
    summary?: string;
    source_url: string;
    price: number;
    brand: string;
    model: string;
    country: string;
    source_platform: string;
}

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Suppress unused warning
    void isLoading;

    const fetchNotifications = async () => {
        setIsLoading(true);
        try {
            const { data, error } = await supabase
                .from("listings")
                .select("*")
                .eq("is_new_match", true)
                .order("created_at", { ascending: false })
                .limit(10);

            if (error) throw error;

            // Generate summaries for new notifications
            const enriched = await Promise.all(data.map(async (n) => {
                const res = await fetch("/api/spotting/summary", {
                    method: "POST",
                    body: JSON.stringify({
                        brand: n.brand,
                        model: n.model,
                        location: n.specs?.location || n.country,
                        price: n.price
                    })
                });
                const { summary } = await res.json();
                return { ...n, summary };
            }));

            setNotifications(enriched);
        } catch (error) {
            console.error("Fetch notifications error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const markAsRead = async (id: string) => {
        try {
            await supabase
                .from("listings")
                .update({ is_new_match: false })
                .eq("id", id);

            setNotifications(notifications.filter(n => n.id !== id));
        } catch (error) {
            console.error("Mark as read error:", error);
        }
    };

    useEffect(() => {
        fetchNotifications();
        setIsMounted(true);

        // Listen for new matches in real-time
        const channel = supabase
            .channel('new-listings')
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'listings',
                filter: 'is_new_match=eq.true'
            }, () => {
                fetchNotifications();
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    if (!isMounted) return null;

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="relative hover:bg-primary/10 rounded-full transition-all group">
                    <Bell className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    {notifications.length > 0 && (
                        <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 bg-destructive text-[10px] font-bold border-2 border-background animate-bounce">
                            {notifications.length}
                        </Badge>
                    )}
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[400px] h-[500px] flex flex-col bg-background/95 backdrop-blur-md border-primary/20">
                <DialogHeader>
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        <DialogTitle className="text-xl font-bold">Market Discoveries</DialogTitle>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1 mt-4">
                    {notifications.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full py-20 opacity-40">
                            <Bell className="h-12 w-12 mb-4" />
                            <p className="font-bold uppercase tracking-widest text-xs">No new matches found</p>
                        </div>
                    ) : (
                        <div className="space-y-4 pr-4">
                            {notifications.map((n) => (
                                <div key={n.id} className="group relative bg-muted/30 p-4 rounded-2xl border border-primary/5 hover:border-primary/20 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <Badge variant="outline" className="text-[10px] uppercase font-black tracking-tighter border-primary/20 bg-primary/5 text-primary">
                                            {n.country}
                                        </Badge>
                                        <button
                                            onClick={() => markAsRead(n.id)}
                                            className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </div>
                                    <p className="text-sm font-bold text-foreground leading-tight mb-2">
                                        {n.summary || `${n.brand} ${n.model} for €${n.price.toLocaleString()}`}
                                    </p>
                                    <div className="flex items-center justify-between mt-3">
                                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                                            via {n.source_platform || "Market"}
                                        </span>
                                        <a
                                            href={n.source_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1 text-[10px] font-bold text-primary hover:underline border border-primary/20 px-2 py-1 rounded-full bg-primary/5"
                                        >
                                            <ExternalLink className="h-3 w-3" />
                                            View Listing
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

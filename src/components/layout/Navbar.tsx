"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, User, Menu, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/utils/supabase/client";
import { signInWithGithub, signOut } from "@/actions/auth";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { NotificationBell } from "../scout/NotificationBell";

export function Navbar() {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const supabase = createClient();

    useEffect(() => {
        if (!supabase) return;

        const getUser = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);
            } catch (error) {
                console.error("Auth initialization failed:", error);
            }
        };
        getUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user ?? null);
            }
        );

        return () => subscription.unsubscribe();
    }, [supabase]);

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between">
                <div className="flex items-center gap-2">
                    <Link href="/" className="flex items-center gap-2">
                        <span className="text-2xl font-bold tracking-tight text-primary">
                            AUTO-HUNTER <span className="text-muted-foreground font-normal">EU</span>
                        </span>
                    </Link>
                </div>

                <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
                    <Link href="/" className="transition-colors hover:text-primary">
                        Buy
                    </Link>
                    <Link href="/" className="transition-colors hover:text-primary">
                        Sell
                    </Link>
                    <Link href="/" className="transition-colors hover:text-primary">
                        AI Search
                    </Link>
                    <Link href="/" className="transition-colors hover:text-primary">
                        About
                    </Link>
                </nav>

                <div className="flex items-center gap-4">
                    <NotificationBell />
                    <Button variant="ghost" size="icon" className="hidden md:flex">
                        <Search className="h-4 w-4" />
                    </Button>

                    {user ? (
                        <div className="flex items-center gap-4">
                            <span className="text-sm text-muted-foreground hidden lg:inline-block">
                                {user.email}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                                onClick={() => signOut()}
                            >
                                <LogOut className="h-4 w-4" />
                                Sign Out
                            </Button>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => signInWithGithub()}
                        >
                            <User className="h-4 w-4" />
                            Sign In
                        </Button>
                    )}

                    <Button variant="ghost" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                    </Button>
                </div>
            </div>
        </header>
    );
}

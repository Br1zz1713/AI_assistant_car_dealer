import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SourceBadgeProps {
    platform: string;
    className?: string;
}

const platformColors: Record<string, string> = {
    "Autovit": "bg-[#f58220] hover:bg-[#f58220]/90 text-white",
    "Otomoto": "bg-[#ff4612] hover:bg-[#ff4612]/90 text-white",
    "Mobile.bg": "bg-[#1d4ed8] hover:bg-[#1d4ed8]/90 text-white",
    "999.md": "bg-[#ffbd00] hover:bg-[#ffbd00]/90 text-black",
    "Mobile.de": "bg-[#fbbf24] hover:bg-[#fbbf24]/90 text-black",
    "OLX": "bg-[#3a77ff] hover:bg-[#3a77ff]/90 text-white",
};

export function SourceBadge({ platform, className }: SourceBadgeProps) {
    const colorClass = platformColors[platform] || "bg-muted text-muted-foreground";

    return (
        <Badge className={cn("font-bold text-[10px] uppercase tracking-wider", colorClass, className)}>
            {platform}
        </Badge>
    );
}

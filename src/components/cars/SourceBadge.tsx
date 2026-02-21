import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface SourceBadgeProps {
    platform: string;
    className?: string;
}

const platformColors: Record<string, string> = {
    "Autovit": "bg-[#007bff] hover:bg-[#007bff]/90 text-white", // Blue
    "Autovit.ro": "bg-[#007bff] hover:bg-[#007bff]/90 text-white", // Blue
    "Otomoto": "bg-[#ff4612] hover:bg-[#ff4612]/90 text-white",
    "Mobile.bg": "bg-[#1d4ed8] hover:bg-[#1d4ed8]/90 text-white",
    "999.md": "bg-[#ff8c00] hover:bg-[#ff8c00]/90 text-white", // Orange
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

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TrendingUp, Minus, TrendingDown } from "lucide-react";

interface ValueBadgeProps {
    score: number;
    status: "Great Deal" | "Fair Price" | "Overpriced";
}

export function ValueBadge({ score, status }: ValueBadgeProps) {
    const getColors = () => {
        switch (status) {
            case "Great Deal":
                return "bg-green-500/10 text-green-600 border-green-200 hover:bg-green-500/20";
            case "Fair Price":
                return "bg-yellow-500/10 text-yellow-600 border-yellow-200 hover:bg-yellow-500/20";
            case "Overpriced":
                return "bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20";
            default:
                return "";
        }
    };

    const getIcon = () => {
        switch (status) {
            case "Great Deal":
                return <TrendingUp className="h-3 w-3" />;
            case "Fair Price":
                return <Minus className="h-3 w-3" />;
            case "Overpriced":
                return <TrendingDown className="h-3 w-3" />;
        }
    };

    return (
        <Badge variant="outline" className={cn("flex items-center gap-1 font-bold", getColors())}>
            {getIcon()}
            {score}% - {status}
        </Badge>
    );
}

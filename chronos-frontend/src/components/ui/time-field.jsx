import * as React from "react";
import { Clock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function TimeField() {
    const [time, setTime] = React.useState("");

    const handleTimeChange = (e) => {
        setTime(e.target.value);
    };

    return (
        <div className="relative">
            <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
            <Input
                type="time"
                value={time}
                onChange={handleTimeChange}
                className={cn("pl-10")}
            />
        </div>
    );
}

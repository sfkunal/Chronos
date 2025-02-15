import React from 'react';
import { Calendar } from '@/components/ui/calendar';
import Preferences from '@/components/Preferences';
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export function Sidebar({ className, date, setDate }) {
    return (
        <ScrollArea className={cn("h-full", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3">
                    <div className="space-y-1">
                        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                            Calendar
                        </h2>
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            className="rounded-md border"
                        />
                    </div>
                </div>
                <div className="px-3">
                    <div className="space-y-1">
                        <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                            Preferences
                        </h2>
                        <div className="rounded-md border bg-card">
                            <Preferences />
                        </div>
                    </div>
                </div>
            </div>
        </ScrollArea>
    );
}

export {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
    SidebarSeparator,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarGroupContent,
} from "@/components/ui/sidebar-nav"; 
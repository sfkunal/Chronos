import * as React from "react"
import { cn } from "@/lib/utils"

export function Sidebar({ className, children, ...props }) {
    return (
        <aside className={cn("flex flex-col space-y-4", className)} {...props}>
            {children}
        </aside>
    );
}

export function SidebarContent({ className, children, ...props }) {
    return (
        <div className={cn("px-3 py-2 flex-1", className)} {...props}>
            {children}
        </div>
    );
}

export function SidebarHeader({ className, children, ...props }) {
    return (
        <div className={cn("px-3 py-2", className)} {...props}>
            {children}
        </div>
    );
}

export function SidebarFooter({ className, children, ...props }) {
    return (
        <div className={cn("px-3 py-2 mt-auto", className)} {...props}>
            {children}
        </div>
    );
}

export function SidebarMenu({ className, children, ...props }) {
    return (
        <div className={cn("space-y-3", className)} {...props}>
            {children}
        </div>
    );
}

export function SidebarMenuItem({ className, children, ...props }) {
    return (
        <div className={cn("", className)} {...props}>
            {children}
        </div>
    );
}

export function SidebarMenuButton({ className, children, ...props }) {
    return (
        <button className={cn("flex items-center gap-2", className)} {...props}>
            {children}
        </button>
    );
}

export function SidebarRail({ className, ...props }) {
    return (
        <div className={cn("border-l", className)} {...props} />
    );
}

export function SidebarSeparator({ className, ...props }) {
    return (
        <hr className={cn("border-t my-4", className)} {...props} />
    );
}

export function SidebarGroup({ className, children, ...props }) {
    return (
        <div className={cn("space-y-2", className)} {...props}>
            {children}
        </div>
    );
}

export function SidebarGroupLabel({ className, children, ...props }) {
    return (
        <h3 className={cn("text-sm font-medium", className)} {...props}>
            {children}
        </h3>
    );
}

export function SidebarGroupContent({ className, children, ...props }) {
    return (
        <div className={cn("space-y-1", className)} {...props}>
            {children}
        </div>
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
} 
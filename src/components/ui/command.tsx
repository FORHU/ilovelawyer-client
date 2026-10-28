"use client";

import type { ComponentProps } from "react";
import { Command as CommandPrimitive } from "cmdk";
import { Check, Search } from "lucide-react";
import { cn } from "@/lib/cn";

// shadcn's Command (cmdk), restyled with this app's tokens instead of shadcn's theme variables, which
// would clash with ours (--color-muted is a text colour here). No CommandDialog: modals are Modal.

export function Command({ className, ...props }: ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn("flex w-full flex-col overflow-hidden rounded-input border border-line-input bg-white text-ink transition-colors focus-within:border-ink-2", className)}
      {...props}
    />
  );
}

export function CommandInput({ className, ...props }: ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="flex items-center gap-2 border-b border-line px-3.5">
      <Search className="h-4 w-4 shrink-0 text-muted" aria-hidden="true" />
      <CommandPrimitive.Input
        data-slot="command-input"
        className={cn("h-12 w-full bg-transparent text-[15px] text-ink outline-none disabled:cursor-not-allowed disabled:opacity-50", className)}
        {...props}
      />
    </div>
  );
}

export function CommandList({ className, ...props }: ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn("max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto p-1 outline-none", className)}
      {...props}
    />
  );
}

export function CommandEmpty({ className, ...props }: ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty data-slot="command-empty" className={cn("py-6 text-center text-[13px] text-muted", className)} {...props} />;
}

export function CommandGroup({ className, ...props }: ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      data-slot="command-group"
      className={cn(
        "overflow-hidden **:[[cmdk-group-heading]]:px-3 **:[[cmdk-group-heading]]:py-2 **:[[cmdk-group-heading]]:text-xs **:[[cmdk-group-heading]]:font-medium **:[[cmdk-group-heading]]:text-muted",
        className,
      )}
      {...props}
    />
  );
}

export function CommandSeparator({ className, ...props }: ComponentProps<typeof CommandPrimitive.Separator>) {
  return <CommandPrimitive.Separator data-slot="command-separator" className={cn("my-1 h-px bg-line", className)} {...props} />;
}

/** `data-checked` shows the tick and the chip background, for a list that picks several; the row
 * under the keyboard or pointer gets a lighter tint. cmdk writes data-selected="false" on every
 * other row, so the variants match the value, not the attribute. */
export function CommandItem({ className, children, ...props }: ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex cursor-pointer items-center gap-2 rounded-[10px] px-3 py-2.5 text-[14px] outline-none select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-chip/50 data-[checked=true]:bg-chip",
        className,
      )}
      {...props}
    >
      {children}
      <Check className="ml-auto h-4 w-4 shrink-0 text-ink opacity-0 group-data-[checked=true]/command-item:opacity-100" aria-hidden="true" />
    </CommandPrimitive.Item>
  );
}

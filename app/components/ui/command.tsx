"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { HugeiconsIcon } from "@hugeicons/react"
import { SearchIcon, Tick02Icon } from "@hugeicons/core-free-icons"

import { cn } from "@/lib/utils"

function Command({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive>) {
  return (
    <CommandPrimitive
      data-slot="command"
      className={cn(
        "flex size-full flex-col overflow-hidden rounded-2xl bg-popover p-1 text-popover-foreground",
        className
      )}
      {...props}
    />
  )
}

function CommandInput({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div data-slot="command-input-wrapper" className="p-1 pb-0">
      <div className="relative">
        <HugeiconsIcon
          icon={SearchIcon}
          className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 shrink-0 text-muted-foreground"
        />
        <CommandPrimitive.Input
          data-slot="command-input"
          className={cn(
            "h-11 w-full rounded-xl border border-input bg-input/30 pl-9 pr-3 text-base outline-hidden placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50",
            className
          )}
          {...props}
        />
      </div>
    </div>
  )
}

function CommandList({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.List>) {
  return (
    <CommandPrimitive.List
      data-slot="command-list"
      className={cn(
        "max-h-72 scroll-py-1 overflow-x-hidden overflow-y-auto outline-none",
        className
      )}
      {...props}
    />
  )
}

function CommandEmpty({
  className,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return (
    <CommandPrimitive.Empty
      data-slot="command-empty"
      className={cn("py-6 text-center text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

function CommandItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      data-slot="command-item"
      className={cn(
        "group/command-item relative flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-base outline-hidden select-none data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50 data-[selected=true]:bg-muted data-[selected=true]:text-foreground",
        className
      )}
      {...props}
    >
      {children}
      <HugeiconsIcon
        icon={Tick02Icon}
        className="ml-auto size-4 shrink-0 opacity-0 group-data-[selected=true]/command-item:opacity-100"
      />
    </CommandPrimitive.Item>
  )
}

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
}
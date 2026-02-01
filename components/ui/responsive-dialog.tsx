"use client"

import * as React from "react"
import { useMediaQuery } from "@/hooks/use-media-query"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer"

import { cn } from "@/lib/utils"

interface BaseProps {
  children: React.ReactNode
}

interface RootProps extends BaseProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

type ResponsiveDialogProps = RootProps

const ResponsiveDialogContext = React.createContext<{ isDesktop: boolean }>({
  isDesktop: true,
})

export function ResponsiveDialog({ children, ...props }: ResponsiveDialogProps) {
  const isDesktop = useMediaQuery("(min-width: 768px)")
  const ContextProvider = ResponsiveDialogContext.Provider

  if (isDesktop) {
    return (
      <ContextProvider value={{ isDesktop }}>
        <Dialog {...props}>{children}</Dialog>
      </ContextProvider>
    )
  }

  return (
    <ContextProvider value={{ isDesktop }}>
      <Drawer repositionInputs={false} {...props}>{children}</Drawer>
    </ContextProvider>
  )
}

export function ResponsiveDialogTrigger({ className, children, ...props }: React.ComponentProps<typeof DialogTrigger>) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext)
  if (isDesktop) {
    return <DialogTrigger className={className} {...props}>{children}</DialogTrigger>
  }
  return <DrawerTrigger className={className} {...props}>{children}</DrawerTrigger>
}

export function ResponsiveDialogContent({ className, children, ...props }: React.ComponentProps<typeof DialogContent>) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext)
  if (isDesktop) {
    return <DialogContent className={className} {...props}>{children}</DialogContent>
  }
  return (
    <DrawerContent className={cn("px-4 pb-4 w-full sm:max-w-full", className)} {...props}>
      {children}
    </DrawerContent>
  )
}

export function ResponsiveDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext)
  if (isDesktop) {
    return <DialogHeader className={className} {...props} />
  }
  // Remove default padding as it's now handled by Content
  return <DrawerHeader className={cn("p-0 text-left", className)} {...props} />
}

export function ResponsiveDialogTitle({ className, ...props }: React.ComponentProps<typeof DialogTitle>) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext)
  if (isDesktop) {
    return <DialogTitle className={className} {...props} />
  }
  return <DrawerTitle className={className} {...props} />
}

export function ResponsiveDialogDescription({ className, ...props }: React.ComponentProps<typeof DialogDescription>) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext)
  if (isDesktop) {
    return <DialogDescription className={className} {...props} />
  }
  return <DrawerDescription className={className} {...props} />
}

export function ResponsiveDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext)
  if (isDesktop) {
    return <DialogFooter className={className} {...props} />
  }
  // Remove default padding and ensure consistent spacing
  return <DrawerFooter className={cn("p-0 pt-2", className)} {...props} />
}

export function ResponsiveDialogClose({ className, ...props }: React.ComponentProps<typeof DialogClose>) {
  const { isDesktop } = React.useContext(ResponsiveDialogContext)
  if (isDesktop) {
    return <DialogClose className={className} {...props} />
  }
  return <DrawerClose className={className} {...props} />
}

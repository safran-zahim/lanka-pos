import { Group, Panel, Separator } from "react-resizable-panels";

import { cn } from "@/lib/utils";

const ResizablePanelGroup = ({ className, ...props }: React.ComponentProps<typeof Group>) => (
  <Group className={cn("flex h-full w-full data-[group-orientation=vertical]:flex-col", className)} {...props} />
);

const ResizablePanel = Panel;

const ResizableHandle = ({ withHandle, className, ...props }: React.ComponentProps<typeof Separator> & { withHandle?: boolean }) => (
  <Separator
    className={cn(
      "relative flex w-px items-center justify-center bg-gray-200 after:absolute after:inset-y-0 after:left-1/2 after:w-1 after:-translate-x-1/2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-600 dark:bg-gray-700 data-[group-orientation=vertical]:h-px data-[group-orientation=vertical]:w-full",
      className,
    )}
    {...props}
  >
    {withHandle && <div className="z-10 flex h-4 w-3 items-center justify-center rounded-sm border border-gray-300 bg-white dark:border-gray-600 dark:bg-gray-800" />}
  </Separator>
);

export { ResizablePanelGroup, ResizablePanel, ResizableHandle };

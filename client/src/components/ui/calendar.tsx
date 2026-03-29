import * as React from "react";
import { DayPicker } from "react-day-picker";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("rounded-md border border-gray-200 p-3 dark:border-gray-700", className)}
      classNames={{
        months: "flex flex-col sm:flex-row gap-3",
        month: "space-y-2",
        caption: "flex justify-center relative items-center",
        caption_label: "text-sm font-medium",
        nav: "space-x-1 flex items-center",
        nav_button: "h-7 w-7 bg-transparent p-0 opacity-70 hover:opacity-100",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse",
        head_row: "flex",
        head_cell: "text-gray-500 rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-1",
        cell: "h-9 w-9 text-center text-sm p-0 relative",
        day: "h-9 w-9 p-0 font-normal rounded-md hover:bg-accent hover:text-accent-foreground",
        day_selected: "bg-primary-600 text-white hover:bg-primary-600",
        day_today: "bg-gray-100 dark:bg-gray-800",
        day_outside: "text-gray-400",
        day_disabled: "text-gray-300",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation }) =>
          orientation === "left" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />,
      }}
      {...props}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };

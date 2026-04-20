import React from "react";

const CalendarSkeleton = () => {
  const timeSlots = Array.from({ length: 13 }, (_, i) => i); // 8am-9pm
  const days = ["M", "T", "W", "H", "F", "S"];

  return (
    <div className="h-full w-full overflow-hidden rounded-lg border bg-card p-2">
      {/* Header row */}
      <div className="mb-4 grid grid-cols-[3.5rem,repeat(6,1fr)] gap-2">
        <div className="h-14 animate-pulse rounded-md bg-muted" />
        {days.map((day) => (
          <div key={day} className="h-14 animate-pulse rounded-md bg-muted" />
        ))}
      </div>

      {/* Time slots grid */}
      <div className="grid grid-cols-[3.5rem,repeat(6,1fr)] gap-2">
        {timeSlots.map((slot) => (
          <React.Fragment key={`row-${slot}`}>
            {/* Time label column */}
            <div className="h-20 animate-pulse rounded-md bg-muted/20" />
            {/* Day columns */}
            {days.map((day) => (
              <div
                key={`${day}-${slot}`}
                className="h-20 animate-pulse rounded-md bg-muted/20"
              />
            ))}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CalendarSkeleton;

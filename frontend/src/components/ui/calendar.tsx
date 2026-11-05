import React, { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import { twMerge } from "tailwind-merge";
import { useClickOutside } from "./use-click-outside";
import {
  type RangeValue,
  type PresetItem,
  type PresetsMap,
  defaultPresets,
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameDay,
  isSameMonth,
  isToday,
  isWithinInterval,
  formatDateRange,
  formatToYMD,
  parseYMD,
  MONTH_NAMES_FULL,
} from "./calendar-utils";

export type { RangeValue, PresetItem, PresetsMap };

// --- Icons ---
export const ClockIcon = ({ className }: { className?: string }) => (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
    className={clsx("fill-current", className)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.5 8C14.5 11.5899 11.5899 14.5 8 14.5C4.41015 14.5 1.5 11.5899 1.5 8C1.5 4.41015 4.41015 1.5 8 1.5C11.5899 1.5 14.5 4.41015 14.5 8ZM16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM8.75 4.75V4H7.25V4.75V7.875C7.25 8.18976 7.39819 8.48615 7.65 8.675L9.55 10.1L10.15 10.55L11.05 9.35L10.45 8.9L8.75 7.625V4.75Z"
    />
  </svg>
);

export const ArrowBottomIcon = ({ className }: { className?: string }) => (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
    className={clsx("fill-current", className)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M14.0607 5.49999L13.5303 6.03032L8.7071 10.8535C8.31658 11.2441 7.68341 11.2441 7.29289 10.8535L2.46966 6.03032L1.93933 5.49999L2.99999 4.43933L3.53032 4.96966L7.99999 9.43933L12.4697 4.96966L13 4.43933L14.0607 5.49999Z"
    />
  </svg>
);

export const ArrowLeftIcon = ({ className }: { className?: string }) => (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
    className={clsx("fill-current", className)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M10.5 14.0607L9.96966 13.5303L5.14644 8.7071C4.75592 8.31658 4.75592 7.68341 5.14644 7.29289L9.96966 2.46966L10.5 1.93933L11.5607 2.99999L11.0303 3.53032L6.56065 7.99999L11.0303 12.4697L11.5607 13L10.5 14.0607Z"
    />
  </svg>
);

export const ArrowRightIcon = ({ className }: { className?: string }) => (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
    className={clsx("fill-current", className)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.50001 1.93933L6.03034 2.46966L10.8536 7.29288C11.2441 7.68341 11.2441 8.31657 10.8536 8.7071L6.03034 13.5303L5.50001 14.0607L4.43935 13L4.96968 12.4697L9.43935 7.99999L4.96968 3.53032L4.43935 2.99999L5.50001 1.93933Z"
    />
  </svg>
);

export const CalendarIcon = ({ className }: { className?: string }) => (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
    className={clsx("fill-current", className)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M5.5 0.5V1.25V2H10.5V1.25V0.5H12V1.25V2H14H15.5V3.5V13.5C15.5 14.8807 14.3807 16 13 16H3C1.61929 16 0.5 14.8807 0.5 13.5V3.5V2H2H4V1.25V0.5H5.5ZM2 3.5H14V6H2V3.5ZM2 7.5V13.5C2 14.0523 2.44772 14.5 3 14.5H13C13.5523 14.5 14 14.0523 14 13.5V7.5H2Z"
    />
  </svg>
);

export const ClearIcon = ({ className }: { className?: string }) => (
  <svg
    height="16"
    strokeLinejoin="round"
    viewBox="0 0 16 16"
    width="16"
    className={clsx("fill-current", className)}
  >
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M12.4697 13.5303L13 14.0607L14.0607 13L13.5303 12.4697L9.06065 7.99999L13.5303 3.53032L14.0607 2.99999L13 1.93933L12.4697 2.46966L7.99999 6.93933L3.53032 2.46966L2.99999 1.93933L1.93933 2.99999L2.46966 3.53032L6.93933 7.99999L2.46966 12.4697L1.93933 13L2.99999 14.0607L3.53032 13.5303L7.99999 9.06065L12.4697 13.5303Z"
    />
  </svg>
);

export interface CalendarProps {
  allowClear?: boolean;
  compact?: boolean;
  isDocsPage?: boolean;
  stacked?: boolean;
  horizontalLayout?: boolean;
  showTimeInput?: boolean;
  popoverAlignment?: "start" | "center" | "end";
  value: RangeValue | null;
  onChange: (date: RangeValue | null) => void;
  presets?: PresetsMap;
  minValue?: Date;
  maxValue?: Date;
  placeholder?: string;
  className?: string;
}

export const Calendar = ({
  allowClear = true,
  compact = false,
  popoverAlignment = "start",
  value,
  onChange,
  presets = defaultPresets,
  minValue,
  maxValue,
  placeholder = "Pilih Rentang Tanggal",
  className,
}: CalendarProps) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(() => value?.start || new Date());
  const [hoverDate, setHoverDate] = useState<Date | null>(null);
  const [isSelecting, setIsSelecting] = useState<boolean>(false);

  // Draft range selection while popover is open
  const [draftStart, setDraftStart] = useState<Date | null>(() => value?.start || null);
  const [draftEnd, setDraftEnd] = useState<Date | null>(() => value?.end || null);

  // Manual inputs inside popover
  const [startDateInput, setStartDateInput] = useState<string>(() =>
    value?.start ? formatToYMD(value.start) : ""
  );
  const [endDateInput, setEndDateInput] = useState<string>(() =>
    value?.end ? formatToYMD(value.end) : ""
  );

  const containerRef = useRef<HTMLDivElement | null>(null);

  useClickOutside(containerRef, () => {
    setIsOpen(false);
    setIsSelecting(false);
    setHoverDate(null);
  });

  useEffect(() => {
    const handleClose = () => {
      setIsOpen(false);
      setIsSelecting(false);
      setHoverDate(null);
    };

    window.addEventListener("resize", handleClose);
    return () => window.removeEventListener("resize", handleClose);
  }, []);

  // Sync draft state whenever popover opens or value changes
  useEffect(() => {
    if (isOpen) {
      setDraftStart(value?.start || null);
      setDraftEnd(value?.end || null);
      setIsSelecting(false);
      setHoverDate(null);

      if (value?.start) {
        setStartDateInput(formatToYMD(value.start));
        setCurrentMonth(value.start);
      } else {
        setStartDateInput("");
      }
      if (value?.end) {
        setEndDateInput(formatToYMD(value.end));
      } else {
        setEndDateInput("");
      }
    }
  }, [isOpen, value]);

  const prevMonth = () => setCurrentMonth((prev) => subMonths(prev, 1));
  const nextMonth = () => setCurrentMonth((prev) => addMonths(prev, 1));

  // Compute days for current month view
  const daysArray = useMemo(() => {
    const days: Date[] = [];
    const firstDayOfMonth = startOfMonth(currentMonth);
    const lastDayOfMonth = endOfMonth(currentMonth);
    let day = startOfWeek(firstDayOfMonth, { weekStartsOn: 1 });
    const end = endOfWeek(lastDayOfMonth, { weekStartsOn: 1 });

    while (day <= end) {
      days.push(new Date(day));
      day = addDays(day, 1);
    }
    return days;
  }, [currentMonth]);

  const handleDateClick = (day: Date) => {
    if (!draftStart || (draftStart && draftEnd) || !isSelecting) {
      // First click: start new range
      setDraftStart(day);
      setDraftEnd(null);
      setStartDateInput(formatToYMD(day));
      setEndDateInput("");
      setHoverDate(day);
      setIsSelecting(true);
    } else {
      // Second click: finish range
      let finalStart = draftStart;
      let finalEnd = day;

      if (day < draftStart) {
        finalStart = day;
        finalEnd = draftStart;
      }

      setDraftStart(finalStart);
      setDraftEnd(finalEnd);
      setStartDateInput(formatToYMD(finalStart));
      setEndDateInput(formatToYMD(finalEnd));
      setIsSelecting(false);
      setHoverDate(null);

      // Commit selection!
      onChange({
        start: startOfDay(finalStart),
        end: endOfDay(finalEnd),
      });
      setIsOpen(false);
    }
  };

  const handleMouseEnter = (day: Date) => {
    if (draftStart && isSelecting) {
      setHoverDate(day);
    }
  };

  const handleManualStartChange = (val: string) => {
    setStartDateInput(val);
    const parsedStart = parseYMD(val);
    const parsedEnd = parseYMD(endDateInput);
    if (parsedStart) {
      setDraftStart(parsedStart);
      setCurrentMonth(parsedStart);
      if (parsedEnd) {
        const start = parsedStart <= parsedEnd ? parsedStart : parsedEnd;
        const end = parsedStart <= parsedEnd ? parsedEnd : parsedStart;
        onChange({ start: startOfDay(start), end: endOfDay(end) });
      }
    }
  };

  const handleManualEndChange = (val: string) => {
    setEndDateInput(val);
    const parsedStart = parseYMD(startDateInput);
    const parsedEnd = parseYMD(val);
    if (parsedEnd) {
      setDraftEnd(parsedEnd);
      if (parsedStart) {
        const start = parsedStart <= parsedEnd ? parsedStart : parsedEnd;
        const end = parsedStart <= parsedEnd ? parsedEnd : parsedStart;
        onChange({ start: startOfDay(start), end: endOfDay(end) });
      }
    }
  };

  const handleSelectPreset = (preset: PresetItem) => {
    setDraftStart(preset.start);
    setDraftEnd(preset.end);
    setStartDateInput(formatToYMD(preset.start));
    setEndDateInput(formatToYMD(preset.end));
    onChange({ start: startOfDay(preset.start), end: endOfDay(preset.end) });
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDraftStart(null);
    setDraftEnd(null);
    setStartDateInput("");
    setEndDateInput("");
    setIsSelecting(false);
    setHoverDate(null);
    onChange(null);
  };

  // Label display
  const displayLabel = useMemo(() => {
    if (value?.start && value?.end) {
      return formatDateRange(value.start, value.end);
    }
    if (value?.start) {
      return formatDateRange(value.start, value.start);
    }
    return placeholder;
  }, [value, placeholder]);

  return (
    <div
      ref={containerRef}
      className={twMerge("relative inline-block text-xs font-sans", className)}
    >
      {/* Trigger Button */}
      <div className="relative inline-flex items-center">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={clsx(
            "inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border bg-white text-xs font-semibold transition-all cursor-pointer shadow-2xs select-none",
            isOpen
              ? "border-[#11212D] ring-2 ring-[#253745]/20 text-[#06141B]"
              : "border-[#CCD0CF] hover:border-[#9BA8AB] text-[#06141B]",
            compact ? "w-[180px]" : "min-w-[210px] sm:min-w-[240px]",
            allowClear && Boolean(value?.start || value?.end) && "pr-8"
          )}
        >
          <CalendarIcon className="w-4 h-4 text-[#253745] shrink-0" />
          <span className="truncate flex-1 text-left font-medium">{displayLabel}</span>
          <ArrowBottomIcon
            className={clsx(
              "w-3.5 h-3.5 text-[#4A5C6A] transition-transform duration-200 shrink-0",
              isOpen && "rotate-180"
            )}
          />
        </button>

        {/* Clear Button */}
        {allowClear && Boolean(value?.start || value?.end) && (
          <button
            type="button"
            aria-label="Bersihkan tanggal"
            title="Bersihkan filter tanggal"
            onClick={handleClear}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-[#4A5C6A] hover:text-[#06141B] hover:bg-[#CCD0CF]/30 rounded-full transition-colors cursor-pointer"
          >
            <ClearIcon className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Popover Card */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Pemilih Rentang Tanggal"
          className={twMerge(
            clsx(
              "absolute z-50 top-12 bg-white rounded-2xl border border-[#CCD0CF] shadow-xl p-4 animate-in fade-in zoom-in-95 duration-150 select-none box-border",
              "w-[calc(100vw-2rem)] max-w-[480px] max-h-[calc(100vh-6rem)] overflow-y-auto sm:w-[480px]",
              popoverAlignment === "start" && "left-0",
              popoverAlignment === "center" && "left-1/2 -translate-x-1/2",
              popoverAlignment === "end" && "right-0"
            )
          )}
        >
          {/* Top Section: Presets (left) + Calendar (right) */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Left Sidebar: Quick Presets */}
            {presets && Object.keys(presets).length > 0 && (
              <div className="w-full sm:w-32 shrink-0 sm:border-r border-[#CCD0CF]/60 sm:pr-3 space-y-1 pb-3 sm:pb-0 border-b sm:border-b-0">
                <span className="text-[10px] font-bold text-[#4A5C6A] uppercase tracking-wider block px-2 mb-1.5">
                  Pilihan Cepat
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-1 gap-1">
                  {Object.entries(presets).map(([key, item]) => {
                    const isSelected =
                      draftStart &&
                      draftEnd &&
                      isSameDay(draftStart, item.start) &&
                      isSameDay(draftEnd, item.end);

                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => handleSelectPreset(item)}
                        className={clsx(
                          "w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer truncate",
                          isSelected
                            ? "bg-[#11212D] text-white shadow-2xs"
                            : "text-[#06141B] hover:bg-[#CCD0CF]/30 hover:text-[#06141B]"
                        )}
                      >
                        {item.text}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Main Area: Calendar Grid */}
            <div className="flex-1 min-w-0">
              {/* Month & Year Navigation Header */}
              <div className="flex items-center justify-between mb-3 px-1">
                <h3 className="text-sm font-bold text-[#06141B]">
                  {MONTH_NAMES_FULL[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                </h3>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={prevMonth}
                    title="Bulan sebelumnya"
                    className="p-1.5 rounded-lg hover:bg-[#CCD0CF]/40 text-[#4A5C6A] hover:text-[#06141B] transition-colors cursor-pointer"
                  >
                    <ArrowLeftIcon className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={nextMonth}
                    title="Bulan berikutnya"
                    className="p-1.5 rounded-lg hover:bg-[#CCD0CF]/40 text-[#4A5C6A] hover:text-[#06141B] transition-colors cursor-pointer"
                  >
                    <ArrowRightIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Day of Week Headers (M T W T F S S / Sen-Min) */}
              <div className="grid grid-cols-7 text-center text-[11px] font-bold text-[#4A5C6A] mb-1.5">
                <div>Sen</div>
                <div>Sel</div>
                <div>Rab</div>
                <div>Kam</div>
                <div>Jum</div>
                <div>Sab</div>
                <div>Min</div>
              </div>

              {/* Days Grid */}
              <div className="grid grid-cols-7 gap-y-1">
                {daysArray.map((day) => {
                  const isCurrentMonth = isSameMonth(day, currentMonth);
                  const isStart = draftStart && isSameDay(day, draftStart);
                  const isEnd = draftEnd && isSameDay(day, draftEnd);
                  const currentHover = hoverDate && isSelecting && isSameDay(day, hoverDate);

                  // Active range calculation
                  const activeRangeEnd = draftEnd || (isSelecting ? hoverDate : null);
                  const isInRange =
                    draftStart &&
                    activeRangeEnd &&
                    isWithinInterval(day, { start: draftStart, end: activeRangeEnd });

                  const isAllowed =
                    (!minValue || day >= minValue) && (!maxValue || day <= maxValue);

                  return (
                    <div
                      key={day.toISOString()}
                      onMouseEnter={() => isAllowed && handleMouseEnter(day)}
                      onClick={() => isAllowed && handleDateClick(day)}
                      className={clsx(
                        "h-8 flex items-center justify-center text-xs transition-colors relative",
                        isInRange && !isStart && !isEnd && "bg-[#CCD0CF]/40",
                        isStart &&
                          isInRange &&
                          activeRangeEnd &&
                          !isSameDay(draftStart, activeRangeEnd) &&
                          "rounded-l-lg bg-[#CCD0CF]/40",
                        isEnd &&
                          isInRange &&
                          draftStart &&
                          !isSameDay(draftStart, draftEnd) &&
                          "rounded-r-lg bg-[#CCD0CF]/40",
                        currentHover &&
                          isSelecting &&
                          draftStart &&
                          !isSameDay(draftStart, hoverDate) &&
                          "rounded-r-lg bg-[#CCD0CF]/40",
                        isAllowed ? "cursor-pointer" : "cursor-not-allowed opacity-30"
                      )}
                    >
                      <div
                        className={clsx(
                          "w-7 h-7 flex items-center justify-center rounded-lg text-xs font-semibold transition-all",
                          (isStart || isEnd) && "bg-[#11212D] text-white shadow-2xs font-bold",
                          !isStart &&
                            !isEnd &&
                            isCurrentMonth &&
                            "text-[#06141B] hover:bg-[#CCD0CF]/50",
                          !isStart && !isEnd && !isCurrentMonth && "text-[#9BA8AB]",
                          isToday(day) &&
                            !isStart &&
                            !isEnd &&
                            "border border-[#253745] font-bold text-[#11212D]",
                          currentHover &&
                            !isStart &&
                            "ring-2 ring-[#253745] ring-offset-1 bg-[#11212D] text-white font-bold"
                        )}
                      >
                        {day.getDate()}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Full Width Bottom Row: Manual Date Inputs */}
          <div className="mt-3.5 pt-3 border-t border-[#CCD0CF]/60 flex items-center justify-between sm:justify-start gap-4">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#4A5C6A]">Dari:</span>
              <input
                type="date"
                value={startDateInput}
                onChange={(e) => handleManualStartChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsOpen(false);
                }}
                className="w-[124px] px-2 py-1 text-xs border border-[#CCD0CF] rounded-lg bg-white text-[#06141B] font-medium focus:outline-none focus:border-[#253745] tabular-nums"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-[#4A5C6A]">S/d:</span>
              <input
                type="date"
                value={endDateInput}
                onChange={(e) => handleManualEndChange(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setIsOpen(false);
                }}
                className="w-[124px] px-2 py-1 text-xs border border-[#CCD0CF] rounded-lg bg-white text-[#06141B] font-medium focus:outline-none focus:border-[#253745] tabular-nums"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function DefaultDemo() {
  const [date, setDate] = useState<RangeValue | null>(null);
  return (
    <div className="self-start p-4">
      <Calendar allowClear onChange={setDate} value={date} />
    </div>
  );
}

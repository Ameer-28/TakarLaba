import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import clsx from "clsx";
import { useClickOutside } from "./use-click-outside";

export interface DropdownSubMenuItem {
  label: string;
  description: string;
  icon: React.ElementType;
  active?: boolean;
  onClick?: () => void;
}

export interface DropdownSubMenuSection {
  title: string;
  items: DropdownSubMenuItem[];
}

export interface NavItem {
  id: string | number;
  label: string;
  badge?: string | number;
  active?: boolean;
  isPrimary?: boolean;
  icon?: React.ElementType;
  subMenus?: DropdownSubMenuSection[];
  onClick?: () => void;
  align?: "left" | "right";
  link?: string;
}

export interface DropdownNavigationProps {
  navItems: NavItem[];
  className?: string;
}

export function DropdownNavigation({ navItems, className }: DropdownNavigationProps) {
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [isHover, setIsHover] = useState<string | number | null>(null);
  const [alignRightMap, setAlignRightMap] = useState<Record<string, boolean>>({});
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useClickOutside(containerRef, () => {
    setOpenMenu(null);
  });

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpenMenu(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleButtonClick = (navItem: NavItem, e: React.MouseEvent<HTMLButtonElement>) => {
    if (navItem.onClick) {
      navItem.onClick();
    }
    if (navItem.subMenus && navItem.subMenus.length > 0) {
      const isOpening = openMenu !== navItem.label;
      if (isOpening) {
        const rect = e.currentTarget.getBoundingClientRect();
        const spaceOnRight = window.innerWidth - rect.left;
        const shouldAlignRight =
          navItem.align === "right" || spaceOnRight < 340 || rect.right > window.innerWidth / 2;
        setAlignRightMap((prev) => ({ ...prev, [navItem.label]: shouldAlignRight }));
        setOpenMenu(navItem.label);
      } else {
        setOpenMenu(null);
      }
    }
  };

  return (
    <div ref={containerRef} className={clsx("relative inline-flex items-center", className)}>
      <ul className="relative flex flex-wrap items-center gap-1 sm:gap-1.5 p-1 bg-slate-100/60 rounded-full border border-slate-200/60">
        {navItems.map((navItem) => {
          const isOpen = openMenu === navItem.label;
          const isItemHovered = isHover === navItem.id;
          const Icon = navItem.icon;
          const isRightAligned = navItem.align === "right" || Boolean(alignRightMap[navItem.label]);

          return (
            <li key={navItem.id} className="relative">
              <button
                type="button"
                onClick={(e) => handleButtonClick(navItem, e)}
                onMouseEnter={() => setIsHover(navItem.id)}
                onMouseLeave={() => setIsHover(null)}
                className={clsx(
                  "text-xs sm:text-sm py-1.5 px-3 sm:px-3.5 flex cursor-pointer group transition-all duration-200 items-center justify-center gap-1.5 relative rounded-full select-none whitespace-nowrap",
                  navItem.isPrimary
                    ? "bg-[#11212D] hover:bg-[#253745] text-white font-bold shadow-xs active:scale-95"
                    : navItem.active
                      ? "text-[#11212D] font-bold"
                      : "text-slate-600 hover:text-[#06141B] font-medium"
                )}
              >
                {/* Floating hover background pill */}
                {!navItem.isPrimary && (isItemHovered || isOpen || navItem.active) && (
                  <div
                    className={clsx(
                      "absolute inset-0 size-full rounded-full transition-all duration-200 -z-10",
                      navItem.active
                        ? "bg-white shadow-2xs border border-slate-200/60"
                        : "bg-white/80 group-hover:bg-white"
                    )}
                  />
                )}

                {Icon && (
                  <Icon
                    className={clsx(
                      "h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 transition-transform",
                      navItem.isPrimary ? "text-white" : "text-slate-500 group-hover:text-slate-800"
                    )}
                  />
                )}

                <span>{navItem.label}</span>

                {navItem.badge !== undefined && (
                  <span
                    className={clsx(
                      "text-[10px] font-bold px-1.5 py-0.2 rounded-full tabular-nums",
                      navItem.isPrimary ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"
                    )}
                  >
                    {navItem.badge}
                  </span>
                )}

                {navItem.subMenus && navItem.subMenus.length > 0 && (
                  <ChevronDown
                    className={clsx(
                      "h-3.5 w-3.5 shrink-0 transition-transform duration-200",
                      isOpen
                        ? "rotate-180 text-[#11212D]"
                        : "text-slate-400 group-hover:text-slate-600"
                    )}
                  />
                )}
              </button>

              {/* Dropdown Menu Popover */}
              {isOpen && navItem.subMenus && navItem.subMenus.length > 0 && (
                <div
                  className={clsx(
                    "w-auto absolute top-full pt-2 z-50",
                    isRightAligned ? "right-0" : "left-0"
                  )}
                >
                  <div className="bg-white border border-[#CCD0CF] p-3 sm:p-4 w-max max-w-[calc(100vw-1.5rem)] sm:max-w-xl max-h-[calc(100vh-10rem)] overflow-y-auto rounded-2xl shadow-xl animate-in fade-in-0 zoom-in-95 duration-150">
                    <div className="w-fit shrink-0 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-8">
                      {navItem.subMenus.map((sub) => (
                        <div
                          className="w-full min-w-[200px] sm:min-w-[220px] max-w-[320px]"
                          key={sub.title}
                        >
                          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            {sub.title}
                          </h3>
                          <ul className="space-y-1.5">
                            {sub.items.map((item) => {
                              const ItemIcon = item.icon;
                              return (
                                <li key={item.label}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      item.onClick?.();
                                      setOpenMenu(null);
                                    }}
                                    className={clsx(
                                      "flex items-start space-x-3 group text-left w-full p-2 rounded-xl transition-all duration-200 cursor-pointer",
                                      item.active
                                        ? "bg-slate-100/90 text-[#06141B]"
                                        : "hover:bg-slate-50 text-slate-700"
                                    )}
                                  >
                                    <div
                                      className={clsx(
                                        "border rounded-lg flex items-center justify-center size-9 shrink-0 transition-colors duration-200",
                                        item.active
                                          ? "border-[#11212D] bg-[#11212D] text-white shadow-2xs"
                                          : "border-slate-200 text-slate-600 bg-white group-hover:border-[#11212D] group-hover:bg-[#11212D] group-hover:text-white"
                                      )}
                                    >
                                      <ItemIcon className="h-4.5 w-4.5 flex-none" />
                                    </div>
                                    <div className="leading-5 flex-1 min-w-0 pr-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <p
                                          className={clsx(
                                            "text-sm font-semibold truncate",
                                            item.active ? "text-[#06141B]" : "text-slate-800"
                                          )}
                                        >
                                          {item.label}
                                        </p>
                                        {item.active && (
                                          <Check className="w-3.5 h-3.5 text-[#11212D] stroke-[3] shrink-0" />
                                        )}
                                      </div>
                                      <p className="text-xs text-slate-500 group-hover:text-slate-700 transition-colors duration-200 line-clamp-2 mt-0.5">
                                        {item.description}
                                      </p>
                                    </div>
                                  </button>
                                </li>
                              );
                            })}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export default DropdownNavigation;

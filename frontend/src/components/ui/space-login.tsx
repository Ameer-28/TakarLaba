"use client";

import React, { useState, useEffect, useRef, useId, useMemo, useCallback, forwardRef } from "react";
import { Eye, EyeOff, KeyRound, Loader2, Check } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

// Clean self-contained cn utility
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Lightweight native motion adapter (avoids external dependency while preserving exact JSX syntax & 60fps animations)
interface MotionAnimationProps {
  initial?: Record<string, unknown>;
  animate?: Record<string, unknown>;
  transition?: Record<string, unknown>;
  exit?: Record<string, unknown>;
  whileHover?: Record<string, unknown>;
  whileTap?: Record<string, unknown>;
}

export const motion = {
  div: forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & MotionAnimationProps>(
    (props, ref) => {
      const dynamicStyle: React.CSSProperties = { ...props.style };

      if (
        props.animate &&
        typeof props.animate.x === "number" &&
        typeof props.animate.y === "number"
      ) {
        dynamicStyle.transform = `translate3d(${props.animate.x}px, ${props.animate.y}px, 0)`;
        dynamicStyle.transition = "transform 0.15s cubic-bezier(0.2, 0.8, 0.2, 1)";
      } else if (props.animate && Array.isArray(props.animate.y)) {
        dynamicStyle.animation = "space-float 7s ease-in-out infinite";
      } else if (props.animate && Array.isArray(props.animate.scale)) {
        dynamicStyle.animation = "space-sparkle 2.8s ease-in-out infinite";
      } else if (props.initial && props.initial.y === 20) {
        dynamicStyle.animation = "space-fade-in 0.6s ease-out forwards";
      }

      const domProps: Record<string, unknown> = { ...props };
      delete domProps.initial;
      delete domProps.animate;
      delete domProps.transition;
      delete domProps.exit;
      delete domProps.whileHover;
      delete domProps.whileTap;
      delete domProps.style;
      delete domProps.className;

      return <div ref={ref} style={dynamicStyle} className={props.className} {...domProps} />;
    }
  ),

  button: forwardRef<
    HTMLButtonElement,
    React.ButtonHTMLAttributes<HTMLButtonElement> & MotionAnimationProps
  >((props, ref) => {
    const domProps: Record<string, unknown> = { ...props };
    delete domProps.initial;
    delete domProps.animate;
    delete domProps.transition;
    delete domProps.exit;
    delete domProps.whileHover;
    delete domProps.whileTap;
    delete domProps.className;

    return (
      <button
        ref={ref}
        className={cn(
          props.whileTap ? "active:scale-[0.98] transition-transform duration-150" : "",
          props.whileHover ? "hover:-translate-y-0.5 hover:scale-105" : "",
          props.className
        )}
        {...domProps}
      />
    );
  }),

  span: forwardRef<HTMLSpanElement, React.HTMLAttributes<HTMLSpanElement> & MotionAnimationProps>(
    (props, ref) => {
      const domProps: Record<string, unknown> = { ...props };
      delete domProps.initial;
      delete domProps.animate;
      delete domProps.transition;
      delete domProps.exit;
      delete domProps.whileHover;
      delete domProps.whileTap;
      delete domProps.className;

      return <span ref={ref} className={props.className} {...domProps} />;
    }
  ),
};

export function AnimatePresence(props: { children: React.ReactNode; mode?: string }) {
  return <>{props.children}</>;
}

// Dark mode helper
export const useDarkMode = (): boolean => {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkDark = () => {
      const isHtmlDark = document.documentElement.classList.contains("dark");
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      return isHtmlDark || mediaQuery.matches;
    };

    setIsDark(checkDark());

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => setIsDark(checkDark());
    mediaQuery.addEventListener("change", handler);

    const observer = new MutationObserver(() => setIsDark(checkDark()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });

    return () => {
      mediaQuery.removeEventListener("change", handler);
      observer.disconnect();
    };
  }, []);

  return isDark;
};

// Liquid Glass Presets
export const GLASS_PRESETS = {
  subtle: {
    backgroundOpacity: 0.06,
    saturation: 1.1,
    brightness: 55,
    blur: 8,
    displace: 0.3,
    distortionScale: -20,
    redOffset: -1,
    greenOffset: 1,
    blueOffset: 3,
    mixBlendMode: "difference",
  },
  default: {
    backgroundOpacity: 0.1,
    saturation: 1.4,
    brightness: 55,
    blur: 10,
    displace: 0.4,
    distortionScale: -35,
    redOffset: 0,
    greenOffset: 2,
    blueOffset: 4,
    mixBlendMode: "difference",
  },
  bold: {
    backgroundOpacity: 0.18,
    saturation: 1.8,
    brightness: 60,
    blur: 12,
    displace: 0.6,
    distortionScale: -55,
    redOffset: 1,
    greenOffset: 3,
    blueOffset: 6,
    mixBlendMode: "screen",
  },
  ghost: {
    backgroundOpacity: 0,
    saturation: 1,
    brightness: 55,
    blur: 6,
    displace: 0,
    distortionScale: 0,
    redOffset: 0,
    greenOffset: 0,
    blueOffset: 0,
    mixBlendMode: "difference",
  },
};

export type GlassVariant = keyof typeof GLASS_PRESETS;

export const GLASS_DEFAULTS = {
  width: "auto",
  height: "auto",
  borderRadius: 16,
  borderWidth: 0.03,
  opacity: 0.93,
  xChannel: "R",
  yChannel: "G",
};

export interface GlassProps {
  variant?: GlassVariant;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  width?: number | string;
  height?: number | string;
  borderRadius?: number;
  borderWidth?: number;
  brightness?: number;
  opacity?: number;
  blur?: number;
  displace?: number;
  backgroundOpacity?: number;
  saturation?: number;
  distortionScale?: number;
  redOffset?: number;
  greenOffset?: number;
  blueOffset?: number;
  xChannel?: "R" | "G" | "B" | "A";
  yChannel?: "R" | "G" | "B" | "A";
  mixBlendMode?: string;
  dark?: boolean;
}

export const Glass: React.FC<GlassProps> = (rawProps) => {
  const {
    variant = "default",
    children,
    className = "",
    style = {},
    width,
    height,
    borderRadius,
    borderWidth,
    brightness,
    opacity,
    blur,
    displace,
    backgroundOpacity,
    saturation,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel,
    mixBlendMode,
    dark,
  } = rawProps;

  const uniqueId = useId().replace(/:/g, "-");
  const filterId = `glass-filter-${uniqueId}`;
  const redGradId = `red-grad-${uniqueId}`;
  const blueGradId = `blue-grad-${uniqueId}`;

  const containerRef = useRef<HTMLDivElement>(null);
  const feImageRef = useRef<SVGFEImageElement>(null);
  const redChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const greenChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const blueChannelRef = useRef<SVGFEDisplacementMapElement>(null);
  const gaussianBlurRef = useRef<SVGFEGaussianBlurElement>(null);

  const systemDarkMode = useDarkMode();
  const isDarkMode = dark !== undefined ? dark : systemDarkMode;

  const v = useMemo(() => {
    const p = GLASS_PRESETS[variant] ?? GLASS_PRESETS.default;
    return {
      ...GLASS_DEFAULTS,
      ...p,
      ...(width !== undefined && { width }),
      ...(height !== undefined && { height }),
      ...(borderRadius !== undefined && { borderRadius }),
      ...(borderWidth !== undefined && { borderWidth }),
      ...(brightness !== undefined && { brightness }),
      ...(opacity !== undefined && { opacity }),
      ...(blur !== undefined && { blur }),
      ...(displace !== undefined && { displace }),
      ...(backgroundOpacity !== undefined && { backgroundOpacity }),
      ...(saturation !== undefined && { saturation }),
      ...(distortionScale !== undefined && { distortionScale }),
      ...(redOffset !== undefined && { redOffset }),
      ...(greenOffset !== undefined && { greenOffset }),
      ...(blueOffset !== undefined && { blueOffset }),
      ...(xChannel !== undefined && { xChannel }),
      ...(yChannel !== undefined && { yChannel }),
      ...(mixBlendMode !== undefined && { mixBlendMode }),
    };
  }, [
    variant,
    width,
    height,
    borderRadius,
    borderWidth,
    brightness,
    opacity,
    blur,
    displace,
    backgroundOpacity,
    saturation,
    distortionScale,
    redOffset,
    greenOffset,
    blueOffset,
    xChannel,
    yChannel,
    mixBlendMode,
  ]);

  const generateDisplacementMap = useCallback(() => {
    const rect = containerRef.current?.getBoundingClientRect();
    const actualWidth = rect?.width || 400;
    const actualHeight = rect?.height || 200;
    const edgeSize = Math.min(actualWidth, actualHeight) * (v.borderWidth * 0.5);

    const svgContent = `
      <svg viewBox="0 0 ${actualWidth} ${actualHeight}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="${redGradId}" x1="100%" y1="0%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="red"/>
          </linearGradient>
          <linearGradient id="${blueGradId}" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stop-color="#0000"/>
            <stop offset="100%" stop-color="blue"/>
          </linearGradient>
        </defs>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" fill="black"></rect>
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${v.borderRadius}" fill="url(#${redGradId})" />
        <rect x="0" y="0" width="${actualWidth}" height="${actualHeight}" rx="${v.borderRadius}" fill="url(#${blueGradId})" style="mix-blend-mode: ${v.mixBlendMode}" />
        <rect x="${edgeSize}" y="${edgeSize}" width="${actualWidth - edgeSize * 2}" height="${
          actualHeight - edgeSize * 2
        }" rx="${v.borderRadius}" fill="hsl(0 0% ${v.brightness}% / ${
          v.opacity
        })" style="filter:blur(${v.blur}px)" />
      </svg>
    `;

    return `data:image/svg+xml,${encodeURIComponent(svgContent)}`;
  }, [
    redGradId,
    blueGradId,
    v.borderWidth,
    v.borderRadius,
    v.mixBlendMode,
    v.brightness,
    v.opacity,
    v.blur,
  ]);

  const updateDisplacementMap = useCallback(() => {
    if (feImageRef.current) {
      feImageRef.current.setAttribute("href", generateDisplacementMap());
    }
  }, [generateDisplacementMap]);

  useEffect(() => {
    updateDisplacementMap();
    [
      { ref: redChannelRef, offset: v.redOffset },
      { ref: greenChannelRef, offset: v.greenOffset },
      { ref: blueChannelRef, offset: v.blueOffset },
    ].forEach(({ ref, offset }) => {
      if (ref.current) {
        ref.current.setAttribute("scale", (v.distortionScale + offset).toString());
        ref.current.setAttribute("xChannelSelector", v.xChannel);
        ref.current.setAttribute("yChannelSelector", v.yChannel);
      }
    });

    if (gaussianBlurRef.current) {
      gaussianBlurRef.current.setAttribute("stdDeviation", v.displace.toString());
    }
  }, [
    v.width,
    v.height,
    v.borderRadius,
    v.borderWidth,
    v.brightness,
    v.opacity,
    v.blur,
    v.displace,
    v.distortionScale,
    v.redOffset,
    v.greenOffset,
    v.blueOffset,
    v.xChannel,
    v.yChannel,
    v.mixBlendMode,
    variant,
    updateDisplacementMap,
  ]);

  useEffect(() => {
    if (!containerRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      setTimeout(updateDisplacementMap, 0);
    });

    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateDisplacementMap]);

  useEffect(() => {
    setTimeout(updateDisplacementMap, 0);
  }, [v.width, v.height, updateDisplacementMap]);

  const [svgFilterSupported, setSvgFilterSupported] = useState(true);

  useEffect(() => {
    const checkSupport = () => {
      const isWebkit =
        typeof navigator !== "undefined" &&
        /Safari/.test(navigator.userAgent) &&
        !/Chrome/.test(navigator.userAgent);
      const isFirefox = typeof navigator !== "undefined" && /Firefox/.test(navigator.userAgent);
      setSvgFilterSupported(!isWebkit && !isFirefox);
    };
    checkSupport();
  }, [filterId]);

  const getContainerStyles = (): React.CSSProperties => {
    const baseStyles = {
      ...style,
      ...(v.width &&
        v.width !== "auto" && { width: typeof v.width === "number" ? `${v.width}px` : v.width }),
      ...(v.height &&
        v.height !== "auto" && {
          height: typeof v.height === "number" ? `${v.height}px` : v.height,
        }),
      borderRadius: `${v.borderRadius}px`,
      "--glass-frost": v.backgroundOpacity,
      "--glass-saturation": v.saturation,
    };

    if (svgFilterSupported) {
      return {
        ...baseStyles,
        background: isDarkMode
          ? `hsl(0 0% 0% / ${v.backgroundOpacity})`
          : `hsl(0 0% 100% / ${v.backgroundOpacity})`,
        backdropFilter: `url(#${filterId}) saturate(${v.saturation})`,
        border: isDarkMode
          ? "1px solid rgba(255, 255, 255, 0.08)"
          : "1px solid rgba(0, 0, 0, 0.06)",
        boxShadow: isDarkMode
          ? `0 0 1px 0 rgba(255, 255, 255, 0.1) inset,
             0px 4px 16px rgba(17, 17, 26, 0.05)`
          : `0 0 1px 0 rgba(0, 0, 0, 0.05) inset,
             0px 4px 16px rgba(17, 17, 26, 0.05)`,
      } as React.CSSProperties;
    } else {
      return {
        ...baseStyles,
        background: isDarkMode ? "rgba(0, 0, 0, 0.3)" : "rgba(255, 255, 255, 0.2)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        border: isDarkMode
          ? "1px solid rgba(255, 255, 255, 0.08)"
          : "1px solid rgba(0, 0, 0, 0.06)",
      } as React.CSSProperties;
    }
  };

  const glassClasses =
    "relative flex items-center justify-center overflow-hidden transition-all duration-[260ms] ease-out";

  return (
    <div ref={containerRef} className={cn(glassClasses, className)} style={getContainerStyles()}>
      <svg
        className="w-full h-full pointer-events-none absolute inset-0 opacity-0 -z-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <filter
            id={filterId}
            colorInterpolationFilters="sRGB"
            x="0%"
            y="0%"
            width="100%"
            height="100%"
          >
            <feImage
              ref={feImageRef}
              href={
                generateDisplacementMap() ||
                "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1' height='1'%3E%3C/svg%3E"
              }
              x="0"
              y="0"
              width="100%"
              height="100%"
              preserveAspectRatio="none"
              result="map"
            />
            <feDisplacementMap
              ref={redChannelRef}
              in="SourceGraphic"
              in2="map"
              id="redchannel"
              result="dispRed"
            />
            <feColorMatrix
              in="dispRed"
              type="matrix"
              values="1 0 0 0 0
                      0 0 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="red"
            />
            <feDisplacementMap
              ref={greenChannelRef}
              in="SourceGraphic"
              in2="map"
              id="greenchannel"
              result="dispGreen"
            />
            <feColorMatrix
              in="dispGreen"
              type="matrix"
              values="0 0 0 0 0
                      0 1 0 0 0
                      0 0 0 0 0
                      0 0 0 1 0"
              result="green"
            />
            <feDisplacementMap
              ref={blueChannelRef}
              in="SourceGraphic"
              in2="map"
              id="bluechannel"
              result="dispBlue"
            />
            <feColorMatrix
              in="dispBlue"
              type="matrix"
              values="0 0 0 0 0
                      0 0 0 0 0
                      0 0 1 0 0
                      0 0 0 1 0"
              result="blue"
            />
            <feBlend in="red" in2="green" mode="screen" result="rg" />
            <feBlend in="rg" in2="blue" mode="screen" result="output" />
            <feGaussianBlur ref={gaussianBlurRef} in="output" stdDeviation="0.7" />
          </filter>
        </defs>
      </svg>

      <div className="w-full h-full flex items-center justify-center p-0 rounded-[inherit] relative z-10">
        {children}
      </div>
    </div>
  );
};

export interface GlassInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  variant?: GlassVariant;
  containerClassName?: string;
  rightElement?: React.ReactNode;
  borderRadius?: number;
  height?: number | string;
  glassProps?: Partial<GlassProps>;
}

export const GlassInput = forwardRef<HTMLInputElement, GlassInputProps>(
  (
    {
      variant = "default",
      className = "",
      containerClassName = "",
      rightElement,
      borderRadius = 14,
      height = 52,
      glassProps,
      ...inputProps
    },
    ref
  ) => {
    return (
      <Glass
        variant={variant}
        borderRadius={borderRadius}
        dark={true}
        height={height}
        className={cn(
          "w-full h-[52px] min-h-[52px] transition-all duration-200",
          containerClassName
        )}
        {...glassProps}
      >
        <div className="relative w-full h-[52px] min-h-[52px] flex items-center px-4">
          <input
            ref={ref}
            className={cn(
              "w-full h-full bg-transparent text-neutral-100 placeholder:text-neutral-400/70 border-none outline-none text-[15px] font-medium leading-none",
              rightElement ? "pr-10" : "pr-0",
              className
            )}
            {...inputProps}
          />
          {rightElement && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center justify-center">
              {rightElement}
            </div>
          )}
        </div>
      </Glass>
    );
  }
);

GlassInput.displayName = "GlassInput";

export interface SpaceLoginProps {
  title?: string;
  subtitle?: string;
  astronautSrc?: string;
  onSubmit?: (data: {
    email: string;
    password: string;
    rememberMe: boolean;
  }) => Promise<void> | void;
  onForgotPassword?: () => void;
  onSignUp?: () => void;
  onSocialLogin?: (provider: "google" | "github" | "facebook" | "windows" | "passkey") => void;
  className?: string;
  defaultEmail?: string;
  showSocialButtons?: boolean;
  glassVariant?: GlassVariant;
  errorMessage?: string | null;
  onDemoLogin?: (role: "owner" | "cashier") => void;
  isDemoSubmitting?: "owner" | "cashier" | null;
}

// Sparkle Star SVG Component for the glowing stars
function SparkleStar({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
      className={cn("w-4 h-4 pointer-events-none select-none", className)}
      style={style}
    >
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  );
}

// Social Icons SVGs for accurate brand representations
function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} viewBox="0 0 24 24">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
      />
    </svg>
  );
}

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} fill="currentColor" viewBox="0 0 24 24">
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"
      />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} fill="currentColor" viewBox="0 0 24 24">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg className={cn("w-4 h-4", className)} fill="currentColor" viewBox="0 0 24 24">
      <path d="M0 3.449L9.75 2.1v9.451H0V3.449zm10.75-1.551L24 0v11.551h-13.25V1.898zM0 12.449h9.75v9.451L0 20.551v-8.102zm10.75 0H24V24l-13.25-1.898v-9.653z" />
    </svg>
  );
}

// Dynamic Starfield with Canvas for high-performance and interactive cosmic feel
export function CosmicStarfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      initStars();
    };

    window.addEventListener("resize", handleResize);

    interface Star {
      x: number;
      y: number;
      size: number;
      opacity: number;
      baseOpacity: number;
      twinkleSpeed: number;
      color: string;
      isSparkle?: boolean;
    }

    let stars: Star[] = [];

    const starColors = ["#ffffff", "#e0f2fe", "#fdf4ff", "#fbcfe8", "#bae6fd"];

    const initStars = () => {
      stars = [];
      const count = Math.floor((width * height) / 3200);

      for (let i = 0; i < count; i++) {
        const isSparkle = Math.random() < 0.08;
        const color = starColors[Math.floor(Math.random() * starColors.length)] ?? "#ffffff";
        const baseOpacity = isSparkle ? 0.6 + Math.random() * 0.4 : 0.2 + Math.random() * 0.7;

        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          size: isSparkle ? Math.random() * 1.8 + 1.2 : Math.random() * 1.3 + 0.5,
          opacity: baseOpacity,
          baseOpacity,
          twinkleSpeed: 0.008 + Math.random() * 0.02,
          color,
          isSparkle,
        });
      }
    };

    initStars();

    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX - width / 2) * 0.03;
      targetMouseY = (e.clientY - height / 2) * 0.03;
    };

    window.addEventListener("mousemove", handleMouseMove);

    interface ShootingStar {
      x: number;
      y: number;
      length: number;
      speed: number;
      angle: number;
      opacity: number;
      life: number;
    }

    const shootingStars: ShootingStar[] = [];

    const maybeAddShootingStar = () => {
      if (Math.random() < 0.012 && shootingStars.length < 2) {
        shootingStars.push({
          x: Math.random() * width,
          y: Math.random() * (height * 0.5),
          length: Math.random() * 80 + 40,
          speed: Math.random() * 9 + 7,
          angle: Math.PI / 4 + (Math.random() * 0.2 - 0.1),
          opacity: 1,
          life: 1,
        });
      }
    };

    let tick = 0;

    const render = () => {
      tick++;
      currentMouseX += (targetMouseX - currentMouseX) * 0.05;
      currentMouseY += (targetMouseY - currentMouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      for (let i = 0; i < stars.length; i++) {
        const star = stars[i];
        if (!star) continue;
        star.opacity = star.baseOpacity + Math.sin(tick * star.twinkleSpeed + i) * 0.35;
        const boundedOpacity = Math.max(0.1, Math.min(1, star.opacity));

        const posX = star.x + currentMouseX * (star.size * 0.8);
        const posY = star.y + currentMouseY * (star.size * 0.8);

        ctx.fillStyle = star.color;
        ctx.globalAlpha = boundedOpacity;

        if (star.isSparkle) {
          const s = star.size * 2.2;
          ctx.beginPath();
          ctx.moveTo(posX, posY - s);
          ctx.lineTo(posX + s * 0.25, posY - s * 0.25);
          ctx.lineTo(posX + s, posY);
          ctx.lineTo(posX + s * 0.25, posY + s * 0.25);
          ctx.lineTo(posX, posY + s);
          ctx.lineTo(posX - s * 0.25, posY + s * 0.25);
          ctx.lineTo(posX - s, posY);
          ctx.lineTo(posX - s * 0.25, posY - s * 0.25);
          ctx.closePath();
          ctx.fill();

          ctx.beginPath();
          ctx.arc(posX, posY, star.size * 0.8, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.arc(posX, posY, star.size, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      maybeAddShootingStar();

      for (let i = shootingStars.length - 1; i >= 0; i--) {
        const ss = shootingStars[i];
        if (!ss) continue;
        ss.x += Math.cos(ss.angle) * ss.speed;
        ss.y += Math.sin(ss.angle) * ss.speed;
        ss.life -= 0.015;

        if (ss.life <= 0 || ss.x > width + 100 || ss.y > height + 100) {
          shootingStars.splice(i, 1);
          continue;
        }

        ctx.strokeStyle = `rgba(255, 255, 255, ${ss.life * 0.8})`;
        ctx.lineWidth = 1.4;
        ctx.beginPath();
        ctx.moveTo(ss.x, ss.y);
        ctx.lineTo(ss.x - Math.cos(ss.angle) * ss.length, ss.y - Math.sin(ss.angle) * ss.length);
        ctx.stroke();
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-0" />;
}

export const DEFAULT_ASTRONAUT_IMAGE =
  "data:image/png;base64,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";

export function SpaceLogin({
  title = "Sign In",
  subtitle,
  astronautSrc = DEFAULT_ASTRONAUT_IMAGE,
  onSubmit,
  onForgotPassword,
  onSignUp,
  onSocialLogin,
  className,
  defaultEmail = "",
  showSocialButtons = true,
  glassVariant = "default",
  errorMessage,
  onDemoLogin,
  isDemoSubmitting = null,
}: SpaceLoginProps) {
  const [email, setEmail] = useState(defaultEmail);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Astronaut mouse-follow parallax
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const handleGlobalMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { clientX, clientY } = e;
    const { innerWidth, innerHeight } = window;
    const x = (clientX / innerWidth - 0.5) * 20;
    const y = (clientY / innerHeight - 0.5) * 20;
    setMousePos({ x, y });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || isLoading) return;

    setIsLoading(true);
    try {
      if (onSubmit) {
        await onSubmit({ email, password, rememberMe });
      } else {
        await new Promise((resolve) => setTimeout(resolve, 1200));
      }
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 2500);
    } catch (err) {
      console.error("Sign in error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onMouseMove={handleGlobalMouseMove}
      className={cn(
        "relative min-h-screen w-full bg-[#03060f] text-white flex flex-col items-center justify-center overflow-hidden px-4 select-none",
        className
      )}
    >
      <style>{`
        @keyframes space-float {
          0%, 100% {
            transform: translateY(-12px) rotate(-2deg);
          }
          50% {
            transform: translateY(14px) rotate(3deg);
          }
        }
        @keyframes space-sparkle {
          0%, 100% {
            transform: scale(0.85);
            opacity: 0.65;
          }
          50% {
            transform: scale(1.25);
            opacity: 1;
          }
        }
        @keyframes space-fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>

      {/* Dynamic Starfield Canvas */}
      <CosmicStarfield />

      {/* Atmospheric Horizon / Planet Glow at the bottom */}
      <div className="absolute -bottom-48 sm:-bottom-56 md:-bottom-64 left-1/2 -translate-x-1/2 w-[160vw] max-w-[1900px] h-[480px] sm:h-[550px] md:h-[620px] pointer-events-none z-0">
        <div
          className="w-full h-full rounded-[100%]"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(224, 102, 70, 0.95) 0%, rgba(199, 81, 58, 0.75) 20%, rgba(67, 142, 145, 0.5) 42%, rgba(20, 48, 70, 0.25) 60%, transparent 80%)",
            filter: "blur(32px)",
          }}
        />
        <div
          className="absolute inset-0 rounded-[100%] opacity-40 mix-blend-screen"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(255, 170, 110, 0.6) 0%, rgba(94, 219, 210, 0.4) 30%, transparent 65%)",
            filter: "blur(48px)",
          }}
        />
      </div>

      {/* Cosmic Floating Astronaut with Parallax and Pink Accent Star */}
      <div className="relative z-10 w-full max-w-5xl flex items-center justify-center">
        <motion.div
          animate={{
            x: mousePos.x * 1.5,
            y: mousePos.y * 1.5,
          }}
          transition={{ type: "spring", damping: 30, stiffness: 60 }}
          className="hidden md:block absolute left-2 lg:left-12 xl:left-20 top-1/2 -translate-y-[65%] pointer-events-none z-20"
        >
          <motion.div
            animate={{
              y: [-12, 14, -12],
              rotate: [-2, 3, -2],
            }}
            transition={{
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            className="relative"
          >
            <img
              src={astronautSrc}
              alt="Floating Astronaut"
              className="w-40 sm:w-44 lg:w-52 h-auto drop-shadow-[0_15px_30px_rgba(0,0,0,0.85)] filter contrast-125 select-none"
              draggable={false}
            />

            <motion.div
              animate={{
                scale: [0.85, 1.25, 0.85],
                opacity: [0.65, 1, 0.65],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="absolute -right-3 top-1/2 -translate-y-1/2"
            >
              <SparkleStar className="w-6 h-6 text-[#ff4bb8] drop-shadow-[0_0_12px_#ff4bb8]" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Central Sign In Form Container */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative z-10 w-full max-w-[420px] mx-auto flex flex-col items-center"
        >
          {/* Main Title */}
          <h1 className="text-4xl sm:text-[42px] font-extrabold tracking-tight text-white mb-8 sm:mb-9 text-center drop-shadow-sm font-sans">
            {title}
          </h1>

          {subtitle && (
            <p className="text-sm text-neutral-400 -mt-6 mb-7 text-center">{subtitle}</p>
          )}

          {/* Error Message banner if present */}
          {errorMessage && (
            <div className="w-full mb-4 p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs text-center font-medium shadow-sm">
              {errorMessage}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="w-full flex flex-col gap-5">
            {/* Email Field with Liquid Glass */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="space-email"
                className="text-base font-semibold text-neutral-200 tracking-wide select-none"
              >
                Email
              </label>
              <GlassInput
                id="space-email"
                type="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                variant={glassVariant}
                borderRadius={14}
              />
            </div>

            {/* Password Field with Liquid Glass */}
            <div className="flex flex-col gap-2">
              <label
                htmlFor="space-password"
                className="text-base font-semibold text-neutral-200 tracking-wide select-none"
              >
                Password
              </label>
              <GlassInput
                id="space-password"
                type={showPassword ? "text" : "password"}
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                variant={glassVariant}
                borderRadius={14}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="p-1 text-neutral-400 hover:text-neutral-200 focus:outline-none transition-colors"
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5 transition-transform active:scale-90" />
                    ) : (
                      <Eye className="w-5 h-5 transition-transform active:scale-90" />
                    )}
                  </button>
                }
              />
            </div>

            {/* Remember Me & Forgot Password Row */}
            <div className="flex items-center justify-between text-xs sm:text-[13px] pt-1">
              <label className="flex items-center gap-2 cursor-pointer group select-none">
                <div
                  onClick={() => setRememberMe(!rememberMe)}
                  className={cn(
                    "w-4 h-4 rounded-[4px] border transition-all duration-150 flex items-center justify-center",
                    rememberMe
                      ? "bg-neutral-200 border-neutral-200 text-black"
                      : "border-neutral-600 bg-white/5 group-hover:border-neutral-400"
                  )}
                >
                  {rememberMe && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
                <span className="text-neutral-300 group-hover:text-white transition-colors">
                  Remember me
                </span>
              </label>

              <button
                type="button"
                onClick={onForgotPassword}
                className="text-neutral-300 hover:text-white font-medium transition-colors hover:underline underline-offset-4 select-none"
              >
                Forget Password ?
              </button>
            </div>

            {/* Submit / Sign In Button */}
            <motion.button
              type="submit"
              disabled={isLoading || isSuccess}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative w-full h-12 mt-2 rounded-xl font-bold text-sm tracking-wide transition-all duration-200 flex items-center justify-center overflow-hidden shadow-lg select-none",
                isSuccess
                  ? "bg-emerald-600 text-white shadow-emerald-500/25"
                  : "bg-[#252831] hover:bg-[#2d313c] active:bg-[#22252e] text-neutral-100 hover:text-white border border-white/10 hover:border-white/20 shadow-black/40"
              )}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2"
                  >
                    <Loader2 className="w-4 h-4 animate-spin text-neutral-300" />
                    <span>Signing in...</span>
                  </motion.div>
                ) : isSuccess ? (
                  <motion.div
                    key="success"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex items-center gap-2 text-white"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Welcome Back!</span>
                  </motion.div>
                ) : (
                  <motion.span
                    key="text"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    Sign In
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>

            {/* Don't have an account link */}
            <div className="text-center text-xs sm:text-[13px] text-neutral-400 mt-1">
              <span>Don’t Have an Account ? </span>
              <button
                type="button"
                onClick={onSignUp}
                className="text-white font-bold hover:underline underline-offset-4 transition-colors"
              >
                Sign Up
              </button>
            </div>

            {/* Subtle Divider */}
            {showSocialButtons && (
              <div className="w-full flex items-center gap-3 my-1">
                <div className="flex-1 h-[1px] bg-white/[0.08]" />
              </div>
            )}

            {/* Social Logins */}
            {showSocialButtons && (
              <div className="flex items-center justify-center gap-2.5 sm:gap-3 w-full">
                {/* Google */}
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSocialLogin?.("google")}
                  aria-label="Sign in with Google"
                  className="w-10 h-10 rounded-xl bg-[#242730]/80 hover:bg-[#2e323e] border border-white/10 hover:border-white/20 flex items-center justify-center text-neutral-300 hover:text-white transition-colors backdrop-blur-md shadow-md"
                >
                  <GoogleIcon className="w-4 h-4" />
                </motion.button>

                {/* GitHub */}
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSocialLogin?.("github")}
                  aria-label="Sign in with GitHub"
                  className="w-10 h-10 rounded-xl bg-[#242730]/80 hover:bg-[#2e323e] border border-white/10 hover:border-white/20 flex items-center justify-center text-neutral-300 hover:text-white transition-colors backdrop-blur-md shadow-md"
                >
                  <GitHubIcon className="w-4 h-4" />
                </motion.button>

                {/* Facebook */}
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSocialLogin?.("facebook")}
                  aria-label="Sign in with Facebook"
                  className="w-10 h-10 rounded-xl bg-[#242730]/80 hover:bg-[#2e323e] border border-white/10 hover:border-white/20 flex items-center justify-center text-neutral-300 hover:text-white transition-colors backdrop-blur-md shadow-md"
                >
                  <FacebookIcon className="w-4 h-4" />
                </motion.button>

                {/* Windows / Microsoft */}
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSocialLogin?.("windows")}
                  aria-label="Sign in with Windows"
                  className="w-10 h-10 rounded-xl bg-[#242730]/80 hover:bg-[#2e323e] border border-white/10 hover:border-white/20 flex items-center justify-center text-neutral-300 hover:text-white transition-colors backdrop-blur-md shadow-md"
                >
                  <WindowsIcon className="w-3.5 h-3.5" />
                </motion.button>

                {/* Passkey / Key */}
                <motion.button
                  type="button"
                  whileHover={{ y: -2, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onSocialLogin?.("passkey")}
                  aria-label="Sign in with Passkey"
                  className="w-10 h-10 rounded-xl bg-[#242730]/80 hover:bg-[#2e323e] border border-white/10 hover:border-white/20 flex items-center justify-center text-neutral-300 hover:text-white transition-colors backdrop-blur-md shadow-md"
                >
                  <KeyRound className="w-4 h-4 -rotate-45" />
                </motion.button>
              </div>
            )}

            {/* Quick 1-Click Demo Accounts Access */}
            {onDemoLogin && (
              <div className="w-full flex flex-col items-center gap-2 mt-2 pt-3 border-t border-white/[0.08]">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400">
                  Akses Cepat Akun Demo (1-Klik)
                </span>
                <div className="grid grid-cols-2 gap-2 w-full">
                  <button
                    type="button"
                    disabled={isLoading || isDemoSubmitting !== null}
                    onClick={() => onDemoLogin("owner")}
                    className="h-9 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 active:bg-indigo-500/30 border border-indigo-400/30 text-indigo-300 hover:text-indigo-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    {isDemoSubmitting === "owner" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    <span>Demo Pemilik (Owner)</span>
                  </button>
                  <button
                    type="button"
                    disabled={isLoading || isDemoSubmitting !== null}
                    onClick={() => onDemoLogin("cashier")}
                    className="h-9 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 active:bg-emerald-500/30 border border-emerald-400/30 text-emerald-300 hover:text-emerald-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm"
                  >
                    {isDemoSubmitting === "cashier" ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    <span>Demo Kasir (Cashier)</span>
                  </button>
                </div>
              </div>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}

export default SpaceLogin;

"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale } from "next-intl";

export interface LogoProps {
  className?: string;
  variant?: "dark" | "light";
  mode?: "full" | "icon";
  size?: "sm" | "md" | "lg" | "xl";
  href?: string;
  priority?: boolean;
}

export function Logo({
  className = "",
  variant = "dark",
  mode = "full",
  size = "md",
  href,
  priority = true,
}: LogoProps) {
  const locale = useLocale();
  const targetHref = href !== undefined ? href : `/${locale}`;
  const isLight = variant === "light";

  // Height mappings per size and mode
  const heightClasses = {
    full: {
      sm: "h-8 sm:h-9",
      md: "h-10 sm:h-12",
      lg: "h-12 sm:h-14",
      xl: "h-16 sm:h-20",
    },
    icon: {
      sm: "h-8 w-8",
      md: "h-10 w-10",
      lg: "h-12 w-12",
      xl: "h-16 w-16",
    },
  };

  const selectedHeight = heightClasses[mode][size];

  const logoSrc =
    mode === "icon"
      ? "/images/logo/logo-emblem.png"
      : isLight
      ? "/images/logo/logo-full-white.png"
      : "/images/logo/logo-full.png";

  const imgWidth = mode === "icon" ? 594 : 693;
  const imgHeight = mode === "icon" ? 578 : 338;

  const imageElement = (
    <div
      className={`relative inline-flex items-center group transition-transform duration-200 hover:scale-[1.02] ${selectedHeight} ${className}`}
    >
      <Image
        src={logoSrc}
        alt="Rahalat Bladna - رحلات بلادنا"
        width={imgWidth}
        height={imgHeight}
        priority={priority}
        className="w-auto h-full object-contain select-none"
      />
    </div>
  );

  if (targetHref === "") {
    return imageElement;
  }

  return (
    <Link
      href={targetHref}
      className="inline-flex items-center"
      aria-label="Rahalat Bladna - رحلات بلادنا"
    >
      {imageElement}
    </Link>
  );
}

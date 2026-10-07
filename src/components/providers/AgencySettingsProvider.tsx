"use client";

import React, { createContext, useContext, useMemo } from "react";
import {
  AgencySettingsData,
  DEFAULT_AGENCY_SETTINGS,
  cleanMoroccanPhoneForWhatsApp,
} from "@/lib/agency";

interface AgencySettingsContextValue {
  settings: AgencySettingsData;
  cleanPhone: string;
  whatsappUrl: (message?: string) => string;
}

const AgencySettingsContext = createContext<AgencySettingsContextValue>({
  settings: DEFAULT_AGENCY_SETTINGS,
  cleanPhone: "212681024758",
  whatsappUrl: (message?: string) => {
    const base = "https://wa.me/212681024758";
    return message ? `${base}?text=${encodeURIComponent(message)}` : base;
  },
});

export function AgencySettingsProvider({
  initialSettings,
  children,
}: {
  initialSettings?: AgencySettingsData | null;
  children: React.ReactNode;
}) {
  const settings = initialSettings || DEFAULT_AGENCY_SETTINGS;

  const value = useMemo(() => {
    const cleanPhone = cleanMoroccanPhoneForWhatsApp(settings.whatsappPhone);

    const whatsappUrl = (message?: string) => {
      const base = `https://wa.me/${cleanPhone}`;
      return message ? `${base}?text=${encodeURIComponent(message)}` : base;
    };

    return {
      settings,
      cleanPhone,
      whatsappUrl,
    };
  }, [settings]);

  return (
    <AgencySettingsContext.Provider value={value}>
      {children}
    </AgencySettingsContext.Provider>
  );
}

export function useAgencySettings() {
  const context = useContext(AgencySettingsContext);
  if (!context) {
    return {
      settings: DEFAULT_AGENCY_SETTINGS,
      cleanPhone: "212681024758",
      whatsappUrl: (message?: string) => {
        const base = "https://wa.me/212681024758";
        return message ? `${base}?text=${encodeURIComponent(message)}` : base;
      },
    };
  }
  return context;
}

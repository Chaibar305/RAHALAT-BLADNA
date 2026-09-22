import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['fr', 'ar', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'fr';

import frMessages from '../../messages/fr.json';
import arMessages from '../../messages/ar.json';
import enMessages from '../../messages/en.json';

const messagesMap: Record<string, any> = {
  fr: frMessages,
  ar: arMessages,
  en: enMessages,
};

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;

  if (!locale || !locales.includes(locale as any)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: messagesMap[locale] || messagesMap[defaultLocale],
  };
});

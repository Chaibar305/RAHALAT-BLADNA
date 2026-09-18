declare module "arabic-persian-reshaper" {
  export const ArabicShaper: {
    convertArabic(text: string): string;
    convertArabicBack(text: string): string;
  };
  const defaultExport: {
    ArabicShaper: {
      convertArabic(text: string): string;
      convertArabicBack(text: string): string;
    };
  };
  export default defaultExport;
}

declare module "bidi-js" {
  export interface EmbeddingLevelsResult {
    paragraphs: { start: number; end: number; level: number }[];
    levels: Uint8Array;
  }

  export interface BidiEngine {
    getEmbeddingLevels(string: string, baseDirection?: "ltr" | "rtl" | "auto"): EmbeddingLevelsResult;
    getReorderedString(
      string: string,
      embedLevelsResult: EmbeddingLevelsResult,
      start?: number,
      end?: number
    ): string;
  }

  export default function bidiFactory(): BidiEngine;
}

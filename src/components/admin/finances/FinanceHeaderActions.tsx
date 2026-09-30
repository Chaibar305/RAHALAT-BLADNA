"use client";

import React, { useState } from "react";
import { Sparkles, FileText, Plus } from "lucide-react";
import { DocumentType } from "@/types/finance";
import { NewFinancialDocumentModal } from "./NewFinancialDocumentModal";

interface FinanceHeaderActionsProps {
  locale: string;
}

export function FinanceHeaderActions({ locale }: FinanceHeaderActionsProps) {
  const isAr = locale === "ar";
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<DocumentType>(DocumentType.QUOTE_B2B);

  const handleOpen = (type: DocumentType) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className="flex items-center gap-2.5 z-10">
        <button
          type="button"
          onClick={() => handleOpen(DocumentType.QUOTE_B2B)}
          className="px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 font-black text-xs sm:text-sm shadow-tp-cyan transition-all active:scale-95 flex items-center gap-2 cursor-pointer"
        >
          <Sparkles className="w-4 h-4" />
          <span>{isAr ? "+ عرض سعر B2B للشركات" : "+ Nouveau Devis B2B"}</span>
        </button>

        <button
          type="button"
          onClick={() => handleOpen(DocumentType.INVOICE)}
          className="px-3.5 sm:px-4 py-2.5 sm:py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs sm:text-sm backdrop-blur-md border border-white/20 transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
        >
          <FileText className="w-3.5 h-3.5 text-tp-cyan" />
          <span className="hidden sm:inline">{isAr ? "فاتورة جديدة" : "Facture"}</span>
        </button>
      </div>

      <NewFinancialDocumentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultType={modalType}
      />
    </>
  );
}

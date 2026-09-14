"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { 
  Building2, Bus, Plus, Trash2, Edit, Save, 
  CheckCircle2, Phone, MapPin, Sparkles, Tag, Users, 
  Compass, Waves, X, MessageCircle, ShieldCheck,
  FileSpreadsheet, Upload, Mail, FileText, AlertCircle
} from "lucide-react";
import { 
  createPartnerAction, 
  updatePartnerAction, 
  deletePartnerAction 
} from "@/actions/partner.actions";
import { PartnerType } from "@prisma/client";
import { exportPartnersToExcel } from "@/lib/excel/partnerExcelService";
import { ImportPartnersModal } from "@/components/admin/partners/ImportPartnersModal";

export interface PartnerItem {
  id: string;
  type: PartnerType;
  companyName: string;
  contactName: string;
  phone: string;
  city: string;
  email?: string | null;
  notes?: string | null;
  rateDetails?: string | null;
  capacity?: number | null;
  vehicleType?: string | null;
  plateNumber?: string | null;
  activityType?: string | null;
}

const ACTIVITY_SUGGESTIONS = [
  "Quad & Buggy Désert",
  "Base Nautique & Jet Ski",
  "Club de Plongée Sous-Marine",
  "Coopérative Barquiers / Bateau",
  "Dromadaires & Balade Équestre",
  "Parapente & Montgolfière",
  "Randonnée & Canyoning Guide",
];

export function PartnerListManager({ initialPartners }: { initialPartners: PartnerItem[] }) {
  const router = useRouter();
  const locale = useLocale();
  const isAr = locale === "ar";
  const [isPending, startTransition] = useTransition();

  const [partners, setPartners] = useState<PartnerItem[]>(initialPartners);
  const [typeFilter, setTypeFilter] = useState<"ALL" | "HOTEL" | "TRANSPORT" | "ACTIVITY">("ALL");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<PartnerItem | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);

  // État du formulaire
  const [formData, setFormData] = useState({
    type: "LEISURE_ACTIVITY" as PartnerType,
    companyName: "",
    contactName: "",
    phone: "",
    city: "Merzouga",
    email: "",
    notes: "",
    rateDetails: "",
    capacity: 20,
    vehicleType: "",
    plateNumber: "",
    activityType: "Quad & Buggy Désert",
  });

  // Filtrage intelligent avec support des alias d'enums
  const filteredPartners = partners.filter((p) => {
    if (typeFilter === "ALL") return true;
    if (typeFilter === "HOTEL") return p.type === "HOTEL_AUBERGE" || p.type === "HOTEL_BIVOUAC";
    if (typeFilter === "TRANSPORT") return p.type === "TRANSPORT_TOURISTIQUE" || p.type === "TRANSPORTER_TIST";
    if (typeFilter === "ACTIVITY") return p.type === "LEISURE_ACTIVITY" || p.type === "ACTIVITE_LOISIR";
    return true;
  });

  const hotelCount = partners.filter((p) => p.type === "HOTEL_AUBERGE" || p.type === "HOTEL_BIVOUAC").length;
  const transportCount = partners.filter((p) => p.type === "TRANSPORT_TOURISTIQUE" || p.type === "TRANSPORTER_TIST").length;
  const activityCount = partners.filter((p) => p.type === "LEISURE_ACTIVITY" || p.type === "ACTIVITE_LOISIR").length;

  const handleOpenCreate = (defaultType?: PartnerType) => {
    setEditingPartner(null);
    setModalError(null);
    const chosenType = defaultType || (typeFilter === "ACTIVITY" ? "LEISURE_ACTIVITY" : typeFilter === "TRANSPORT" ? "TRANSPORT_TOURISTIQUE" : "HOTEL_AUBERGE");
    setFormData({
      type: chosenType,
      companyName: "",
      contactName: "",
      phone: "",
      city: chosenType === "LEISURE_ACTIVITY" ? "Merzouga" : "Casablanca",
      email: "",
      notes: "",
      rateDetails: "",
      capacity: chosenType === "LEISURE_ACTIVITY" ? 20 : chosenType === "TRANSPORT_TOURISTIQUE" ? 48 : 50,
      vehicleType: "",
      plateNumber: "",
      activityType: chosenType === "LEISURE_ACTIVITY" ? "Quad & Buggy Désert" : "",
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: PartnerItem) => {
    setEditingPartner(p);
    setModalError(null);
    setFormData({
      type: p.type,
      companyName: p.companyName,
      contactName: p.contactName,
      phone: p.phone,
      city: p.city,
      email: p.email || "",
      notes: p.notes || "",
      rateDetails: p.rateDetails || "",
      capacity: p.capacity || 0,
      vehicleType: p.vehicleType || "",
      plateNumber: p.plateNumber || "",
      activityType: p.activityType || "",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);

    startTransition(async () => {
      if (editingPartner) {
        const res = await updatePartnerAction(editingPartner.id, formData);
        if (res.success && res.partner) {
          setPartners((prev) =>
            prev.map((item) => (item.id === editingPartner.id ? (res.partner as any) : item))
          );
          setIsModalOpen(false);
          router.refresh();
        } else {
          setModalError(res.error || "Erreur de mise à jour");
        }
      } else {
        const res = await createPartnerAction(formData);
        if (res.success && res.partner) {
          setPartners((prev) => [res.partner as any, ...prev]);
          setIsModalOpen(false);
          router.refresh();
        } else {
          setModalError(res.error || "Erreur de création");
        }
      }
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Supprimer le partenaire "${name}" ?`)) return;

    startTransition(async () => {
      const res = await deletePartnerAction(id);
      if (res.success) {
        setPartners((prev) => prev.filter((p) => p.id !== id));
        router.refresh();
      } else {
        alert("Erreur de suppression : " + (res.error || "Impossible de supprimer ce partenaire"));
      }
    });
  };

  // Exportation Excel
  const handleExportExcel = () => {
    const listToExport = filteredPartners.length > 0 ? filteredPartners : partners;
    const today = new Date().toISOString().split("T")[0];
    const filename = `Partenaires_Rahalat_Bladna_${today}.xlsx`;
    exportPartnersToExcel(listToExport, filename);
  };

  const isActivityType = formData.type === "LEISURE_ACTIVITY" || formData.type === "ACTIVITE_LOISIR";
  const isTransportType = formData.type === "TRANSPORT_TOURISTIQUE" || formData.type === "TRANSPORTER_TIST";
  const isHotelType = formData.type === "HOTEL_AUBERGE" || formData.type === "HOTEL_BIVOUAC";

  return (
    <div className="space-y-6">
      {/* Top Controls & Category Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm transition-colors">
        {/* Onglets de filtrage */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setTypeFilter("ALL")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition ${
              typeFilter === "ALL"
                ? "bg-tp-cyan text-slate-950 shadow-md shadow-tp-cyan/20"
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800"
            }`}
          >
            {isAr ? "جميع الشركاء" : "Tous les Partenaires"} ({partners.length})
          </button>

          <button
            onClick={() => setTypeFilter("ACTIVITY")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
              typeFilter === "ACTIVITY"
                ? "bg-emerald-500 text-slate-950 font-black shadow-md shadow-emerald-500/20"
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <span>🏄‍♂️</span>
            <span>{isAr ? "الأنشطة والترفيه" : "Activités & Loisirs"}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-black/20">{activityCount}</span>
          </button>

          <button
            onClick={() => setTypeFilter("HOTEL")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
              typeFilter === "HOTEL"
                ? "bg-purple-600 dark:bg-purple-500 text-white shadow-purple-500/20"
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-300 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <span>🏨</span>
            <span>{isAr ? "الفنادق والمخيمات" : "Hôtels & Bivouacs"}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-black/20">{hotelCount}</span>
          </button>

          <button
            onClick={() => setTypeFilter("TRANSPORT")}
            className={`px-4 py-2 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 ${
              typeFilter === "TRANSPORT"
                ? "bg-amber-500 text-slate-950 shadow-amber-500/20"
                : "bg-slate-100 dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-300 border border-slate-200 dark:border-slate-800"
            }`}
          >
            <span>🚌</span>
            <span>{isAr ? "النقل السياحي" : "Transporteurs TIST"}</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-black/10 dark:bg-black/20">{transportCount}</span>
          </button>
        </div>

        {/* Groupe d'actions aligné : Exporter, Importer & Nouveau Partenaire */}
        <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
          {/* Bouton Exporter (.xlsx) */}
          <button
            type="button"
            onClick={handleExportExcel}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 text-slate-700 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-xs"
            title="Exporter la liste des partenaires au format Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isAr ? "تصدير (.xlsx)" : "Exporter (.xlsx)"}</span>
          </button>

          {/* Bouton Importer (.xlsx) */}
          <button
            type="button"
            onClick={() => setIsImportModalOpen(true)}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-cyan-500/50 text-slate-700 dark:text-slate-300 hover:text-tp-cyan-hover dark:hover:text-cyan-400 font-semibold text-xs py-2.5 px-4 rounded-xl flex items-center gap-2 transition-all active:scale-95 shadow-xs"
            title="Importer des partenaires en masse depuis un fichier Excel"
          >
            <Upload className="w-4 h-4 text-tp-cyan" />
            <span>{isAr ? "استيراد (.xlsx)" : "Importer (.xlsx)"}</span>
          </button>

          {/* Bouton Nouveau Partenaire */}
          <button
            type="button"
            onClick={() => handleOpenCreate()}
            className="px-5 py-2.5 rounded-2xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 font-black text-xs shadow-md shadow-tp-cyan/20 transition active:scale-95 flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{isAr ? "إضافة شريك جديد" : "Nouveau Partenaire"}</span>
          </button>
        </div>
      </div>

      {/* Partners Grid */}
      {filteredPartners.length === 0 ? (
        <div className="bg-white dark:bg-slate-950 p-12 rounded-3xl border border-slate-200 dark:border-slate-800 text-center text-slate-500 text-xs space-y-3 shadow-sm">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400 flex items-center justify-center mx-auto">
            <Compass className="w-6 h-6" />
          </div>
          <p>{isAr ? "لا يوجد أي شريك مسجل في هذه الفئة" : "Aucun partenaire enregistré dans cette catégorie."}</p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={() => handleOpenCreate()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-tp-cyan-hover dark:text-tp-cyan text-xs font-bold border border-slate-200 dark:border-slate-700"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{isAr ? "إضافة الشريك الأول" : "Créer un partenaire"}</span>
            </button>
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-bold border border-slate-200 dark:border-slate-700"
            >
              <Upload className="w-3.5 h-3.5 text-tp-cyan" />
              <span>{isAr ? "استيراد من إكسيل" : "Importer via Excel"}</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {filteredPartners.map((partner) => {
            const isActivity = partner.type === "LEISURE_ACTIVITY" || partner.type === "ACTIVITE_LOISIR";
            const isTransport = partner.type === "TRANSPORT_TOURISTIQUE" || partner.type === "TRANSPORTER_TIST";
            const isHotel = partner.type === "HOTEL_AUBERGE" || partner.type === "HOTEL_BIVOUAC";

            return (
              <div
                key={partner.id}
                className="bg-white dark:bg-slate-950 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-300 dark:hover:border-slate-700 transition shadow-sm relative overflow-hidden group"
              >
                <div className="space-y-3">
                  {/* Top line badge & City */}
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase font-mono tracking-wider ${
                            isActivity
                              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30"
                              : isHotel
                              ? "bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/30"
                              : "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                          }`}
                        >
                          {isActivity
                            ? "🏄‍♂️ Activité & Loisir"
                            : isHotel
                            ? "🏨 Hôtel / Bivouac"
                            : "🚌 Transport TIST"}
                        </span>

                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-bold flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-tp-cyan" />
                          <span>{partner.city}</span>
                        </span>
                      </div>

                      <h3 className="text-base font-black text-slate-900 dark:text-white mt-1.5 flex items-center gap-2">
                        <span>{partner.companyName}</span>
                      </h3>

                      {/* Tag d'activité spécifique */}
                      {isActivity && partner.activityType && (
                        <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-tp-cyan/10 border border-tp-cyan/20 text-tp-cyan-hover dark:text-tp-cyan text-[11px] font-bold mt-1">
                          <Waves className="w-3 h-3" />
                          <span>{partner.activityType}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(partner)}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs transition"
                        title="Modifier"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(partner.id, partner.companyName)}
                        className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/30 text-xs transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Operational Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div>
                      <p className="text-slate-500 text-[10px] uppercase font-bold">Contact Responsable</p>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">{partner.contactName}</p>
                      <a
                        href={`https://wa.me/${partner.phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 dark:text-emerald-400 hover:underline text-[11px] font-mono flex items-center gap-1 mt-0.5"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>{partner.phone}</span>
                      </a>
                      {partner.email && (
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate mt-0.5 flex items-center gap-1">
                          <Mail className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500 shrink-0" />
                          <span className="truncate">{partner.email}</span>
                        </p>
                      )}
                    </div>

                    <div>
                      {isActivity ? (
                        <>
                          <p className="text-slate-500 text-[10px] uppercase font-bold">Capacité & Matériel</p>
                          <p className="font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm mt-0.5">
                            {partner.capacity || 20} pers. / session
                          </p>
                          {partner.plateNumber && (
                            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono truncate">
                              Agrément : {partner.plateNumber}
                            </p>
                          )}
                        </>
                      ) : isTransport ? (
                        <>
                          <p className="text-slate-500 text-[10px] uppercase font-bold">Véhicule & Immat.</p>
                          <p className="font-bold text-slate-900 dark:text-white mt-0.5 truncate">{partner.vehicleType || "Autocar TIST"}</p>
                          <p className="text-amber-600 dark:text-amber-400 text-[11px] font-mono">{partner.plateNumber || "Agrément TIST"}</p>
                        </>
                      ) : (
                        <>
                          <p className="text-slate-500 text-[10px] uppercase font-bold">Capacité hébergement</p>
                          <p className="font-black text-purple-600 dark:text-purple-400 text-sm mt-0.5">{partner.capacity || 50} places</p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Tarifs négociés & Conditions */}
                  {partner.rateDetails && (
                    <div className="text-[11px] text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/40 p-3 rounded-xl border border-slate-200 dark:border-slate-800/80">
                      <span className="font-bold text-slate-500 dark:text-slate-400">Tarifs & Inclusions : </span>
                      <span>{partner.rateDetails}</span>
                    </div>
                  )}

                  {/* Notes & Conventions */}
                  {partner.notes && (
                    <div className="text-[10px] text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-950/60 p-2 rounded-lg border border-slate-200 dark:border-slate-800 flex items-start gap-1.5">
                      <FileText className="w-3 h-3 text-slate-400 dark:text-slate-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{partner.notes}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-7 max-w-lg w-full space-y-5 shadow-2xl max-h-[92dvh] overflow-y-auto relative my-auto transition-colors">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-5 end-5 p-2 rounded-full text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="space-y-1 pe-8">
              <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                {editingPartner ? "Modifier le Partenaire" : "Nouveau Partenaire Prestataire"}
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Enregistrez un prestataire d&apos;activité, un transporteur ou un hôtel avec ses tarifs négociés.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Inline Error Banner */}
              {modalError && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-400">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-[11px] uppercase tracking-wide mb-0.5">Erreur d&apos;enregistrement</p>
                    <p className="text-[11px] break-words">{modalError}</p>
                  </div>
                  <button type="button" onClick={() => setModalError(null)} className="ml-auto shrink-0 text-red-500 hover:text-red-700">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Type Selector Tabs */}
              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 font-bold">Catégorie du partenaire *</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "LEISURE_ACTIVITY", activityType: formData.activityType || "Quad & Buggy Désert" })}
                    className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition ${
                      isActivityType
                        ? "bg-emerald-500/15 border-emerald-500 text-emerald-700 dark:text-emerald-300"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="text-base mb-0.5">🏄‍♂️</div>
                    <span>Activité & Loisir</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "HOTEL_AUBERGE" })}
                    className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition ${
                      isHotelType
                        ? "bg-purple-500/15 border-purple-500 text-purple-700 dark:text-purple-300"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="text-base mb-0.5">🏨</div>
                    <span>Hôtel & Bivouac</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, type: "TRANSPORT_TOURISTIQUE" })}
                    className={`p-2.5 rounded-xl border text-center font-bold text-[11px] transition ${
                      isTransportType
                        ? "bg-amber-500/15 border-amber-500 text-amber-700 dark:text-amber-300"
                        : "bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                    }`}
                  >
                    <div className="text-base mb-0.5">🚌</div>
                    <span>Transport TIST</span>
                  </button>
                </div>
              </div>

              {/* Entreprise & Ville */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Nom de la société / club *</label>
                  <input
                    type="text"
                    required
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-tp-cyan rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
                    placeholder={isActivityType ? "Ex: Dunes Quad Merzouga" : isTransportType ? "Ex: Trans Atlas Voyages" : "Ex: Kasbah Hotel Yasmina"}
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Ville / Région *</label>
                  <input
                    type="text"
                    required
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-tp-cyan rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
                    placeholder="Ex: Merzouga, Dakhla, Marrakech"
                  />
                </div>
              </div>

              {/* Responsable & Téléphone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Nom du contact / Responsable *</label>
                  <input
                    type="text"
                    required
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-tp-cyan rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
                    placeholder="Ex: Karim Benali"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Téléphone / WhatsApp *</label>
                  <input
                    type="text"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-tp-cyan rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none font-mono"
                    placeholder="Ex: +212 661-123456"
                  />
                </div>
              </div>

              {/* Email officiel */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Email officiel de contact</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-tp-cyan rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none font-mono"
                  placeholder="Ex: contact@etablissement.ma"
                />
              </div>

              {/* CHAMPS SPÉCIFIQUES : ACTIVITÉS & LOISIRS */}
              {isActivityType && (
                <div className="p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                  <div>
                    <label className="block text-emerald-600 dark:text-emerald-400 font-bold mb-1">
                      Spécialité & Type d&apos;Activité *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.activityType}
                      onChange={(e) => setFormData({ ...formData, activityType: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2.5 text-slate-900 dark:text-white outline-none"
                      placeholder="Ex: Quad & Buggy, Club de Plongée, Jet Ski..."
                    />

                    {/* Suggestions rapides cliquables */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {ACTIVITY_SUGGESTIONS.map((sug) => (
                        <button
                          key={sug}
                          type="button"
                          onClick={() => setFormData({ ...formData, activityType: sug })}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition ${
                            formData.activityType === sug
                              ? "bg-emerald-500 text-slate-950"
                              : "bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800"
                          }`}
                        >
                          {sug}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        Capacité max par créneau (pers.)
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none font-mono"
                        placeholder="Ex: 20"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                        N° Agrément / Assurance RC Pro
                      </label>
                      <input
                        type="text"
                        value={formData.plateNumber}
                        onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-emerald-500 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none font-mono"
                        placeholder="Ex: Assurance AXA RC N° 890214"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* CHAMPS SPÉCIFIQUES : TRANSPORTEURS */}
              {isTransportType && (
                <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-amber-600 dark:text-amber-400 font-bold mb-1">Type de véhicule touristique</label>
                      <input
                        type="text"
                        value={formData.vehicleType}
                        onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none"
                        placeholder="Ex: Autocar 48 places Mercedes Travego"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Places assises</label>
                      <input
                        type="number"
                        value={formData.capacity}
                        onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                        className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none font-mono"
                        placeholder="48"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">Immatriculation TIST</label>
                    <input
                      type="text"
                      value={formData.plateNumber}
                      onChange={(e) => setFormData({ ...formData, plateNumber: e.target.value })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-amber-500 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none font-mono"
                      placeholder="Ex: 45210|A|6"
                    />
                  </div>
                </div>
              )}

              {/* CHAMPS SPÉCIFIQUES : HÔTELS & BIVOUACS */}
              {isHotelType && (
                <div className="p-4 rounded-2xl bg-purple-500/5 border border-purple-500/20 space-y-3">
                  <div>
                    <label className="block text-purple-600 dark:text-purple-400 font-bold mb-1">Capacité d&apos;hébergement (places/lits)</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                      className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-purple-500 rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none font-mono"
                      placeholder="Ex: 60"
                    />
                  </div>
                </div>
              )}

              {/* Tarifs négociés & Conditions */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Tarifs négociés B2B & Conditions d&apos;annulation
                </label>
                <textarea
                  rows={2}
                  value={formData.rateDetails}
                  onChange={(e) => setFormData({ ...formData, rateDetails: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-tp-cyan rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none"
                  placeholder={
                    isActivityType
                      ? "Ex: 350 MAD / quad 1h avec guide, casques et essence inclus. Gratuité pour l'accompagnateur."
                      : isTransportType
                      ? "Ex: 4 500 MAD / forfait 3 jours carburant, péages et hébergement chauffeur inclus."
                      : "Ex: 450 MAD / nuit en demi-pension par personne en chambre double."
                  }
                />
              </div>

              {/* Notes & Conventions */}
              <div>
                <label className="block text-slate-700 dark:text-slate-300 font-bold mb-1">
                  Notes & Conventions internes (Optionnel)
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-800 focus:border-tp-cyan rounded-xl px-3.5 py-2 text-slate-900 dark:text-white outline-none"
                  placeholder="Ex: Contrat cadre signé en 2026. Acompte de 30% requis à la confirmation."
                />
              </div>

              {/* Actions de Soumission */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold transition"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="px-5 py-2.5 rounded-xl bg-tp-cyan hover:bg-tp-cyan-hover text-white dark:text-slate-950 font-black shadow-md shadow-tp-cyan/20 transition active:scale-95 disabled:opacity-50"
                >
                  {isPending ? "Enregistrement..." : editingPartner ? "Mettre à jour" : "Créer le partenaire"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modale d'Importation Excel (.xlsx) */}
      <ImportPartnersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          router.refresh();
        }}
      />
    </div>
  );
}

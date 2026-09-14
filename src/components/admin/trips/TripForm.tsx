"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { 
  Save, ArrowLeft, Plus, Trash2, ArrowUp, ArrowDown, 
  Sparkles, Image as ImageIcon, MapPin, Calendar, 
  DollarSign, CheckCircle2, AlertCircle, Eye, BedDouble, 
  Bus, Tag, UtensilsCrossed, ShieldCheck, Clock, Layers, Navigation,
  Check, X, Luggage, Flame, Compass
} from "lucide-react";
import { TripFormData, ItineraryDayData, DepartureDateAdminData, PickupPointAdminData } from "@/lib/validations/trip.schema";
import { createTripAction, updateTripAction } from "@/actions/trip.actions";
import { R2ImageUploader } from "@/components/admin/R2ImageUploader";
import { formatMAD } from "@/lib/utils";

interface TripFormProps {
  initialData?: Partial<TripFormData>;
  isEditing?: boolean;
}

export function TripForm({ initialData, isEditing = false }: TripFormProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [activeTab, setActiveTab] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<TripFormData>({
    id: initialData?.id,
    titleFr: initialData?.titleFr || "",
    titleAr: initialData?.titleAr || "",
    titleEn: initialData?.titleEn || "",
    slug: initialData?.slug || "",
    tripType: (initialData?.tripType as any) || "SAHARA_SPECIAL",
    destinationRegion: initialData?.destinationRegion || "Merzouga / Drâa-Tafilalet",
    departureCity: initialData?.departureCity || "Casablanca & Rabat",
    durationDays: initialData?.durationDays || 3,
    durationNights: initialData?.durationNights || 2,
    basePrice: initialData?.basePrice || 1450,
    depositPerPerson: initialData?.depositPerPerson || 500,
    singleSupplement: initialData?.singleSupplement || 350,
    coverImageUrl: initialData?.coverImageUrl || "/images/merzouga/cover-merzouga.jpg",
    shortDescriptionFr: initialData?.shortDescriptionFr || "Immersion féerique dans les plus hautes dunes du Sahara marocain.",
    shortDescriptionAr: initialData?.shortDescriptionAr || "",
    longDescriptionFr: initialData?.longDescriptionFr || initialData?.overviewFr || "",
    longDescriptionAr: initialData?.longDescriptionAr || initialData?.overviewAr || "",
    overviewFr: initialData?.overviewFr?.trim() 
      ? initialData.overviewFr 
      : (initialData?.longDescriptionFr || initialData?.shortDescriptionFr || ""),
    overviewAr: initialData?.overviewAr?.trim() 
      ? initialData.overviewAr 
      : (initialData?.longDescriptionAr || initialData?.shortDescriptionAr || ""),
    showOverview: initialData?.showOverview ?? true,
    isGuaranteed: initialData?.isGuaranteed ?? true,
    isBestSeller: initialData?.isBestSeller ?? true,
    isScheduledThisWeek: initialData?.isScheduledThisWeek ?? false,
    featuredWeekMessage: initialData?.featuredWeekMessage || "",
    isPublished: initialData?.isPublished ?? true,
    pickupPoints: initialData?.pickupPoints && initialData.pickupPoints.length > 0
      ? initialData.pickupPoints
      : (isEditing ? [] : [
          { cityName: "Casablanca", city: "Casablanca", locationName: "Gare Casa-Voyageurs", departureTime: "05:30", meetingTime: "05:30", orderIndex: 0 },
          { cityName: "Rabat", city: "Rabat", locationName: "Gare Rabat-Agdal", departureTime: "06:45", meetingTime: "06:45", orderIndex: 1 },
        ]),
    itineraryDays: initialData?.itineraryDays && initialData.itineraryDays.length > 0
      ? initialData.itineraryDays
      : (isEditing ? [] : [
          {
            dayNumber: 1,
            titleFr: "Traversée du Moyen Atlas & Arrivée aux Gorges du Todra",
            titleAr: "عبور الأطلس المتوسط والوصول إلى مضايق تودغى",
            location: "Gorges du Todra / Tinghir",
            featuredImage: "/images/merzouga/gorges-todra.jpg",
            meals: ["BREAKFAST", "DINNER"],
            descriptionFr: "Départ matinal, halte panoramique dans la cédraie d'Ifrane et découverte pédestre des vertigineuses Gorges du Todra.",
            descriptionAr: "انطلاق صباحي، توقف بأزرو ثم استكشاف مضايق تودغى.",
            activityTags: ["Gorges du Todra", "Cédraie d'Ifrane"],
            addons: [],
          },
          {
            dayNumber: 2,
            titleFr: "Caravane de Dromadaires, Coucher de Soleil & Bivouac de Luxe",
            titleAr: "قافلة الجمال، غروب الشمس والمبيت في مخيم صحراوي فاخر",
            location: "Dunes Erg Chebbi / Merzouga",
            featuredImage: "/images/merzouga/bivouac-luxe.jpg",
            meals: ["BREAKFAST", "DINNER"],
            descriptionFr: "Balade à dos de dromadaire au coucher du soleil, dîner traditionnel sous les étoiles et soirée feu de camp Gnawa.",
            descriptionAr: "جولة بالجمال فوق الرمال وسهرة كناوية حول النار.",
            activityTags: ["Erg Chebbi", "Dromadaires", "Bivouac"],
            addons: [
              { titleFr: "Tour en Quad 1h dans les dunes", titleAr: "جولة بدراجات الكواد ساعة كاملة", price: 400, isOptional: true },
            ],
          },
          {
            dayNumber: 3,
            titleFr: "Lever de Soleil sur les Dunes, Visite de Khamlia & Retour",
            titleAr: "شروق الشمس، زيارة قرية خملية والعودة",
            location: "Village Khamlia / Rissani",
            featuredImage: "/images/merzouga/khamlia-gnawa.jpg",
            meals: ["BREAKFAST"],
            descriptionFr: "Spectacle du lever de soleil sur les crêtes, immersion culturelle au village Khamlia et retour confortable en autocar TIST.",
            descriptionAr: "مشاهدة شروق الشمس، زيارة قرية خملية والعودة.",
            activityTags: ["Lever de soleil", "Khamlia Gnawa"],
            addons: [],
          },
        ]),
    departures: initialData?.departures && initialData.departures.length > 0
      ? initialData.departures
      : (isEditing ? [] : [
          { startDate: "2026-09-15", endDate: "2026-09-17", totalSeats: 18, bookedSeats: 16, status: "ALMOST_FULL", specificPrice: initialData?.basePrice || 1450, tourLeaderName: "Hassan Alami" },
          { startDate: "2026-09-22", endDate: "2026-09-24", totalSeats: 18, bookedSeats: 18, status: "GUARANTEED", specificPrice: initialData?.basePrice || 1450, tourLeaderName: "Yassine Bennani" },
        ]),
    includedServices: initialData?.includedServices && initialData.includedServices.length > 0
      ? initialData.includedServices
      : (initialData?.includedServicesFr && initialData.includedServicesFr.length > 0
          ? initialData.includedServicesFr
          : (isEditing ? [] : [
              "Transport touristique climatisé grand confort (TIST)",
              "Hébergement en tentes équipées ou hôtel sélectionné",
              "Pension complète ou demi-pension selon programme",
              "Guide accompagnateur professionnel certifié",
              "Assurance assistance voyage incluse",
            ])),
    includedServicesFr: initialData?.includedServicesFr || [],
    includedServicesAr: initialData?.includedServicesAr || [],
    excludedServices: initialData?.excludedServices && initialData.excludedServices.length > 0
      ? initialData.excludedServices
      : (initialData?.excludedServicesFr && initialData.excludedServicesFr.length > 0
          ? initialData.excludedServicesFr
          : (isEditing ? [] : [
              "Déjeuners libres lors des escales de trajet",
              "Boissons et dépenses personnelles",
              "Pourboires pour l'équipe locale et chauffeur",
              "Activités et excursions optionnelles",
            ])),
    excludedServicesFr: initialData?.excludedServicesFr || [],
    excludedServicesAr: initialData?.excludedServicesAr || [],
    whatToBring: initialData?.whatToBring && initialData.whatToBring.length > 0
      ? initialData.whatToBring
      : (initialData?.checklistItemsFr && initialData.checklistItemsFr.length > 0
          ? initialData.checklistItemsFr
          : (isEditing ? [] : [
              "Carte d'Identité Nationale (CIN) ou Passeport original",
              "Chaussures confortables de marche ou aquatiques",
              "Tenue chaude pour la nuit et légère pour le jour",
              "Crème solaire, lunettes de soleil et casquette",
              "Petite pharmacie personnelle et serviette microfibre",
            ])),
    checklistItemsFr: initialData?.checklistItemsFr || [],
    checklistItemsAr: initialData?.checklistItemsAr || [],
  });

  // Slug generator helper
  const handleAutoSlug = () => {
    if (!formData.titleFr) return;
    const slug = formData.titleFr
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)+/g, "");
    setFormData({ ...formData, slug });
  };

  // Day handlers
  const handleAddDay = () => {
    const nextDayNum = formData.itineraryDays.length + 1;
    const newDay: ItineraryDayData = {
      dayNumber: nextDayNum,
      titleFr: `Étape du Jour ${nextDayNum}`,
      titleAr: `برنامج اليوم ${nextDayNum}`,
      timeSlot: "08h30 - 18h00",
      locationName: formData.destinationRegion || "Destination Étape",
      location: formData.destinationRegion || "Destination Étape",
      featuredImage: formData.coverImageUrl || "/images/asfalou/cover-asfalou.jpg",
      meals: ["BREAKFAST", "DINNER"],
      descriptionFr: "Description des visites et activités programmées pour cette journée.",
      descriptionAr: "وصف الأنشطة والزيارات المبرمجة لهذا اليوم.",
      activityTags: ["Visite guidée", "Photos"],
      addons: [],
    };
    setFormData({
      ...formData,
      itineraryDays: [...formData.itineraryDays, newDay],
      durationDays: Math.max(formData.durationDays, nextDayNum),
    });
  };

  const handleRemoveDay = (index: number) => {
    const updated = formData.itineraryDays.filter((_, i) => i !== index).map((d, i) => ({
      ...d,
      dayNumber: i + 1,
    }));
    setFormData({ ...formData, itineraryDays: updated });
  };

  const handleMoveDay = (index: number, direction: "UP" | "DOWN") => {
    const newIndex = direction === "UP" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.itineraryDays.length) return;

    const days = [...formData.itineraryDays];
    const temp = days[index];
    days[index] = days[newIndex];
    days[newIndex] = temp;

    const renumbered = days.map((d, i) => ({ ...d, dayNumber: i + 1 }));
    setFormData({ ...formData, itineraryDays: renumbered });
  };

  // Pickup point handlers
  const handleAddPickupPoint = () => {
    const defaultCities = ["Casablanca", "Rabat", "Kénitra", "Fès", "Meknès", "Marrakech", "Tanger"];
    const existingCities = formData.pickupPoints.map((p) => p.cityName);
    const nextCity = defaultCities.find((c) => !existingCities.includes(c)) || "Autre Ville";
    
    const newPoint: PickupPointAdminData = {
      cityName: nextCity,
      city: nextCity,
      locationName: `Gare ${nextCity} ou point central`,
      departureTime: "07:00",
      meetingTime: "07:00",
      googleMapsUrl: "",
      orderIndex: formData.pickupPoints.length,
    };

    setFormData({
      ...formData,
      pickupPoints: [...formData.pickupPoints, newPoint],
    });
  };

  const handleRemovePickupPoint = (index: number) => {
    const updated = formData.pickupPoints.filter((_, i) => i !== index).map((p, i) => ({
      ...p,
      orderIndex: i,
    }));
    setFormData({ ...formData, pickupPoints: updated });
  };

  const handleMovePickupPoint = (index: number, direction: "UP" | "DOWN") => {
    const newIndex = direction === "UP" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= formData.pickupPoints.length) return;

    const points = [...formData.pickupPoints];
    const temp = points[index];
    points[index] = points[newIndex];
    points[newIndex] = temp;

    const reordered = points.map((p, i) => ({ ...p, orderIndex: i }));
    setFormData({ ...formData, pickupPoints: reordered });
  };

  // Departure handler
  const handleAddDeparture = () => {
    const newDep: DepartureDateAdminData = {
      startDate: new Date().toISOString().split("T")[0],
      endDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      totalSeats: 18,
      bookedSeats: 0,
      status: "OPEN",
      specificPrice: formData.basePrice,
      tourLeaderName: "Guide Officiel",
    };
    setFormData({
      ...formData,
      departures: [...formData.departures, newDep],
    });
  };

  const handleRemoveDeparture = (index: number) => {
    setFormData({
      ...formData,
      departures: formData.departures.filter((_, i) => i !== index),
    });
  };

  // Local inputs for Services & Équipements
  const [newIncludedInput, setNewIncludedInput] = useState("");
  const [newExcludedInput, setNewExcludedInput] = useState("");
  const [newWhatToBringInput, setNewWhatToBringInput] = useState("");

  const suggestedIncludedTags = [
    "Transport touristique climatisé grand confort (TIST)",
    "Hébergement sélectionné (Hôtel 4★ ou Bivouac de luxe)",
    "Demi-pension (Dîner traditionnel & Petit-déjeuner)",
    "Pension complète selon le programme",
    "Session Kayak et gilets de sauvetage homologués",
    "Balade à dos de dromadaire au coucher de soleil",
    "Soirée musicale feu de camp sous les étoiles",
    "Guide accompagnateur officiel certifié",
    "Assurance assistance voyage incluse",
  ];

  const suggestedExcludedTags = [
    "Déjeuners libres lors des escales routières",
    "Boissons et dépenses personnelles",
    "Pourboires pour chauffeur et équipe locale",
    "Session Quad 1h ou Buggy dans les dunes",
    "Excursion 4x4 Tour des Dunes & Oasis",
    "Supplément chambre individuelle (single)",
  ];

  const suggestedWhatToBringTags = [
    "Carte d'Identité Nationale (CIN) ou Passeport original obligatoire",
    "Chaussures aquatiques fermées pour l'eau et rochers",
    "Chaussures confortables pour la marche et randonnée",
    "Maillot de bain, serviette microfibre et casquette",
    "Crème solaire indice 50 et lunettes de soleil",
    "Vêtement chaud (veste / polaire) pour les soirées fraîches",
    "Batterie externe portable (Powerbank) & lampe torche",
    "Petite trousse de premiers soins et pharmacie personnelle",
  ];

  // Included Services Handlers
  const handleAddIncluded = (itemText?: string) => {
    const text = (itemText || newIncludedInput).trim();
    if (!text) return;
    const current = formData.includedServices || [];
    if (current.includes(text)) return;
    const updated = [...current, text];
    setFormData({
      ...formData,
      includedServices: updated,
      includedServicesFr: updated,
    });
    if (!itemText) setNewIncludedInput("");
  };

  const handleRemoveIncluded = (index: number) => {
    const current = formData.includedServices || [];
    const updated = current.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      includedServices: updated,
      includedServicesFr: updated,
    });
  };

  const handleMoveIncluded = (index: number, direction: "UP" | "DOWN") => {
    const current = [...(formData.includedServices || [])];
    const newIndex = direction === "UP" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= current.length) return;
    const temp = current[index];
    current[index] = current[newIndex];
    current[newIndex] = temp;
    setFormData({
      ...formData,
      includedServices: current,
      includedServicesFr: current,
    });
  };

  const handleUpdateIncluded = (index: number, val: string) => {
    const current = [...(formData.includedServices || [])];
    current[index] = val;
    setFormData({
      ...formData,
      includedServices: current,
      includedServicesFr: current,
    });
  };

  // Excluded Services Handlers
  const handleAddExcluded = (itemText?: string) => {
    const text = (itemText || newExcludedInput).trim();
    if (!text) return;
    const current = formData.excludedServices || [];
    if (current.includes(text)) return;
    const updated = [...current, text];
    setFormData({
      ...formData,
      excludedServices: updated,
      excludedServicesFr: updated,
    });
    if (!itemText) setNewExcludedInput("");
  };

  const handleRemoveExcluded = (index: number) => {
    const current = formData.excludedServices || [];
    const updated = current.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      excludedServices: updated,
      excludedServicesFr: updated,
    });
  };

  const handleMoveExcluded = (index: number, direction: "UP" | "DOWN") => {
    const current = [...(formData.excludedServices || [])];
    const newIndex = direction === "UP" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= current.length) return;
    const temp = current[index];
    current[index] = current[newIndex];
    current[newIndex] = temp;
    setFormData({
      ...formData,
      excludedServices: current,
      excludedServicesFr: current,
    });
  };

  const handleUpdateExcluded = (index: number, val: string) => {
    const current = [...(formData.excludedServices || [])];
    current[index] = val;
    setFormData({
      ...formData,
      excludedServices: current,
      excludedServicesFr: current,
    });
  };

  // What To Bring Handlers
  const handleAddWhatToBring = (itemText?: string) => {
    const text = (itemText || newWhatToBringInput).trim();
    if (!text) return;
    const current = formData.whatToBring || [];
    if (current.includes(text)) return;
    const updated = [...current, text];
    setFormData({
      ...formData,
      whatToBring: updated,
      checklistItemsFr: updated,
    });
    if (!itemText) setNewWhatToBringInput("");
  };

  const handleRemoveWhatToBring = (index: number) => {
    const current = formData.whatToBring || [];
    const updated = current.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      whatToBring: updated,
      checklistItemsFr: updated,
    });
  };

  const handleMoveWhatToBring = (index: number, direction: "UP" | "DOWN") => {
    const current = [...(formData.whatToBring || [])];
    const newIndex = direction === "UP" ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= current.length) return;
    const temp = current[index];
    current[index] = current[newIndex];
    current[newIndex] = temp;
    setFormData({
      ...formData,
      whatToBring: current,
      checklistItemsFr: current,
    });
  };

  const handleUpdateWhatToBring = (index: number, val: string) => {
    const current = [...(formData.whatToBring || [])];
    current[index] = val;
    setFormData({
      ...formData,
      whatToBring: current,
      checklistItemsFr: current,
    });
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      try {
        const res = isEditing && formData.id
          ? await updateTripAction(formData.id, formData)
          : await createTripAction(formData);

        if (res.success) {
          setSuccessMsg("Circuit enregistré avec succès !");
          setTimeout(() => {
            router.push(`/${locale}/admin/trips`);
          }, 1000);
        } else {
          setErrorMsg("Veuillez vérifier les champs obligatoires du formulaire.");
        }
      } catch (err: any) {
        setErrorMsg(err.message || "Une erreur est survenue lors de l'enregistrement.");
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 text-slate-900 dark:text-slate-100">
      {/* Top Action Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/admin/trips`}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
          </Link>
          <div>
            <h1 className="text-slate-900 dark:text-white font-black text-xl">
              {isEditing ? (isAr ? "تعديل البرنامج السياحي" : "Modifier le Circuit") : (isAr ? "إنشاء برنامج سياحي جديد" : "Nouveau Circuit")}
            </h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs">
              {formData.titleFr || "Saisissez les détails du voyage"}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {formData.slug && (
            <Link
              href={`/${locale}/trips/${formData.slug}`}
              target="_blank"
              className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs border border-slate-200 dark:border-slate-700 flex items-center gap-2 transition"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>{isAr ? "معاينة" : "Aperçu en ligne"}</span>
            </Link>
          )}

          <button
            type="submit"
            disabled={isPending}
            className="px-6 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95 flex items-center gap-2 disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{isPending ? "Enregistrement..." : "Enregistrer"}</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/30 text-red-700 dark:text-red-400 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-1.5 shadow-sm gap-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab(1)}
          className={`flex-1 min-w-[140px] py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 1
              ? "bg-cyan-500 text-slate-950 font-bold shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
          }`}
        >
          <Layers className="w-4 h-4 shrink-0" />
          <span className="truncate">{isAr ? "1. البيانات والأسعار" : "1. Données & Tarifs"}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(2)}
          className={`flex-1 min-w-[160px] py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 2
              ? "bg-cyan-500 text-slate-950 font-bold shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
          }`}
        >
          <Clock className="w-4 h-4 shrink-0" />
          <span className="truncate">{isAr ? "2. البرنامج والمواعيد" : "2. Programme & Horaires"}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ${
            activeTab === 2
              ? "bg-slate-950/20 text-slate-950"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}>
            {formData.itineraryDays.length}J
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(3)}
          className={`flex-1 min-w-[160px] py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 3
              ? "bg-cyan-500 text-slate-950 font-bold shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
          }`}
        >
          <Bus className="w-4 h-4 shrink-0" />
          <span className="truncate">{isAr ? "3. نقاط التجمع" : "3. Points de Ramassage"}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ${
            activeTab === 3
              ? "bg-slate-950/20 text-slate-950"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}>
            {formData.pickupPoints.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(4)}
          className={`flex-1 min-w-[170px] py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 4
              ? "bg-cyan-500 text-slate-950 font-bold shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
          }`}
        >
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span className="truncate">{isAr ? "4. الخدمات والمعدات" : "4. Services & Équipements"}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ${
            activeTab === 4
              ? "bg-slate-950/20 text-slate-950"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}>
            {(formData.includedServices?.length || 0) + (formData.excludedServices?.length || 0)}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab(5)}
          className={`flex-1 min-w-[150px] py-3 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 ${
            activeTab === 5
              ? "bg-cyan-500 text-slate-950 font-bold shadow-md"
              : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/60"
          }`}
        >
          <Calendar className="w-4 h-4 shrink-0" />
          <span className="truncate">{isAr ? "5. المواعيد والمقاعد" : "5. Départs & Allotements"}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono font-bold shrink-0 ${
            activeTab === 5
              ? "bg-slate-950/20 text-slate-950"
              : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
          }`}>
            {formData.departures.length}
          </span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: DONNÉES GÉNÉRALES & TARIFS */}
      {/* ======================================================== */}
      {activeTab === 1 && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6 space-y-5">
            <h2 className="text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-4 h-4" />
              <span>Informations Générales & Titres Bilingues</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5">
                  Titre du Circuit (Français) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Magie du Désert : Dunes de Merzouga (3J/2N)"
                  value={formData.titleFr}
                  onChange={(e) => setFormData({ ...formData, titleFr: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5">
                  Titre du Circuit (Arabe) *
                </label>
                <input
                  type="text"
                  required
                  dir="rtl"
                  placeholder="مثال: سحر الصحراء : رمال مرزوكة ومضايق تودغى"
                  value={formData.titleAr}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5">
                    Slug d&apos;URL Unique *
                  </label>
                  <button
                    type="button"
                    onClick={handleAutoSlug}
                    className="text-[11px] text-cyan-600 dark:text-cyan-400 hover:underline font-bold"
                  >
                    Générer auto
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="magie-desert-merzouga"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5">
                  Type de Voyage *
                </label>
                <select
                  value={formData.tripType}
                  onChange={(e) => setFormData({ ...formData, tripType: e.target.value as any })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
                >
                  <option value="SAHARA_SPECIAL">Bivouac & Sahara Spécial</option>
                  <option value="WEEKEND_BREAK">Escapade Week-end (2J/1N)</option>
                  <option value="MULTI_DAY_TOUR">Grand Circuit Découverte (3J+)</option>
                  <option value="TREKKING_HIKING">Randonnée & Aventure Atlas</option>
                  <option value="DAY_TRIP">Excursion Journée</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5">
                  Région de Destination *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Merzouga / Drâa-Tafilalet"
                  value={formData.destinationRegion}
                  onChange={(e) => setFormData({ ...formData, destinationRegion: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <R2ImageUploader
                label="Image de Couverture Principale (Cloudflare R2)"
                folder="trips"
                value={formData.coverImageUrl}
                onChange={(url) => setFormData({ ...formData, coverImageUrl: url })}
                aspectRatio="video"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5">
                  Nombre de Jours
                </label>
                <input
                  type="number"
                  min={1}
                  value={formData.durationDays}
                  onChange={(e) => setFormData({ ...formData, durationDays: parseInt(e.target.value) || 1 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5">
                  Nombre de Nuits
                </label>
                <input
                  type="number"
                  min={0}
                  value={formData.durationNights}
                  onChange={(e) => setFormData({ ...formData, durationNights: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
                />
              </div>
            </div>
          </div>

          {/* Section: Aperçu du Voyage & Philosophie (Storytelling & Vision) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-500/10 dark:bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
                  <Compass className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                    <span>Aperçu du Voyage & Philosophie</span>
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Présentez l&apos;esprit du voyage, l&apos;atmosphère des lieux et le récit d&apos;immersion mis en avant sur la fiche publique.
                  </p>
                </div>
              </div>

              {/* Toggle Switch: showOverview */}
              <div className="flex items-center gap-3 bg-slate-50 dark:bg-slate-950 p-2 sm:p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 self-start sm:self-auto">
                <div className="text-right">
                  <span className="text-xs font-bold block text-slate-800 dark:text-slate-200">
                    {formData.showOverview ? "Section Active" : "Section Masquée"}
                  </span>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 block">
                    Visibilité fiche publique
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.showOverview ?? true}
                    onChange={(e) => setFormData({ ...formData, showOverview: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-cyan-500"></div>
                </label>
              </div>
            </div>

            {/* Warning / Hint when disabled */}
            {!(formData.showOverview ?? true) && (
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>La section « Aperçu du Voyage & Philosophie » sera masquée sur la fiche publique pour ce circuit.</span>
              </div>
            )}

            {/* Bilingue Textareas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* French Overview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold">
                    Aperçu & Philosophie (Français)
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {(formData.overviewFr || "").length} car.
                  </span>
                </div>
                <textarea
                  rows={6}
                  value={formData.overviewFr || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      overviewFr: val,
                      longDescriptionFr: val,
                    });
                  }}
                  placeholder="Ex: Partez pour une immersion dépaysante entre sommets majestueux, eaux turquoise et bivouac de charme. Ce séjour combine le dépassement de soi et la détente absolue au cœur de paysages à couper le souffle..."
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm leading-relaxed transition-all resize-y"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Conseil : Séparez vos paragraphes par une ligne vide pour une mise en page aérée avec citation en exergue sur la fiche publique.
                </p>
              </div>

              {/* Arabic Overview */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-slate-700 dark:text-slate-300 text-xs font-bold">
                    نظرة عامة على التجربة وفلسفة السفر (العربية)
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {(formData.overviewAr || "").length} حرف
                  </span>
                </div>
                <textarea
                  rows={6}
                  dir="rtl"
                  value={formData.overviewAr || ""}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({
                      ...formData,
                      overviewAr: val,
                      longDescriptionAr: val,
                    });
                  }}
                  placeholder="مثال: انطلقوا في رحلة استثنائية تجمع بين روعة القمم الشاهقة والمياه الفيروزية للساحل المتوسطي، لتجديد الطاقة واكتشاف سحر المغرب الأصيل..."
                  className="w-full p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm leading-relaxed transition-all resize-y"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 text-right">
                  نصيحة: افصل الفقرات بسطر فارغ لتنسيق النص بشكل جميل وجذاب للقارئ.
                </p>
              </div>
            </div>
          </div>

          {/* Tarifs & Statuts */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-sm mb-6 space-y-5">
            <h2 className="text-cyan-600 dark:text-cyan-400 font-bold text-xs uppercase tracking-wider flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              <span>Tarification & Conditions d&apos;Acompte (MAD)</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold">
                  Prix de Base par Personne *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={50}
                    required
                    value={formData.basePrice}
                    onChange={(e) => setFormData({ ...formData, basePrice: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-black text-cyan-600 dark:text-cyan-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">DH</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold">
                  Acompte Requis Aujourd&apos;hui *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={100}
                    required
                    value={formData.depositPerPerson}
                    onChange={(e) => setFormData({ ...formData, depositPerPerson: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-black text-emerald-600 dark:text-emerald-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">DH</span>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold">
                  Supplément Chambre Single *
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.singleSupplement}
                    onChange={(e) => setFormData({ ...formData, singleSupplement: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-sm font-black text-amber-600 dark:text-amber-400 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
                  />
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">DH</span>
                </div>
              </div>
            </div>

            {/* Badges Toggle Switches */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Départ Garanti</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Affiche le badge vert menthe</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isGuaranteed}
                  onChange={(e) => setFormData({ ...formData, isGuaranteed: e.target.checked })}
                  className="w-5 h-5 rounded text-cyan-600 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Coup de Cœur</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Mise en avant sur l&apos;accueil</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isBestSeller}
                  onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                  className="w-5 h-5 rounded text-cyan-600 focus:ring-cyan-500"
                />
              </label>

              <label className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-slate-300 dark:hover:border-slate-700 transition">
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">Publié en Ligne</p>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">Visible par les voyageurs</p>
                </div>
                <input
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                  className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500"
                />
              </label>
            </div>

            {/* Départ Vedette du Week-end (Circuit Planifié cette Semaine) */}
            <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 dark:from-amber-950/20 dark:to-slate-950 border border-amber-500/30 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-sm shadow-amber-500/30">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 dark:text-white">
                      Circuit Planifié cette Semaine (Départ Vedette du Week-end)
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Met ce circuit en vedette immédiate sur la plateforme et redirige intelligemment les visiteurs vers ce départ garanti.
                    </p>
                  </div>
                </div>

                <label className="relative inline-flex items-center cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={formData.isScheduledThisWeek}
                    onChange={(e) => setFormData({ ...formData, isScheduledThisWeek: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-12 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {formData.isScheduledThisWeek && (
                <div className="pt-3 border-t border-amber-500/20 space-y-2 animate-in fade-in duration-200">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Message Informatif Personnalisé (affiché en bannière client)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Il ne reste que 6 places pour ce week-end ! Départ garanti vendredi à 20h30."
                    value={formData.featuredWeekMessage || ""}
                    onChange={(e) => setFormData({ ...formData, featuredWeekMessage: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white text-sm outline-none focus:ring-2 focus:ring-amber-500/30"
                    maxLength={120}
                  />
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Exemples : &quot;Il ne reste que 6 places pour ce week-end !&quot; ou &quot;Départ garanti ce vendredi soir — Dernières chambres doubles.&quot;
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: PROGRAMME JOUR PAR JOUR & GALERIE SYNCHRONISÉE */}
      {/* ======================================================== */}
      {activeTab === 2 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>Itinéraire & Programme Jour par Jour</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Chaque étape synchronise automatiquement la galerie d&apos;images et les extras disponibles.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddDay}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter un Jour</span>
            </button>
          </div>

          {formData.itineraryDays.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center space-y-3">
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                Aucune étape configurée pour ce circuit.
              </p>
              <button
                type="button"
                onClick={handleAddDay}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs transition"
              >
                Ajouter la première étape (Jour 1)
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.itineraryDays.map((day, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-sm mb-6"
                >
                  {/* Day Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-cyan-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-xs">
                        J{day.dayNumber}
                      </span>
                      <h3 className="font-black text-slate-900 dark:text-white text-sm">
                        {day.titleFr || `Jour ${day.dayNumber}`}
                      </h3>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveDay(index, "UP")}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 transition"
                        title="Monter"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === formData.itineraryDays.length - 1}
                        onClick={() => handleMoveDay(index, "DOWN")}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 transition"
                        title="Descendre"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveDay(index)}
                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition"
                        title="Supprimer ce jour"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Day Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5">
                        Titre de l&apos;étape (FR) *
                      </label>
                      <input
                        type="text"
                        required
                        value={day.titleFr}
                        onChange={(e) => {
                          const days = [...formData.itineraryDays];
                          days[index].titleFr = e.target.value;
                          setFormData({ ...formData, itineraryDays: days });
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5">
                        Titre de l&apos;étape (AR) *
                      </label>
                      <input
                        type="text"
                        required
                        dir="rtl"
                        value={day.titleAr}
                        onChange={(e) => {
                          const days = [...formData.itineraryDays];
                          days[index].titleAr = e.target.value;
                          setFormData({ ...formData, itineraryDays: days });
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5">
                          Localisation / Ville étape *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="Ex: Gorges du Todra / Tinghir"
                          value={day.location}
                          onChange={(e) => {
                            const days = [...formData.itineraryDays];
                            days[index].location = e.target.value;
                            setFormData({ ...formData, itineraryDays: days });
                          }}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                          <span>Plage Horaire / Horaires de l&apos;étape</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Ex: 18h30 - 23h30 ou 09h00 - 13h00"
                          value={day.timeSlot || ""}
                          onChange={(e) => {
                            const days = [...formData.itineraryDays];
                            days[index].timeSlot = e.target.value;
                            setFormData({ ...formData, itineraryDays: days });
                          }}
                          className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-sm placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <R2ImageUploader
                        label={`Image Vedette de l'Étape J${day.dayNumber} (Cloudflare R2)`}
                        folder="trips"
                        value={day.featuredImage}
                        onChange={(url) => {
                          const days = [...formData.itineraryDays];
                          days[index].featuredImage = url;
                          setFormData({ ...formData, itineraryDays: days });
                        }}
                        aspectRatio="video"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5">
                        Programme détaillé de la journée (FR) *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={day.descriptionFr}
                        onChange={(e) => {
                          const days = [...formData.itineraryDays];
                          days[index].descriptionFr = e.target.value;
                          setFormData({ ...formData, itineraryDays: days });
                        }}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5">
                        Programme détaillé de la journée (AR) *
                      </label>
                      <textarea
                        rows={3}
                        required
                        dir="rtl"
                        value={day.descriptionAr}
                        onChange={(e) => {
                          const days = [...formData.itineraryDays];
                          days[index].descriptionAr = e.target.value;
                          setFormData({ ...formData, itineraryDays: days });
                        }}
                        className="w-full p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: POINTS DE RAMASSAGE & HORAIRES PRÉCIS */}
      {/* ======================================================== */}
      {activeTab === 3 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Bus className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>{isAr ? "نقاط التجمع ومواعيد الانطلاق المحددة" : "Points de Ramassage & Horaires de Rassemblement"}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr
                  ? "تحديد مسار الحافلة بدقة، مدن الانطلاق، أماكن اللقاء المحددة وساعة التجمع لكل نقطة."
                  : "Configurez l'itinéraire de ramassage du bus avec les villes de départ, lieux précis de rendez-vous et heures exactes de convocation."}
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddPickupPoint}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>{isAr ? "إضافة نقطة تجمع" : "Ajouter un Point de Ramassage"}</span>
            </button>
          </div>

          {/* Route Sequence Ribbon */}
          {formData.pickupPoints.length > 0 && (
            <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center gap-3 overflow-x-auto">
              <span className="text-[11px] font-black uppercase text-slate-500 dark:text-slate-400 tracking-wider shrink-0 flex items-center gap-1.5">
                <Navigation className="w-3.5 h-3.5 text-cyan-500" />
                {isAr ? "مسار التوقفات :" : "Itinéraire du ramassage :"}
              </span>
              <div className="flex items-center gap-2 shrink-0">
                {formData.pickupPoints.map((pt, idx) => (
                  <React.Fragment key={idx}>
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 shadow-2xs">
                      <span className="w-4 h-4 rounded-full bg-cyan-500 text-slate-950 text-[10px] font-black flex items-center justify-center">
                        {idx + 1}
                      </span>
                      <span>{pt.cityName || "Ville"}</span>
                      <span className="text-[10px] text-cyan-600 dark:text-cyan-400 font-mono">
                        ({pt.departureTime || "--:--"})
                      </span>
                    </div>
                    {idx < formData.pickupPoints.length - 1 && (
                      <span className="text-slate-400 font-bold text-xs">→</span>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}

          {formData.pickupPoints.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 p-8 text-center space-y-3">
              <Bus className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto" />
              <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                {isAr ? "لم يتم تحديد أي نقطة تجمع لهذا البرنامج بعد." : "Aucun point de ramassage configuré pour ce circuit."}
              </p>
              <button
                type="button"
                onClick={handleAddPickupPoint}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs transition"
              >
                {isAr ? "إضافة أول نقطة انطلاق" : "Ajouter le premier point de ramassage"}
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {formData.pickupPoints.map((pt, index) => (
                <div
                  key={index}
                  className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 sm:p-6 space-y-4 shadow-sm"
                >
                  {/* Point Header */}
                  <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-cyan-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-xs">
                        #{index + 1}
                      </span>
                      <div>
                        <h3 className="font-black text-slate-900 dark:text-white text-sm flex items-center gap-2">
                          <span>{pt.cityName || (isAr ? `نقطة ${index + 1}` : `Arrêt ${index + 1}`)}</span>
                          {pt.departureTime && (
                            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20">
                              {pt.departureTime}
                            </span>
                          )}
                        </h3>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {pt.locationName || (isAr ? "المكان الدقيق غير محدد" : "Lieu précis non renseigné")}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMovePickupPoint(index, "UP")}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 transition"
                        title="Monter l&apos;arrêt"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === formData.pickupPoints.length - 1}
                        onClick={() => handleMovePickupPoint(index, "DOWN")}
                        className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-30 text-slate-700 dark:text-slate-300 transition"
                        title="Descendre l&apos;arrêt"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemovePickupPoint(index)}
                        className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition"
                        title="Supprimer cet arrêt"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Point Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5">
                        {isAr ? "مدينة الانطلاق *" : "Ville de Ramassage *"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Casablanca, Rabat, Fès..."
                        value={pt.cityName}
                        onChange={(e) => {
                          const pts = [...formData.pickupPoints];
                          pts[index].cityName = e.target.value;
                          pts[index].city = e.target.value;
                          setFormData({ ...formData, pickupPoints: pts });
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5">
                        {isAr ? "مكان اللقاء الدقيق / النقطة المرجعية *" : "Lieu Précis de Rendez-vous / Repère *"}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={isAr ? "مثال: أمام محطة الدار البيضاء المسافرين (فندق إيبيس)" : "Ex: Devant la gare Casa-Voyageurs (Hôtel Ibis)"}
                        value={pt.locationName}
                        onChange={(e) => {
                          const pts = [...formData.pickupPoints];
                          pts[index].locationName = e.target.value;
                          setFormData({ ...formData, pickupPoints: pts });
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none text-sm transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span>{isAr ? "ساعة التجمع الدقيقة *" : "Heure Précise de Rassemblement *"}</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: 05:30 ou 18:30"
                        value={pt.departureTime}
                        onChange={(e) => {
                          const pts = [...formData.pickupPoints];
                          pts[index].departureTime = e.target.value;
                          pts[index].meetingTime = e.target.value;
                          setFormData({ ...formData, pickupPoints: pts });
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white font-mono text-sm placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-slate-700 dark:text-slate-300 text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        <span>{isAr ? "رابط خريطة جوجل (اختياري)" : "Lien Google Maps (Optionnel)"}</span>
                      </label>
                      <input
                        type="url"
                        placeholder="https://maps.google.com/..."
                        value={pt.googleMapsUrl || ""}
                        onChange={(e) => {
                          const pts = [...formData.pickupPoints];
                          pts[index].googleMapsUrl = e.target.value;
                          setFormData({ ...formData, pickupPoints: pts });
                        }}
                        className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white text-xs placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: SERVICES INCLUS, NON INCLUS & CE QU'IL FAUT APPORTER */}
      {/* ======================================================== */}
      {activeTab === 4 && (
        <div className="space-y-6">
          {/* Header Banner */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>{isAr ? "الخدمات المشمولة، غير المشمولة ولائحة الأمتعة" : "Services Inclus, Non Inclus & Équipements"}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isAr 
                  ? "تتم مزامنة هذه المعطيات مباشرة وتلقائياً مع صفحة البرنامج السياحي المعروضة للزبائن." 
                  : "Ces listes sont immédiatement synchronisées avec la fiche publique du circuit (/trips/[slug]). Cliquez sur les suggestions pour ajouter rapidement."}
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/30">
                {formData.includedServices?.length || 0} Inclus
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30">
                {formData.excludedServices?.length || 0} Non Inclus
              </span>
              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-500/30">
                {formData.whatToBring?.length || 0} Équipements
              </span>
            </div>
          </div>

          {/* 1. SERVICES INCLUS */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-emerald-100 dark:border-emerald-900/30 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span>{isAr ? "الخدمات المشمولة في السعر (Services Inclus)" : "Prestations Incluses (Services Inclus)"}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr 
                    ? "كل ما هو مدفوع ومضمون للمسافر ضمن سعر التذكرة (نقل سياحي، مبيت، وجبات، تأطير...)." 
                    : "Prestations prises en charge par l'agence (Transport, Hébergement, Repas, Guide officiel, Activités...)."}
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 self-start sm:self-center">
                {formData.includedServices?.length || 0} élément(s)
              </span>
            </div>

            {/* Suggestions Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isAr ? "اقتراحات سريعة للإضافة بنقرة واحدة :" : "Suggestions rapides (cliquez pour ajouter) :"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedIncludedTags.map((tag, idx) => {
                  const isAdded = (formData.includedServices || []).includes(tag);
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddIncluded(tag)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                        isAdded
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60"
                          : "bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 active:scale-95"
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Add Form */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={isAr ? "أضف خدمة مشمولة جديدة (مثال: نزهة بالقوارب، وجبة غداء شواء...)" : "Saisir une prestation incluse personnalisée..."}
                value={newIncludedInput}
                onChange={(e) => setNewIncludedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddIncluded();
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-sm transition"
              />
              <button
                type="button"
                onClick={() => handleAddIncluded()}
                className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? "إضافة" : "Ajouter"}</span>
              </button>
            </div>

            {/* List of Included Items */}
            <div className="space-y-2">
              {(!formData.includedServices || formData.includedServices.length === 0) ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
                  {isAr ? "لا توجد خدمات مشمولة محددة حتى الآن. انقر على الاقتراحات أعلاه للبدء." : "Aucune prestation incluse configurée. Cliquez sur les suggestions ci-dessus pour en ajouter."}
                </div>
              ) : (
                formData.includedServices.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-emerald-400 dark:hover:border-emerald-600 transition group"
                  >
                    <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleUpdateIncluded(index, e.target.value)}
                      className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white outline-none font-medium focus:bg-white dark:focus:bg-slate-900 px-2 py-1 rounded"
                    />

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveIncluded(index, "UP")}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 transition"
                        title="Monter"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === formData.includedServices.length - 1}
                        onClick={() => handleMoveIncluded(index, "DOWN")}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 transition"
                        title="Descendre"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveIncluded(index)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 2. SERVICES NON INCLUS */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-rose-200 dark:border-rose-900/40 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-rose-100 dark:border-rose-900/30 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <X className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                  <span>{isAr ? "الخدمات غير المشمولة (Services Non Inclus)" : "Prestations Non Incluses (Services Non Inclus)"}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr 
                    ? "مصاريف إضافية أو أنشطة اختيارية يتحملها الزبون على نفقته الخاصة (وجبات حرة، إكراميات، كواد...)." 
                    : "Frais restant à la charge du voyageur ou suppléments optionnels (Déjeuners libres, Pourboires, Boissons...)."}
                </p>
              </div>
              <span className="text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-500/10 px-3 py-1 rounded-full border border-rose-200 dark:border-rose-500/20 self-start sm:self-center">
                {formData.excludedServices?.length || 0} élément(s)
              </span>
            </div>

            {/* Suggestions Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isAr ? "اقتراحات سريعة للإضافة بنقرة واحدة :" : "Suggestions rapides (cliquez pour ajouter) :"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedExcludedTags.map((tag, idx) => {
                  const isAdded = (formData.excludedServices || []).includes(tag);
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddExcluded(tag)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                        isAdded
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60"
                          : "bg-rose-50/60 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/50 active:scale-95"
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Add Form */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={isAr ? "أضف خدمة غير مشمولة (مثال: مصاريف شخصية، إكراميات...)" : "Saisir une prestation non incluse..."}
                value={newExcludedInput}
                onChange={(e) => setNewExcludedInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddExcluded();
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none text-sm transition"
              />
              <button
                type="button"
                onClick={() => handleAddExcluded()}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? "إضافة" : "Ajouter"}</span>
              </button>
            </div>

            {/* List of Excluded Items */}
            <div className="space-y-2">
              {(!formData.excludedServices || formData.excludedServices.length === 0) ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
                  {isAr ? "لا توجد عناصر غير مشمولة محددة حتى الآن." : "Aucune prestation non incluse configurée."}
                </div>
              ) : (
                formData.excludedServices.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-rose-400 dark:hover:border-rose-600 transition group"
                  >
                    <span className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleUpdateExcluded(index, e.target.value)}
                      className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white outline-none font-medium focus:bg-white dark:focus:bg-slate-900 px-2 py-1 rounded"
                    />

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveExcluded(index, "UP")}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 transition"
                        title="Monter"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === formData.excludedServices.length - 1}
                        onClick={() => handleMoveExcluded(index, "DOWN")}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 transition"
                        title="Descendre"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExcluded(index)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* 3. QUE FAUT-IL APPORTER AVEC VOUS ? */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-amber-200 dark:border-amber-900/40 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-amber-100 dark:border-amber-900/30 pb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Luggage className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                  <span>{isAr ? "ماذا تأخذ معك في الرحلة ؟ (المعدات والوثائق)" : "Que faut-il apporter avec vous ? (Équipements conseillés)"}</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isAr 
                    ? "الوثائق الإلزامية كبطاقة الهوية، والملابس المناسبة والأحذية المائية للحفاظ على سلامة وراحة المسافر." 
                    : "Documents d'identité obligatoires, vêtements adaptés, protection solaire et matériel recommandé."}
                </p>
              </div>
              <span className="text-xs font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-500/10 px-3 py-1 rounded-full border border-amber-200 dark:border-amber-500/20 self-start sm:self-center">
                {formData.whatToBring?.length || 0} élément(s)
              </span>
            </div>

            {/* Suggestions Chips */}
            <div className="space-y-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {isAr ? "اقتراحات سريعة للإضافة بنقرة واحدة :" : "Suggestions rapides (cliquez pour ajouter) :"}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {suggestedWhatToBringTags.map((tag, idx) => {
                  const isAdded = (formData.whatToBring || []).includes(tag);
                  return (
                    <button
                      key={idx}
                      type="button"
                      disabled={isAdded}
                      onClick={() => handleAddWhatToBring(tag)}
                      className={`text-xs px-2.5 py-1 rounded-lg border transition flex items-center gap-1 ${
                        isAdded
                          ? "bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60"
                          : "bg-amber-50/60 dark:bg-amber-950/30 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/50 active:scale-95"
                      }`}
                    >
                      <Plus className="w-3 h-3" />
                      <span>{tag}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Input Add Form */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={isAr ? "أضف تجهيزات موصى بها (مثال: حذاء مائي، معطف واق...)" : "Saisir un équipement ou document conseillé..."}
                value={newWhatToBringInput}
                onChange={(e) => setNewWhatToBringInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddWhatToBring();
                  }
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 outline-none text-sm transition"
              />
              <button
                type="button"
                onClick={() => handleAddWhatToBring()}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center gap-1.5 transition active:scale-95 shadow-sm shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>{isAr ? "إضافة" : "Ajouter"}</span>
              </button>
            </div>

            {/* List of What To Bring Items */}
            <div className="space-y-2">
              {(!formData.whatToBring || formData.whatToBring.length === 0) ? (
                <div className="text-center py-6 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500">
                  {isAr ? "لم يتم تحديد أي معدات موصى بها بعد." : "Aucun équipement recommandé configuré."}
                </div>
              ) : (
                formData.whatToBring.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 hover:border-amber-400 dark:hover:border-amber-600 transition group"
                  >
                    <span className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 font-bold text-xs flex items-center justify-center shrink-0">
                      {index + 1}
                    </span>

                    <input
                      type="text"
                      value={item}
                      onChange={(e) => handleUpdateWhatToBring(index, e.target.value)}
                      className="flex-1 bg-transparent border-none text-xs sm:text-sm text-slate-900 dark:text-white outline-none font-medium focus:bg-white dark:focus:bg-slate-900 px-2 py-1 rounded"
                    />

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        disabled={index === 0}
                        onClick={() => handleMoveWhatToBring(index, "UP")}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 transition"
                        title="Monter"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={index === formData.whatToBring.length - 1}
                        onClick={() => handleMoveWhatToBring(index, "DOWN")}
                        className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500 disabled:opacity-30 transition"
                        title="Descendre"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveWhatToBring(index)}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Supprimer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 5: DATES DE DÉPARTS & ALLOTEMENTS */}
      {/* ======================================================== */}
      {activeTab === 5 && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm mb-6">
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                <span>Gestion des Dates de Départs & Remplissage</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configurez les départs garantis, le nombre de places et les guides assignés.
              </p>
            </div>

            <button
              type="button"
              onClick={handleAddDeparture}
              className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-slate-950 font-bold text-xs flex items-center gap-2 transition active:scale-95 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>Ajouter une Date</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm p-4 sm:p-6 space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-start">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-[11px] uppercase tracking-wider font-bold bg-slate-50 dark:bg-slate-950/60">
                    <th className="py-3 px-3 text-start">Date Début</th>
                    <th className="py-3 px-3 text-start">Date Fin</th>
                    <th className="py-3 px-3 text-center">Capacité Totale</th>
                    <th className="py-3 px-3 text-center">Places Réservées</th>
                    <th className="py-3 px-3 text-start">Statut</th>
                    <th className="py-3 px-3 text-start">Guide TIST</th>
                    <th className="py-3 px-3 text-end">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-medium">
                  {formData.departures.map((dep, index) => (
                    <tr key={index} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/60 transition">
                      <td className="py-3 px-3">
                        <input
                          type="date"
                          value={dep.startDate}
                          onChange={(e) => {
                            const deps = [...formData.departures];
                            deps[index].startDate = e.target.value;
                            setFormData({ ...formData, departures: deps });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="date"
                          value={dep.endDate}
                          onChange={(e) => {
                            const deps = [...formData.departures];
                            deps[index].endDate = e.target.value;
                            setFormData({ ...formData, departures: deps });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min={1}
                          value={dep.totalSeats}
                          onChange={(e) => {
                            const deps = [...formData.departures];
                            deps[index].totalSeats = parseInt(e.target.value) || 18;
                            setFormData({ ...formData, departures: deps });
                          }}
                          className="w-16 text-center px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                        />
                      </td>
                      <td className="py-3 px-3 text-center">
                        <input
                          type="number"
                          min={0}
                          value={dep.bookedSeats}
                          onChange={(e) => {
                            const deps = [...formData.departures];
                            deps[index].bookedSeats = parseInt(e.target.value) || 0;
                            setFormData({ ...formData, departures: deps });
                          }}
                          className="w-16 text-center px-2 py-1 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-emerald-600 dark:text-emerald-400 font-bold focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                        />
                      </td>
                      <td className="py-3 px-3">
                        <select
                          value={dep.status}
                          onChange={(e) => {
                            const deps = [...formData.departures];
                            deps[index].status = e.target.value as any;
                            setFormData({ ...formData, departures: deps });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                        >
                          <option value="OPEN">Ouvert à la réservation</option>
                          <option value="GUARANTEED">Départ Garanti (100%)</option>
                          <option value="ALMOST_FULL">Dernières Places</option>
                          <option value="SOLD_OUT">Complet (Sold Out)</option>
                        </select>
                      </td>
                      <td className="py-3 px-3">
                        <input
                          type="text"
                          placeholder="Nom du Guide"
                          value={dep.tourLeaderName || ""}
                          onChange={(e) => {
                            const deps = [...formData.departures];
                            deps[index].tourLeaderName = e.target.value;
                            setFormData({ ...formData, departures: deps });
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:bg-white dark:focus:bg-slate-900 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 outline-none"
                        />
                      </td>
                      <td className="py-3 px-3 text-end">
                        <button
                          type="button"
                          onClick={() => handleRemoveDeparture(index)}
                          className="p-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 hover:bg-red-100 dark:hover:bg-red-500/20 text-red-600 dark:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </form>
  );
}

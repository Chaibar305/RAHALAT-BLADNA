"use client";

import React, { useState, useMemo } from "react";
import { useLocale } from "next-intl";
import { 
  Users, Search, Filter, Download, Star, ExternalLink, 
  Phone, Mail, MapPin, Calendar, Clock, FileText, CheckCircle2, 
  XCircle, AlertCircle, Eye, Trash2, ArrowRight, UserCheck, 
  LayoutList, Columns, MessageSquare, Loader2, X, ChevronDown 
} from "lucide-react";
import { 
  updateJobApplicationStatusAction, 
  updateJobApplicationNotesAndScoreAction, 
  getSignedCvUrlAction, 
  deleteJobApplicationAction, 
  convertApplicationToTeamMemberAction 
} from "@/actions/recruitment.actions";

interface ApplicationData {
  id: string;
  jobPostingId: string;
  fullName: string;
  email: string;
  phone: string;
  city: string | null;
  coverMessage: string | null;
  cvFileUrl: string;
  cvFileName: string;
  cvFileSize: number;
  portfolioLinks: string[];
  availability: string | null;
  status: "NOUVELLE" | "EN_EXAMEN" | "ENTRETIEN_PROGRAMME" | "ACCEPTEE" | "REFUSEE" | "ARCHIVEE";
  internalNotes: string | null;
  ratedScore: number | null;
  createdAt: string;
  jobPosting: {
    id: string;
    title: string;
    role: string | null;
    department: string | null;
    employmentType: string;
  };
}

interface AdminApplicationsManagerProps {
  initialApplications: ApplicationData[];
  initialJobPostings: { id: string; title: string }[];
  initialStatusCounts: Record<string, number>;
}

const STATUS_CONFIG: Record<
  string, 
  { label: string; color: string; bg: string; border: string }
> = {
  NOUVELLE: { label: "Nouvelle", color: "text-blue-700 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-950/50", border: "border-blue-200 dark:border-blue-800" },
  EN_EXAMEN: { label: "En examen", color: "text-amber-700 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-950/50", border: "border-amber-200 dark:border-amber-800" },
  ENTRETIEN_PROGRAMME: { label: "Entretien prévu", color: "text-purple-700 dark:text-purple-400", bg: "bg-purple-50 dark:bg-purple-950/50", border: "border-purple-200 dark:border-purple-800" },
  ACCEPTEE: { label: "Acceptée", color: "text-emerald-700 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-950/50", border: "border-emerald-200 dark:border-emerald-800" },
  REFUSEE: { label: "Refusée", color: "text-rose-700 dark:text-rose-400", bg: "bg-rose-50 dark:bg-rose-950/50", border: "border-rose-200 dark:border-rose-800" },
  ARCHIVEE: { label: "Archivée", color: "text-slate-600 dark:text-slate-400", bg: "bg-slate-100 dark:bg-slate-800", border: "border-slate-200 dark:border-slate-700" },
};

export function AdminApplicationsManager({
  initialApplications,
  initialJobPostings,
  initialStatusCounts,
}: AdminApplicationsManagerProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [applications, setApplications] = useState<ApplicationData[]>(initialApplications);
  const [selectedJobId, setSelectedJobId] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "kanban">("table");

  // Candidat sélectionné pour le tiroir de détail
  const [activeApp, setActiveApp] = useState<ApplicationData | null>(null);
  const [isLoadingCv, setIsLoadingCv] = useState(false);
  const [internalNotesInput, setInternalNotesInput] = useState("");
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  // Modal de conversion en membre d'équipe
  const [convertModalApp, setConvertModalApp] = useState<ApplicationData | null>(null);
  const [targetTeamRole, setTargetTeamRole] = useState<string>("TOUR_LEADER");
  const [convertNotes, setConvertNotes] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState<string | null>(null);
  const [convertSuccessMsg, setConvertSuccessMsg] = useState<string | null>(null);

  // Filtrage
  const filteredApps = useMemo(() => {
    return applications.filter((app) => {
      if (selectedJobId !== "ALL" && app.jobPostingId !== selectedJobId) return false;
      if (selectedStatus !== "ALL" && app.status !== selectedStatus) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          app.fullName.toLowerCase().includes(q) ||
          app.email.toLowerCase().includes(q) ||
          app.phone.includes(q) ||
          (app.city && app.city.toLowerCase().includes(q)) ||
          app.jobPosting.title.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [applications, selectedJobId, selectedStatus, searchQuery]);

  // Ouverture tiroir
  const handleOpenDetail = (app: ApplicationData) => {
    setActiveApp(app);
    setInternalNotesInput(app.internalNotes || "");
  };

  // Téléchargement sécurisé du CV
  const handleDownloadCv = async (applicationId: string) => {
    setIsLoadingCv(true);
    try {
      const res = await getSignedCvUrlAction(applicationId);
      if (res.success && res.signedUrl) {
        window.open(res.signedUrl, "_blank", "noopener,noreferrer");
      } else {
        alert(res.error || "Impossible de générer le lien de téléchargement du CV.");
      }
    } catch (e) {
      alert("Erreur réseau lors de la récupération du CV.");
    } finally {
      setIsLoadingCv(false);
    }
  };

  // Changement de statut
  const handleStatusChange = async (appId: string, newStatus: any) => {
    try {
      const res = await updateJobApplicationStatusAction(appId, newStatus);
      if (res.success) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, status: newStatus } : a))
        );
        if (activeApp && activeApp.id === appId) {
          setActiveApp({ ...activeApp, status: newStatus });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Notation score (1-5)
  const handleScoreChange = async (appId: string, score: number) => {
    try {
      const res = await updateJobApplicationNotesAndScoreAction(appId, { ratedScore: score });
      if (res.success) {
        setApplications((prev) =>
          prev.map((a) => (a.id === appId ? { ...a, ratedScore: score } : a))
        );
        if (activeApp && activeApp.id === appId) {
          setActiveApp({ ...activeApp, ratedScore: score });
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Sauvegarde des notes internes
  const handleSaveNotes = async () => {
    if (!activeApp) return;
    setIsSavingNotes(true);
    try {
      const res = await updateJobApplicationNotesAndScoreAction(activeApp.id, {
        internalNotes: internalNotesInput,
      });
      if (res.success) {
        setApplications((prev) =>
          prev.map((a) => (a.id === activeApp.id ? { ...a, internalNotes: internalNotesInput } : a))
        );
        setActiveApp({ ...activeApp, internalNotes: internalNotesInput });
      }
    } finally {
      setIsSavingNotes(false);
    }
  };

  // Suppression d'une candidature
  const handleDeleteApp = async (appId: string, candidateName: string) => {
    if (!window.confirm(`Supprimer définitivement la candidature de ${candidateName} et son CV PDF ?`)) {
      return;
    }

    const res = await deleteJobApplicationAction(appId);
    if (res.success) {
      setApplications(applications.filter((a) => a.id !== appId));
      if (activeApp?.id === appId) setActiveApp(null);
    } else {
      alert(res.error || "Erreur lors de la suppression.");
    }
  };

  // Conversion en membre d'équipe
  const handleOpenConvertModal = (app: ApplicationData) => {
    setConvertModalApp(app);
    setConvertError(null);
    setConvertSuccessMsg(null);
    setConvertNotes("");

    // Présélection intelligente selon le rôle de l'offre
    if (app.jobPosting.role === "CHAUFFEUR") setTargetTeamRole("DRIVER");
    else if (app.jobPosting.role === "ORGANISATEUR") setTargetTeamRole("ORGANIZER");
    else if (app.jobPosting.role === "GUIDE_ANIMATEUR") setTargetTeamRole("TOUR_LEADER");
    else setTargetTeamRole("TOUR_LEADER");
  };

  const handleExecuteConvert = async () => {
    if (!convertModalApp) return;
    setIsConverting(true);
    setConvertError(null);

    try {
      const res = await convertApplicationToTeamMemberAction({
        applicationId: convertModalApp.id,
        targetRole: targetTeamRole as any,
        notes: convertNotes,
      });

      if (!res.success) {
        throw new Error(res.error);
      }

      setConvertSuccessMsg(res.message || null);
      setApplications((prev) =>
        prev.map((a) => (a.id === convertModalApp.id ? { ...a, status: "ACCEPTEE" } : a))
      );

      setTimeout(() => {
        setConvertModalApp(null);
      }, 2000);
    } catch (err: any) {
      setConvertError(err.message || "Erreur lors de la conversion.");
    } finally {
      setIsConverting(false);
    }
  };

  // Export CSV
  const handleExportCsv = () => {
    const headers = [
      "ID",
      "Nom complet",
      "Email",
      "Téléphone",
      "Ville",
      "Offre d'emploi",
      "Statut",
      "Note (1-5)",
      "Date de candidature",
    ];

    const rows = filteredApps.map((a) => [
      `"${a.id}"`,
      `"${a.fullName.replace(/"/g, '""')}"`,
      `"${a.email}"`,
      `"${a.phone}"`,
      `"${(a.city || "").replace(/"/g, '""')}"`,
      `"${a.jobPosting.title.replace(/"/g, '""')}"`,
      `"${a.status}"`,
      `"${a.ratedScore || ""}"`,
      `"${new Date(a.createdAt).toLocaleDateString("fr-FR")}"`,
    ]);

    const csvContent = "\uFEFF" + [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `candidatures-rahalat-bladna-${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* EN-TÊTE ET STATISTIQUES */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Users className="w-6 h-6 text-tp-cyan" />
            <span>{isAr ? "إدارة طلبات الترشح والسير الذاتية" : "Gestion des Candidatures RH"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? "مراجعة ملفات المترشحين، فحص السير الذاتية PDF، تقييم الكفاءات وتحويل المقبولين إلى أعضاء فريق العمل."
              : "Examinez les profils, téléchargez les CV PDF sécurisés, notez et convertissez directement en membres d'équipe."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Bascule Vue Table / Kanban */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-2xl">
            <button
              onClick={() => setViewMode("table")}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === "table"
                  ? "bg-white dark:bg-slate-700 text-tp-midnight dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden md:inline">Tableau</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                viewMode === "kanban"
                  ? "bg-white dark:bg-slate-700 text-tp-midnight dark:text-white shadow-xs"
                  : "text-slate-500 hover:text-slate-700"
              }`}
            >
              <Columns className="w-4 h-4" />
              <span className="hidden md:inline">Pipeline</span>
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white text-xs font-bold transition shadow-xs"
            title="Exporter en CSV"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* FILTRES PAR OFFRE ET STATUTS */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Recherche textuelle */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone, ville..."
            className="w-full h-11 pl-10 pr-4 rtl:pl-4 rtl:pr-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-tp-cyan"
          />
        </div>

        {/* Filtre par Offre d'emploi */}
        <div className="w-full sm:w-64">
          <select
            value={selectedJobId}
            onChange={(e) => setSelectedJobId(e.target.value)}
            className="w-full h-11 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-tp-cyan text-slate-900 dark:text-white"
          >
            <option value="ALL">Toutes les offres ({applications.length})</option>
            {initialJobPostings.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title}
              </option>
            ))}
          </select>
        </div>

        {/* Filtre par Statut */}
        <div className="w-full sm:w-48">
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="w-full h-11 px-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm font-medium focus:outline-none focus:border-tp-cyan text-slate-900 dark:text-white"
          >
            <option value="ALL">Tous statuts</option>
            <option value="NOUVELLE">Nouvelle</option>
            <option value="EN_EXAMEN">En examen</option>
            <option value="ENTRETIEN_PROGRAMME">Entretien prévu</option>
            <option value="ACCEPTEE">Acceptée</option>
            <option value="REFUSEE">Refusée</option>
            <option value="ARCHIVEE">Archivée</option>
          </select>
        </div>
      </div>

      {/* VUE PIPELINE KANBAN OU TABLEAU */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {Object.entries(STATUS_CONFIG).map(([stKey, stConf]) => {
            const colApps = filteredApps.filter((a) => a.status === stKey);
            return (
              <div
                key={stKey}
                className="bg-slate-100/70 dark:bg-slate-900/60 rounded-3xl p-3.5 border border-slate-200/80 dark:border-slate-800/80 space-y-3 min-w-[220px]"
              >
                <div className="flex items-center justify-between px-1">
                  <span className={`text-xs font-black uppercase tracking-wider ${stConf.color}`}>
                    {stConf.label}
                  </span>
                  <span className="w-5 h-5 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center text-[10px] font-bold shadow-xs">
                    {colApps.length}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {colApps.length === 0 ? (
                    <div className="p-4 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800 text-center text-[11px] text-slate-400">
                      Aucune candidature
                    </div>
                  ) : (
                    colApps.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => handleOpenDetail(app)}
                        className="bg-white dark:bg-slate-800 p-3.5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs hover:shadow-md hover:border-tp-cyan/40 transition cursor-pointer space-y-2"
                      >
                        <div className="flex items-start justify-between gap-1">
                          <h4 className="text-xs font-black text-slate-900 dark:text-white line-clamp-1">
                            {app.fullName}
                          </h4>
                          {app.ratedScore && (
                            <div className="flex items-center gap-0.5 text-amber-500 text-[10px] font-bold">
                              <span>★</span>
                              <span>{app.ratedScore}</span>
                            </div>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1">
                          {app.jobPosting.title}
                        </p>

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-700/50">
                          <span>{app.city || "Maroc"}</span>
                          <span>{new Date(app.createdAt).toLocaleDateString("fr-FR")}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* VUE TABLE */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left rtl:text-right border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                  <th className="py-4 px-6">Candidat</th>
                  <th className="py-4 px-4">Poste visé</th>
                  <th className="py-4 px-4">Coordonnées</th>
                  <th className="py-4 px-4">Statut</th>
                  <th className="py-4 px-4 text-center">Score</th>
                  <th className="py-4 px-6 text-right rtl:text-left">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
                {filteredApps.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      Aucune candidature trouvée.
                    </td>
                  </tr>
                ) : (
                  filteredApps.map((app) => {
                    const stConf = STATUS_CONFIG[app.status] || STATUS_CONFIG.NOUVELLE;
                    return (
                      <tr key={app.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-4 px-6">
                          <div className="space-y-0.5">
                            <span className="font-bold text-slate-900 dark:text-white text-sm">
                              {app.fullName}
                            </span>
                            <div className="text-[11px] text-slate-400 flex items-center gap-2">
                              <span>{app.city || "Non spécifié"}</span>
                              <span>• {new Date(app.createdAt).toLocaleDateString("fr-FR")}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-900 dark:text-white text-xs">
                            {app.jobPosting.title}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <div className="space-y-0.5 text-xs text-slate-500 dark:text-slate-400">
                            <div>{app.phone}</div>
                            <div className="text-[11px] text-slate-400">{app.email}</div>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${stConf.bg} ${stConf.color} ${stConf.border}`}
                          >
                            {stConf.label}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-center">
                          <div className="inline-flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                onClick={() => handleScoreChange(app.id, star)}
                                className={`text-sm transition ${
                                  (app.ratedScore || 0) >= star
                                    ? "text-amber-400 hover:text-amber-500"
                                    : "text-slate-200 dark:text-slate-700 hover:text-amber-300"
                                }`}
                              >
                                ★
                              </button>
                            ))}
                          </div>
                        </td>

                        <td className="py-4 px-6 text-right rtl:text-left">
                          <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                            {/* Ouvrir le CV direct */}
                            <button
                              onClick={() => handleDownloadCv(app.id)}
                              className="p-2 text-slate-500 hover:text-tp-cyan rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Télécharger le CV PDF (Lien sécurisé)"
                            >
                              <FileText className="w-4 h-4" />
                            </button>

                            {/* Ouvrir tiroir détail */}
                            <button
                              onClick={() => handleOpenDetail(app)}
                              className="p-2 text-slate-500 hover:text-tp-midnight dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Détails du candidat"
                            >
                              <Eye className="w-4 h-4" />
                            </button>

                            {/* Convertir en membre d'équipe */}
                            <button
                              onClick={() => handleOpenConvertModal(app)}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-lg transition"
                              title="Convertir directement en membre d'équipe (TeamMember)"
                            >
                              + Staff
                            </button>

                            {/* Supprimer */}
                            <button
                              onClick={() => handleDeleteApp(app.id, app.fullName)}
                              className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                              title="Supprimer la candidature"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TIROIR LATÉRAL DE DÉTAIL D'UNE CANDIDATURE */}
      {activeApp && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-xl h-full shadow-2xl p-6 sm:p-8 overflow-y-auto space-y-6 flex flex-col justify-between border-l border-slate-200 dark:border-slate-800">
            <div className="space-y-6">
              {/* En-tête tiroir */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {activeApp.fullName}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Candidature pour : <strong className="text-tp-cyan">{activeApp.jobPosting.title}</strong>
                  </p>
                </div>
                <button
                  onClick={() => setActiveApp(null)}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Statut & Notation */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    Statut du dossier
                  </label>
                  <select
                    value={activeApp.status}
                    onChange={(e) => handleStatusChange(activeApp.id, e.target.value)}
                    className="h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-tp-cyan"
                  >
                    <option value="NOUVELLE">Nouvelle</option>
                    <option value="EN_EXAMEN">En examen</option>
                    <option value="ENTRETIEN_PROGRAMME">Entretien prévu</option>
                    <option value="ACCEPTEE">Acceptée</option>
                    <option value="REFUSEE">Refusée</option>
                    <option value="ARCHIVEE">Archivée</option>
                  </select>
                </div>

                <div className="space-y-1 text-right">
                  <label className="text-[10px] font-bold text-slate-400 uppercase block">
                    Évaluation RH (1-5)
                  </label>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleScoreChange(activeApp.id, star)}
                        className={`text-lg transition ${
                          (activeApp.ratedScore || 0) >= star
                            ? "text-amber-400"
                            : "text-slate-200 dark:text-slate-700"
                        }`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bouton Téléchargement CV */}
              <div className="p-4 rounded-2xl bg-tp-cyan/5 border border-tp-cyan/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-tp-cyan" />
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">
                      {activeApp.cvFileName}
                    </p>
                    <p className="text-[10px] text-slate-400">
                      PDF stocké sur Cloudflare R2 • {(activeApp.cvFileSize / (1024 * 1024)).toFixed(2)} Mo
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDownloadCv(activeApp.id)}
                  disabled={isLoadingCv}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-tp-midnight hover:bg-tp-midnight-soft text-white text-xs font-bold transition shadow-xs shrink-0 disabled:opacity-50"
                >
                  {isLoadingCv ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5" />
                  )}
                  <span>Télécharger</span>
                </button>
              </div>

              {/* Coordonnées */}
              <div className="space-y-2 text-xs">
                <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                  Contact & Informations
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <a href={`mailto:${activeApp.email}`} className="hover:underline truncate">
                      {activeApp.email}
                    </a>
                  </div>

                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                    <div className="flex items-center gap-2 truncate">
                      <Phone className="w-4 h-4 text-slate-400" />
                      <span>{activeApp.phone}</span>
                    </div>
                    {/* Lien WhatsApp direct */}
                    <a
                      href={`https://wa.me/${activeApp.phone.replace(/[^0-9]/g, "")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2 py-0.5 rounded-lg bg-emerald-500 text-white text-[10px] font-bold hover:bg-emerald-600 transition shrink-0"
                    >
                      WhatsApp
                    </a>
                  </div>

                  {activeApp.city && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <MapPin className="w-4 h-4 text-slate-400" />
                      <span>{activeApp.city}</span>
                    </div>
                  )}

                  {activeApp.availability && (
                    <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span>Disponibilité : {activeApp.availability}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Liens Portfolio */}
              {activeApp.portfolioLinks && activeApp.portfolioLinks.length > 0 && (
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                    Liens Portfolio & Réseaux
                  </h4>
                  <div className="space-y-1.5">
                    {activeApp.portfolioLinks.map((link, idx) => (
                      <a
                        key={idx}
                        href={link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-tp-cyan hover:underline truncate"
                      >
                        <span className="truncate">{link}</span>
                        <ExternalLink className="w-3.5 h-3.5 shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Message de motivation */}
              {activeApp.coverMessage && (
                <div className="space-y-2 text-xs">
                  <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider">
                    Message de motivation
                  </h4>
                  <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 whitespace-pre-line leading-relaxed">
                    {activeApp.coverMessage}
                  </div>
                </div>
              )}

              {/* Notes internes privées */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-400 uppercase text-[10px] tracking-wider flex items-center gap-1.5">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>Notes Internes RH (Confidentiel)</span>
                  </h4>
                  <button
                    onClick={handleSaveNotes}
                    disabled={isSavingNotes}
                    className="text-[11px] font-bold text-tp-cyan hover:underline disabled:opacity-50"
                  >
                    {isSavingNotes ? "Enregistrement..." : "Enregistrer la note"}
                  </button>
                </div>
                <textarea
                  rows={3}
                  value={internalNotesInput}
                  onChange={(e) => setInternalNotesInput(e.target.value)}
                  placeholder="Écrivez une note d'entretien, des remarques sur le profil (non visible par le candidat)..."
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white text-xs focus:outline-none focus:border-tp-cyan"
                />
              </div>
            </div>

            {/* Pied de tiroir : Bouton conversion en membre d'équipe */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <button
                onClick={() => handleDeleteApp(activeApp.id, activeApp.fullName)}
                className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition"
              >
                Supprimer
              </button>

              <button
                onClick={() => handleOpenConvertModal(activeApp)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm"
              >
                <UserCheck className="w-4 h-4" />
                <span>Convertir en membre d'équipe</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE CONVERSION EN MEMBRE D'ÉQUIPE */}
      {convertModalApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-md p-6 border border-slate-200 dark:border-slate-800 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-black text-slate-900 dark:text-white">
                  Convertir en membre d'équipe
                </h3>
              </div>
              <button
                onClick={() => setConvertModalApp(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {convertError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium">
                {convertError}
              </div>
            )}

            {convertSuccessMsg && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-medium">
                {convertSuccessMsg}
              </div>
            )}

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 dark:text-slate-300">
                Vous vous apprêtez à créer un profil <strong>TeamMember</strong> pour{" "}
                <strong>{convertModalApp.fullName}</strong>.
              </p>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Rôle attribué dans l'équipe
                </label>
                <select
                  value={targetTeamRole}
                  onChange={(e) => setTargetTeamRole(e.target.value)}
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:outline-none"
                >
                  <option value="TOUR_LEADER">Chef de voyage / Guide-Animateur (Scan + Manifeste)</option>
                  <option value="OFFICIAL_GUIDE">Guide de tourisme officiel (Scan + TIST)</option>
                  <option value="ORGANIZER">Organisateur / Coordinateur (Gestion complète)</option>
                  <option value="DRIVER">Chauffeur touristique (Pointage)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-slate-700 dark:text-slate-300 block">
                  Remarque RH pour le dossier membre (optionnel)
                </label>
                <input
                  type="text"
                  value={convertNotes}
                  onChange={(e) => setConvertNotes(e.target.value)}
                  placeholder="ex: Recruté suite à l'entretien du 25/09..."
                  className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConvertModalApp(null)}
                className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 text-xs font-bold"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={handleExecuteConvert}
                disabled={isConverting || Boolean(convertSuccessMsg)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition shadow-xs disabled:opacity-50"
              >
                {isConverting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirmer la création</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

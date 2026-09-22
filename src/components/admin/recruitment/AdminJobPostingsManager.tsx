"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useLocale } from "next-intl";
import { 
  Briefcase, Plus, Search, Filter, Edit3, Trash2, 
  Copy, ExternalLink, Users, Calendar, MapPin, Eye, CheckCircle2, 
  Clock, X, Loader2, Sparkles, AlertCircle 
} from "lucide-react";
import { 
  createJobPostingAction, 
  updateJobPostingAction, 
  deleteJobPostingAction 
} from "@/actions/recruitment.actions";

interface JobPostingData {
  id: string;
  title: string;
  slug: string;
  role: string | null;
  department: string | null;
  employmentType: string;
  location: string;
  descriptionFr: string;
  descriptionAr: string | null;
  descriptionEn: string | null;
  missions: string[];
  requirements: string[];
  salaryMin: number | null;
  salaryMax: number | null;
  salaryType: string | null;
  status: "BROUILLON" | "PUBLIEE" | "FERMEE" | "ARCHIVEE";
  publishedAt: string | null;
  closingDate: string | null;
  createdAt: string;
  _count: {
    applications: number;
  };
}

interface AdminJobPostingsManagerProps {
  initialJobs: JobPostingData[];
}

export function AdminJobPostingsManager({ initialJobs }: AdminJobPostingsManagerProps) {
  const locale = useLocale();
  const isAr = locale === "ar";

  const [jobs, setJobs] = useState<JobPostingData[]>(initialJobs);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal de création / édition
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPostingData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    role: "" as string,
    department: "",
    employmentType: "TEMPS_PLEIN",
    location: "Rabat",
    descriptionFr: "",
    descriptionAr: "",
    descriptionEn: "",
    missions: [""] as string[],
    requirements: [""] as string[],
    salaryMin: "" as string | number,
    salaryMax: "" as string | number,
    salaryType: "MENSUEL",
    status: "PUBLIEE" as "BROUILLON" | "PUBLIEE" | "FERMEE" | "ARCHIVEE",
    closingDate: "",
  });

  const openCreateModal = () => {
    setEditingJob(null);
    setFormData({
      title: "",
      slug: "",
      role: "",
      department: "Terrain",
      employmentType: "FREELANCE",
      location: "Casablanca & Rabat",
      descriptionFr: "",
      descriptionAr: "",
      descriptionEn: "",
      missions: [""],
      requirements: [""],
      salaryMin: "",
      salaryMax: "",
      salaryType: "FORFAIT_MISSION",
      status: "PUBLIEE",
      closingDate: "",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (job: JobPostingData) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      slug: job.slug,
      role: job.role || "",
      department: job.department || "",
      employmentType: job.employmentType,
      location: job.location,
      descriptionFr: job.descriptionFr,
      descriptionAr: job.descriptionAr || "",
      descriptionEn: job.descriptionEn || "",
      missions: job.missions.length > 0 ? job.missions : [""],
      requirements: job.requirements.length > 0 ? job.requirements : [""],
      salaryMin: job.salaryMin ?? "",
      salaryMax: job.salaryMax ?? "",
      salaryType: job.salaryType || "A_DISCUTER",
      status: job.status,
      closingDate: job.closingDate ? new Date(job.closingDate).toISOString().split("T")[0] : "",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleDuplicate = (job: JobPostingData) => {
    setEditingJob(null);
    setFormData({
      title: `${job.title} (Copie)`,
      slug: `${job.slug}-copie-${Date.now().toString().slice(-4)}`,
      role: job.role || "",
      department: job.department || "",
      employmentType: job.employmentType,
      location: job.location,
      descriptionFr: job.descriptionFr,
      descriptionAr: job.descriptionAr || "",
      descriptionEn: job.descriptionEn || "",
      missions: [...job.missions],
      requirements: [...job.requirements],
      salaryMin: job.salaryMin ?? "",
      salaryMax: job.salaryMax ?? "",
      salaryType: job.salaryType || "A_DISCUTER",
      status: "BROUILLON",
      closingDate: "",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setFormData((prev) => {
      const autoSlug = val
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9-_]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
      return {
        ...prev,
        title: val,
        slug: editingJob ? prev.slug : autoSlug,
      };
    });
  };

  const handleMissionChange = (index: number, value: string) => {
    const list = [...formData.missions];
    list[index] = value;
    setFormData({ ...formData, missions: list });
  };

  const addMission = () => {
    setFormData({ ...formData, missions: [...formData.missions, ""] });
  };

  const removeMission = (index: number) => {
    setFormData({
      ...formData,
      missions: formData.missions.filter((_, i) => i !== index),
    });
  };

  const handleRequirementChange = (index: number, value: string) => {
    const list = [...formData.requirements];
    list[index] = value;
    setFormData({ ...formData, requirements: list });
  };

  const addRequirement = () => {
    setFormData({ ...formData, requirements: [...formData.requirements, ""] });
  };

  const removeRequirement = (index: number) => {
    setFormData({
      ...formData,
      requirements: formData.requirements.filter((_, i) => i !== index),
    });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setModalError(null);

    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        role: (formData.role as any) || null,
        department: formData.department || null,
        employmentType: formData.employmentType as any,
        location: formData.location,
        descriptionFr: formData.descriptionFr,
        descriptionAr: formData.descriptionAr || null,
        descriptionEn: formData.descriptionEn || null,
        missions: formData.missions.filter((m) => m.trim().length > 0),
        requirements: formData.requirements.filter((r) => r.trim().length > 0),
        salaryMin: formData.salaryMin !== "" ? Number(formData.salaryMin) : null,
        salaryMax: formData.salaryMax !== "" ? Number(formData.salaryMax) : null,
        salaryType: (formData.salaryType as any) || null,
        status: formData.status,
        closingDate: formData.closingDate || null,
      };

      if (editingJob) {
        const res = await updateJobPostingAction(editingJob.id, payload);
        if (!res.success) throw new Error(res.error);
        setJobs(jobs.map((j) => (j.id === editingJob.id ? { ...res.job, _count: j._count } : j)));
      } else {
        const res = await createJobPostingAction(payload);
        if (!res.success) throw new Error(res.error);
        setJobs([{ ...res.job, _count: { applications: 0 } }, ...jobs]);
      }

      setIsModalOpen(false);
    } catch (err: any) {
      setModalError(err.message || "Erreur lors de la sauvegarde de l'offre.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (job: JobPostingData, newStatus: "PUBLIEE" | "BROUILLON" | "FERMEE") => {
    try {
      const res = await updateJobPostingAction(job.id, { status: newStatus });
      if (res.success) {
        setJobs(jobs.map((j) => (j.id === job.id ? { ...j, status: newStatus } : j)));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (job: JobPostingData) => {
    const confirmMsg =
      job._count.applications > 0
        ? `Cette offre possède ${job._count.applications} candidature(s). Elle sera archivée plutôt que supprimée. Confirmer ?`
        : `Supprimer définitivement l'offre "${job.title}" ?`;

    if (!window.confirm(confirmMsg)) return;

    const res = await deleteJobPostingAction(job.id);
    if (res.success) {
      if (job._count.applications > 0) {
        setJobs(jobs.map((j) => (j.id === job.id ? { ...j, status: "ARCHIVEE" } : j)));
      } else {
        setJobs(jobs.filter((j) => j.id !== job.id));
      }
    }
  };

  const filteredJobs = jobs.filter((j) => {
    if (statusFilter !== "ALL" && j.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        j.title.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        (j.department && j.department.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* BARRE SUPÉRIEURE D'ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2.5">
            <Briefcase className="w-6 h-6 text-tp-cyan" />
            <span>{isAr ? "إدارة عروض التوظيف" : "Gestion des Offres d'Emploi"}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            {isAr
              ? "نشر وتعديل عروض العمل، تحديد المهام والمؤهلات، وتتبع عدد الترشيحات."
              : "Créez, publiez et gérez vos offres de recrutement pour le terrain et le bureau."}
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-tp-midnight hover:bg-tp-midnight-soft text-white text-xs sm:text-sm font-black transition shadow-md shadow-tp-midnight/10"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? "+ إنشاء عرض عمل جديد" : "+ Créer une Offre"}</span>
        </button>
      </div>

      {/* FILTRES ET RECHERCHE */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 rtl:left-auto rtl:right-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? "بحث بالعنوان، المدينة أو القسم..." : "Rechercher par titre, ville, département..."}
            className="w-full h-11 pl-10 pr-4 rtl:pl-4 rtl:pr-10 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none focus:border-tp-cyan"
          />
        </div>

        <div className="flex gap-2">
          {["ALL", "PUBLIEE", "BROUILLON", "FERMEE", "ARCHIVEE"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition ${
                statusFilter === st
                  ? "bg-tp-cyan text-white shadow-sm"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
              }`}
            >
              {st === "ALL" ? (isAr ? "الكل" : "Tous") : st}
            </button>
          ))}
        </div>
      </div>

      {/* TABLEAU DES OFFRES */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left rtl:text-right border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/75 dark:bg-slate-800/50 text-slate-500 dark:text-slate-400 font-bold uppercase text-[11px] tracking-wider">
                <th className="py-4 px-6">Poste / Offre</th>
                <th className="py-4 px-4">Type & Rôle</th>
                <th className="py-4 px-4">Localisation</th>
                <th className="py-4 px-4">Statut</th>
                <th className="py-4 px-4 text-center">Candidatures</th>
                <th className="py-4 px-6 text-right rtl:text-left">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-700 dark:text-slate-200">
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    Aucune offre ne correspond à ces critères.
                  </td>
                </tr>
              ) : (
                filteredJobs.map((job) => {
                  return (
                    <tr key={job.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-4 px-6">
                        <div className="space-y-1">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {job.title}
                          </span>
                          <div className="flex items-center gap-2 text-[11px] text-slate-400">
                            <span className="font-mono">/{job.slug}</span>
                            {job.department && <span>• {job.department}</span>}
                          </div>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <div className="space-y-1">
                          <span className="px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[11px]">
                            {job.employmentType}
                          </span>
                          {job.role && (
                            <p className="text-[10px] text-slate-400 font-mono">
                              Rôle : {job.role}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-4 px-4 font-medium text-slate-600 dark:text-slate-300">
                        {job.location}
                      </td>

                      <td className="py-4 px-4">
                        <span
                          className={`px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                            job.status === "PUBLIEE"
                              ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-400"
                              : job.status === "BROUILLON"
                              ? "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-400"
                              : job.status === "FERMEE"
                              ? "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-400"
                              : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          }`}
                        >
                          {job.status}
                        </span>
                      </td>

                      <td className="py-4 px-4 text-center">
                        <Link
                          href={`/${locale}/admin/recrutement/candidatures?jobPostingId=${job.id}`}
                          className={`inline-flex items-center justify-center min-w-8 h-7 px-2 rounded-full font-black text-xs transition ${
                            job._count.applications > 0
                              ? "bg-tp-cyan text-white hover:bg-tp-cyan-hover"
                              : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                          }`}
                          title="Voir les candidatures reçues"
                        >
                          {job._count.applications}
                        </Link>
                      </td>

                      <td className="py-4 px-6 text-right rtl:text-left">
                        <div className="flex items-center justify-end rtl:justify-start gap-1.5">
                          {/* Lien public si publiée */}
                          {job.status === "PUBLIEE" && (
                            <Link
                              href={`/${locale}/carrieres/${job.slug}`}
                              target="_blank"
                              className="p-2 text-slate-400 hover:text-tp-cyan rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                              title="Voir la page publique"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </Link>
                          )}

                          {/* Bascule Publication */}
                          {job.status === "PUBLIEE" ? (
                            <button
                              onClick={() => handleToggleStatus(job, "BROUILLON")}
                              className="px-2.5 py-1 text-[11px] font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
                              title="Dépublier l'offre"
                            >
                              Brouillon
                            </button>
                          ) : (
                            <button
                              onClick={() => handleToggleStatus(job, "PUBLIEE")}
                              className="px-2.5 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
                              title="Publier l'offre en ligne"
                            >
                              Publier
                            </button>
                          )}

                          {/* Dupliquer */}
                          <button
                            onClick={() => handleDuplicate(job)}
                            className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Dupliquer l'offre"
                          >
                            <Copy className="w-4 h-4" />
                          </button>

                          {/* Éditer */}
                          <button
                            onClick={() => openEditModal(job)}
                            className="p-2 text-slate-500 hover:text-tp-cyan rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                            title="Modifier l'offre"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          {/* Supprimer */}
                          <button
                            onClick={() => handleDelete(job)}
                            className="p-2 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                            title="Supprimer ou archiver"
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

      {/* MODAL CRÉATION / MODIFICATION D'UNE OFFRE */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-tp-cyan" />
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  {editingJob ? "Modifier l'offre d'emploi" : "Créer une nouvelle offre d'emploi"}
                </h2>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {modalError && (
              <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-6">
              {/* Titre & Slug */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Titre de l&apos;offre <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleTitleChange(e.target.value)}
                    placeholder="ex: Guide-Animateur Haut Atlas"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm focus:outline-none focus:border-tp-cyan text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Slug URL
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    placeholder="guide-animateur-haut-atlas"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-sm font-mono text-xs focus:outline-none focus:border-tp-cyan text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Rôle staff correspondant & Département */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Rôle Staff associé
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-tp-cyan text-slate-900 dark:text-white"
                  >
                    <option value="">Aucun rôle staff particulier</option>
                    <option value="GUIDE_ANIMATEUR">Guide-Animateur</option>
                    <option value="ORGANISATEUR">Organisateur / Coordinateur</option>
                    <option value="CHAUFFEUR">Chauffeur touristique</option>
                    <option value="SURVEILLANT">Surveillant / Sécurité</option>
                    <option value="AUTRE">Autre métier</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Type de contrat
                  </label>
                  <select
                    value={formData.employmentType}
                    onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-tp-cyan text-slate-900 dark:text-white"
                  >
                    <option value="FREELANCE">Freelance / Indépendant</option>
                    <option value="TEMPS_PARTIEL">Temps Partiel</option>
                    <option value="TEMPS_PLEIN">Temps Plein</option>
                    <option value="MISSION_PONCTUELLE">Mission Ponctuelle</option>
                    <option value="STAGE">Stage</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Localisation / Départs <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="ex: Casablanca, Rabat, Merzouga..."
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:border-tp-cyan text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Rémunération & Statut */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Salaire Min (MAD)
                  </label>
                  <input
                    type="number"
                    value={formData.salaryMin}
                    onChange={(e) => setFormData({ ...formData, salaryMin: e.target.value })}
                    placeholder="Optionnel"
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tp-cyan text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Salaire Max (MAD)
                  </label>
                  <input
                    type="number"
                    value={formData.salaryMax}
                    onChange={(e) => setFormData({ ...formData, salaryMax: e.target.value })}
                    placeholder="Optionnel"
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tp-cyan text-slate-900 dark:text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Type de rémunération
                  </label>
                  <select
                    value={formData.salaryType}
                    onChange={(e) => setFormData({ ...formData, salaryType: e.target.value })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-medium focus:outline-none focus:border-tp-cyan text-slate-900 dark:text-white"
                  >
                    <option value="FORFAIT_MISSION">Par mission / départ</option>
                    <option value="MENSUEL">Mensuel fixe</option>
                    <option value="POURCENTAGE">Pourcentage / Commission</option>
                    <option value="A_DISCUTER">À discuter selon profil</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                    Statut initial
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:outline-none focus:border-tp-cyan text-slate-900 dark:text-white"
                  >
                    <option value="PUBLIEE">Publiée en ligne</option>
                    <option value="BROUILLON">Brouillon interne</option>
                    <option value="FERMEE">Fermée</option>
                  </select>
                </div>
              </div>

              {/* Description en Français */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                  Description du poste (Français) <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={formData.descriptionFr}
                  onChange={(e) => setFormData({ ...formData, descriptionFr: e.target.value })}
                  placeholder="Présentez le rôle, le contexte et les objectifs..."
                  className="w-full p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs sm:text-sm focus:outline-none focus:border-tp-cyan text-slate-900 dark:text-white"
                />
              </div>

              {/* Missions */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Missions & Responsabilités clés
                  </label>
                  <button
                    type="button"
                    onClick={addMission}
                    className="text-xs font-bold text-tp-cyan hover:underline"
                  >
                    + Ajouter une mission
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.missions.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={m}
                        onChange={(e) => handleMissionChange(idx, e.target.value)}
                        placeholder={`Mission ${idx + 1}`}
                        className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tp-cyan text-slate-900 dark:text-white"
                      />
                      {formData.missions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeMission(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Profil recherché */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Profil recherché & Compétences requises
                  </label>
                  <button
                    type="button"
                    onClick={addRequirement}
                    className="text-xs font-bold text-tp-cyan hover:underline"
                  >
                    + Ajouter une compétence
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.requirements.map((r, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input
                        type="text"
                        value={r}
                        onChange={(e) => handleRequirementChange(idx, e.target.value)}
                        placeholder={`Compétence / Condition ${idx + 1}`}
                        className="flex-1 h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs focus:outline-none focus:border-tp-cyan text-slate-900 dark:text-white"
                      />
                      {formData.requirements.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeRequirement(idx)}
                          className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-tp-midnight hover:bg-tp-midnight-soft text-white text-xs sm:text-sm font-black flex items-center gap-2 shadow-md disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
                  <span>{editingJob ? "Enregistrer les modifications" : "Créer l'offre"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

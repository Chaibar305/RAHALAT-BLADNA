"use client";

import React from "react";
import { BreakEvenAnalysis } from "@/types";
import { formatMAD } from "@/lib/utils";
import { TrendingUp, Users, DollarSign, AlertTriangle, CheckCircle, Sparkles } from "lucide-react";

export function FinancialBreakEvenCard({ analysis }: { analysis: BreakEvenAnalysis }) {
  const isZeroCostsAndBookings = analysis.fixedCosts.totalFixed === 0 && analysis.bookedSeats === 0;
  const occupancyRate = analysis.totalSeats > 0 ? Math.round((analysis.bookedSeats / analysis.totalSeats) * 100) : 0;
  const breakEvenRate = analysis.totalSeats > 0 && analysis.breakEvenPassengerCount > 0 
    ? Math.round((analysis.breakEvenPassengerCount / analysis.totalSeats) * 100) 
    : 0;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <div>
          <span className="text-xs uppercase font-bold tracking-widest text-brand-orange">
            Analyse de Rentabilité & Seuil d&apos;Équilibre
          </span>
          <h3 className="text-xl font-extrabold text-brand-teal dark:text-brand-sand mt-1">
            {analysis.tripTitle}
          </h3>
        </div>

        <div
          className={`px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 ${
            isZeroCostsAndBookings
              ? "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              : analysis.isProfitable
              ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300"
              : "bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300"
          }`}
        >
          {isZeroCostsAndBookings ? (
            <>
              <Sparkles className="w-4 h-4 text-tp-cyan" /> Circuit ouvert aux réservations
            </>
          ) : analysis.isProfitable ? (
            <>
              <CheckCircle className="w-4 h-4" /> Voyage Rentable (Bénéficiaire)
            </>
          ) : (
            <>
              <AlertTriangle className="w-4 h-4" /> En dessous du point mort
            </>
          )}
        </div>
      </div>

      {/* Cartes de KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 font-semibold block">Seuil de rentabilité</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {analysis.breakEvenPassengerCount}{" "}
            <span className="text-xs font-normal text-slate-400">passagers</span>
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            (soit {breakEvenRate}% du car)
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 font-semibold block">Inscrits actuels</span>
          <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
            {analysis.bookedSeats}{" "}
            <span className="text-xs font-normal text-slate-400">/ {analysis.totalSeats}</span>
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            Taux de remplissage : {occupancyRate}%
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 font-semibold block">Chiffre d&apos;Affaires</span>
          <p className="text-2xl font-black text-slate-900 dark:text-white mt-1">
            {formatMAD(analysis.currentRevenue)}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            {analysis.sellingPricePerSeat > 0 ? `${analysis.sellingPricePerSeat} DH / siège` : "Prix en cours"}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
          <span className="text-xs text-slate-500 font-semibold block">Marge Brute Réalisée</span>
          <p
            className={`text-2xl font-black mt-1 ${
              analysis.currentGrossMargin > 0
                ? "text-emerald-600 dark:text-emerald-400"
                : analysis.currentGrossMargin === 0
                ? "text-slate-900 dark:text-white"
                : "text-rose-600 dark:text-rose-400"
            }`}
          >
            {formatMAD(analysis.currentGrossMargin)}
          </p>
          <span className="text-[11px] text-slate-500 font-medium">
            {analysis.currentGrossMargin > 0
              ? "Bénéfice net actuel"
              : analysis.currentGrossMargin === 0
              ? "En attente d'inscriptions"
              : "Déficit temporaire"}
          </span>
        </div>
      </div>

      {/* Barre visuelle du Point Mort */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-slate-300">
          <span>Progression vers le Seuil de Rentabilité</span>
          <span>
            {analysis.breakEvenPassengerCount > 0
              ? `${analysis.bookedSeats} / ${analysis.breakEvenPassengerCount} places pour équilibre`
              : `${analysis.bookedSeats} places réservées`}
          </span>
        </div>
        <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden relative">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(occupancyRate, 100)}%` }}
          />
        </div>
      </div>

      {/* Structure des Coûts */}
      <div className="grid sm:grid-cols-2 gap-4 text-xs text-slate-600 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-4">
        <div>
          <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">
            Coûts Fixes Décaissés : {formatMAD(analysis.fixedCosts.totalFixed)}
          </p>
          {analysis.fixedCosts.totalFixed > 0 ? (
            <ul className="space-y-0.5 ps-3 list-disc">
              <li>Autocar & Chauffeur TIST : {formatMAD(analysis.fixedCosts.transportCost)}</li>
              <li>Tour Leader & Guide : {formatMAD(analysis.fixedCosts.tourLeaderFee)}</li>
              <li>Péages Autoroutes & Formalités : {formatMAD(analysis.fixedCosts.permitsAndRoadTolls)}</li>
            </ul>
          ) : (
            <p className="text-slate-400 italic">Aucun coût fixe engagé pour le moment.</p>
          )}
        </div>

        <div>
          <p className="font-bold text-slate-800 dark:text-slate-200 mb-1">
            Coûts Variables : {formatMAD(analysis.variableCostsPerPassenger.totalVariable)} / passager
          </p>
          {analysis.variableCostsPerPassenger.totalVariable > 0 ? (
            <ul className="space-y-0.5 ps-3 list-disc">
              <li>Hôtel & Hébergement : {formatMAD(analysis.variableCostsPerPassenger.hotelRoomPerPerson)}</li>
              <li>Restauration & Accès : {formatMAD(analysis.variableCostsPerPassenger.mealsAndActivities)}</li>
            </ul>
          ) : (
            <p className="text-slate-400 italic">Aucun coût variable engagé pour le moment.</p>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { 
  Camera, CameraOff, Flashlight, FlashlightOff, RefreshCw, 
  CheckCircle2, AlertTriangle, XCircle, Search, Users, 
  ArrowLeft, ChevronDown, Check, DollarSign, Clock, 
  Keyboard, QrCode, ShieldCheck, MapPin, Phone, UserCheck, 
  Loader2, Volume2, Sparkles
} from "lucide-react";
import { sensoryFeedback } from "@/lib/audioFeedback";
import { 
  checkInPassengerAction, 
  collectCashBalanceAction, 
  toggleTravelerBoardingAction,
  getTripScannerDetailsAction 
} from "@/actions/scanner.actions";

export interface TripSummaryItem {
  id: string;
  slug: string;
  titleFr: string;
  titleAr: string;
  departureDateStr: string;
  totalSeats: number;
  totalPassengers: number;
  checkedInCount: number;
  hasPassengers: boolean;
}

interface LiveBoardingScannerProps {
  initialTrips: TripSummaryItem[];
  preselectedTripId?: string;
  initialOperator?: any;
}

type ScanResultModal = 
  | {
      type: "SUCCESS";
      data: any;
    }
  | {
      type: "ALREADY_CHECKED_IN";
      data: any;
    }
  | {
      type: "ERROR";
      title: string;
      message: string;
      details?: any;
    }
  | null;

// Helper pour obtenir un flux vidéo temporaire (débloque les labels et l'accès caméra)
async function getCameraStream(): Promise<MediaStream> {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
    throw new Error("Périphérique caméra non supporté par ce navigateur");
  }
  try {
    return await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
    });
  } catch {
    return await navigator.mediaDevices.getUserMedia({ video: true });
  }
}

export function LiveBoardingScanner({ initialTrips, preselectedTripId, initialOperator }: LiveBoardingScannerProps) {
  const locale = useLocale();
  const isAr = locale === "ar";
  const router = useRouter();
  const [operatorPermissions, setOperatorPermissions] = useState<any>(initialOperator || null);

  // 1. Sélection du Voyage
  const [selectedTripId, setSelectedTripId] = useState<string>(() => {
    if (preselectedTripId) {
      const found = initialTrips.find(t => t.id === preselectedTripId || t.slug === preselectedTripId);
      if (found) return found.id;
    }
    const withPax = initialTrips.find(t => t.hasPassengers);
    return withPax ? withPax.id : (initialTrips[0]?.id || "");
  });

  // 2. Données en direct du voyage
  const [tripDetails, setTripDetails] = useState<any>(null);
  const [stats, setStats] = useState({ totalPassengers: 0, checkedInCount: 0, pendingCount: 0 });
  const [travelers, setTravelers] = useState<any[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // 3. Scanner Camera State
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const selectedCameraIdRef = useRef<string>('');
  const [isScannerRunning, setIsScannerRunning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isTorchOn, setIsTorchOn] = useState(false);
  const [isTorchSupported, setIsTorchSupported] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [isManualInputOpen, setIsManualInputOpen] = useState(false);
  const [manualCode, setManualCode] = useState("");
  const [isSubmittingCheckIn, setIsSubmittingCheckIn] = useState(false);

  // 4. Modal de résultat de scan
  const [scanModal, setScanModal] = useState<ScanResultModal>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [isCollectingCash, setIsCollectingCash] = useState(false);

  // 5. Drawer Feuille de route
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [drawerFilter, setDrawerFilter] = useState<"ALL" | "CHECKED" | "PENDING">("ALL");

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const countdownTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isProcessingRef = useRef(false);
  const handleDetectedCodeRef = useRef<((rawCode: string) => Promise<void>) | null>(null);

  // Charger les données du voyage sélectionné
  const loadTripData = useCallback(async (tripId: string) => {
    if (!tripId) return;
    setIsLoadingDetails(true);
    try {
      const res = await getTripScannerDetailsAction(tripId);
      if (res.success && res.trip) {
        setTripDetails(res.trip);
        setStats(res.stats);
        setTravelers(res.travelers || []);
        if (res.operatorPermissions) {
          setOperatorPermissions(res.operatorPermissions);
        }
      }
    } catch (e) {
      console.error("loadTripData error:", e);
    } finally {
      setIsLoadingDetails(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTripId) {
      loadTripData(selectedTripId);
    }
  }, [selectedTripId, loadTripData]);

  // Initialisation et démarrage du scanner caméra
  const startCamera = useCallback(
    async (cameraIdToUse?: string, facingModeToUse?: "environment" | "user") => {
      setCameraError(null);

      try {
        const elementId = "reader-viewport";
        const container = document.getElementById(elementId);
        if (!container) return;

        if (scannerRef.current) {
          try {
            if (scannerRef.current.isScanning) {
              await scannerRef.current.stop();
            }
            scannerRef.current.clear();
          } catch {}
        }

        const html5QrCode = new Html5Qrcode(elementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
          ],
          verbose: false,
        });

        scannerRef.current = html5QrCode;

        const config = {
          fps: 15,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        const targetCameraId = cameraIdToUse ?? (selectedCameraIdRef.current || selectedCameraId);
        const cameraChoice = targetCameraId ? targetCameraId : { facingMode: facingModeToUse || facingMode };

        await html5QrCode.start(
          cameraChoice,
          config,
          (decodedText) => {
            handleDetectedCodeRef.current?.(decodedText);
          },
          () => {
            // Erreur frame normale pendant le scan, ignorer
          }
        );

        setIsScannerRunning(true);

        // Vérifier support torche / flash
        try {
          const capabilities: any = html5QrCode.getRunningTrackCapabilities();
          if (capabilities && capabilities.torch) {
            setIsTorchSupported(true);
          } else {
            setIsTorchSupported(false);
          }
        } catch {
          setIsTorchSupported(false);
        }
      } catch (err: any) {
        console.warn("Camera start failed:", err);
        setIsScannerRunning(false);
        setCameraError(
          err.name === "NotAllowedError"
            ? "Permission caméra refusée. Veuillez autoriser l'accès à la caméra dans vos réglages."
            : "Impossible d'accéder à la caméra de l'appareil."
        );
      }
    },
    [selectedCameraId, facingMode]
  );

  const stopCamera = useCallback(async () => {
    if (scannerRef.current && scannerRef.current.isScanning) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.warn("Stop camera error:", e);
      }
    }
    setIsScannerRunning(false);
    setIsTorchOn(false);
  }, []);

  // Détection du QR Code
  const handleDetectedCode = async (rawCode: string) => {
    if (isProcessingRef.current || scanModal) return;
    isProcessingRef.current = true;

    // Pause la caméra immédiatement
    try {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.pause(true);
      }
    } catch {}

    await processCheckIn(rawCode);
  };
  handleDetectedCodeRef.current = handleDetectedCode;

  // Traitement Métier du Pointage
  const processCheckIn = async (code: string) => {
    setIsSubmittingCheckIn(true);
    try {
      const result = await checkInPassengerAction(code, selectedTripId);

      if (result.status === "SUCCESS") {
        sensoryFeedback.playSuccess();
        setScanModal({ type: "SUCCESS", data: result });
        // Rafraîchir les stats en direct
        loadTripData(selectedTripId);
        // Démarrer compte à rebours de reprise auto (3 secondes)
        startAutoResumeTimer();
      } else if (result.status === "ALREADY_CHECKED_IN") {
        sensoryFeedback.playWarning();
        setScanModal({ type: "ALREADY_CHECKED_IN", data: result });
      } else {
        sensoryFeedback.playError();
        setScanModal({
          type: "ERROR",
          title: result.status === "WRONG_TRIP" ? "Voyage Différent" : "QR Code Non Reconnu",
          message: result.error || "Billet invalide",
          details: result,
        });
      }
    } catch (err: any) {
      sensoryFeedback.playError();
      setScanModal({
        type: "ERROR",
        title: "Erreur Technique",
        message: err.message || "Impossible de valider ce billet.",
      });
    } finally {
      setIsSubmittingCheckIn(false);
      isProcessingRef.current = false;
    }
  };

  // Compte à rebours de reprise automatique du scan
  const startAutoResumeTimer = () => {
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    setCountdown(3);

    countdownTimerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownTimerRef.current!);
          closeModalAndResume();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Fermer la modale et reprendre le scan
  const closeModalAndResume = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setScanModal(null);
    isProcessingRef.current = false;

    try {
      if (scannerRef.current) {
        scannerRef.current.resume();
      }
    } catch {
      startCamera();
    }
  };

  // Bascule torche / flash
  const toggleTorch = async () => {
    if (!scannerRef.current || !isTorchSupported) return;
    try {
      const newState = !isTorchOn;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newState }] as any,
      });
      setIsTorchOn(newState);
    } catch (err) {
      console.warn("Torch error:", err);
    }
  };

  // Bascule caméra avant / arrière / multi-objectifs
  const switchCamera = async (targetCameraId?: string) => {
    await stopCamera();

    if (targetCameraId) {
      setSelectedCameraId(targetCameraId);
      selectedCameraIdRef.current = targetCameraId;
      await startCamera(targetCameraId);
      return;
    }

    if (availableCameras.length > 1) {
      const currentId = selectedCameraIdRef.current || selectedCameraId;
      const currentIndex = availableCameras.findIndex((cam) => cam.deviceId === currentId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextCamera = availableCameras[nextIndex];
      setSelectedCameraId(nextCamera.deviceId);
      selectedCameraIdRef.current = nextCamera.deviceId;
      await startCamera(nextCamera.deviceId);
    } else {
      const nextMode = facingMode === "environment" ? "user" : "environment";
      setFacingMode(nextMode);
      await startCamera(undefined, nextMode);
    }
  };

  const switchCameraFacing = () => switchCamera();

  // Soumission manuelle
  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    await processCheckIn(manualCode.trim());
    setManualCode("");
    setIsManualInputOpen(false);
  };

  // Encaissement en espèces sur place
  const handleCollectCash = async (bookingId: string, amount: number) => {
    if (operatorPermissions && !operatorPermissions.canCollectCash) {
      alert("Accès refusé : Vous ne disposez pas de l'habilitation d'encaisser du cash sur le quai d'embarquement.");
      return;
    }
    setIsCollectingCash(true);
    try {
      const res = await collectCashBalanceAction(bookingId, amount);
      if (res.success) {
        sensoryFeedback.playSuccess();
        // Mettre à jour les données dans la modale
        if (scanModal && scanModal.type === "SUCCESS") {
          setScanModal({
            ...scanModal,
            data: {
              ...scanModal.data,
              booking: {
                ...scanModal.data.booking,
                balanceDue: 0,
                isFullyPaid: true,
              },
            },
          });
        }
        loadTripData(selectedTripId);
      } else {
        alert(res.error || "Erreur lors de l'encaissement.");
      }
    } catch (e: any) {
      alert(e.message || "Erreur lors de l'encaissement.");
    } finally {
      setIsCollectingCash(false);
    }
  };

  // Toggle check-in manuel d'un voyageur depuis le tiroir
  const handleToggleTraveler = async (travelerId: string) => {
    try {
      const res = await toggleTravelerBoardingAction(travelerId, selectedTripId);
      if (res.success) {
        if (res.isCheckedIn) {
          sensoryFeedback.playSuccess();
        }
        loadTripData(selectedTripId);
      }
    } catch (e) {
      console.error("Toggle traveler error:", e);
    }
  };

  // Énumération des caméras et démarrage initial du scanner
  useEffect(() => {
    let isCancelled = false;

    async function loadCameras() {
      try {
        // 1. Demander une première autorisation pour pouvoir lire les labels des caméras
        const initialStream = await getCameraStream();
        initialStream.getTracks().forEach((track) => track.stop()); // Libérer le flux temporaire

        // 2. Énumérer les périphériques réels
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((device) => device.kind === "videoinput");

        if (isCancelled) return;
        setAvailableCameras(videoDevices);

        let chosenCameraId = "";
        if (videoDevices.length > 0) {
          // Sélectionne en priorité la caméra arrière si identifiée, sinon la première disponible
          const backCamera = videoDevices.find((d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("arrière") ||
            d.label.toLowerCase().includes("environment")
          );
          chosenCameraId = backCamera ? backCamera.deviceId : videoDevices[0].deviceId;
          setSelectedCameraId(chosenCameraId);
          selectedCameraIdRef.current = chosenCameraId;
        }

        if (!isCancelled) {
          await startCamera(chosenCameraId || undefined);
        }
      } catch (err) {
        console.error("Erreur accès caméras :", err);
        if (!isCancelled) {
          await startCamera();
        }
      }
    }

    loadCameras();

    return () => {
      isCancelled = true;
      stopCamera();
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [startCamera, stopCamera]);

  const selectedTripObj = initialTrips.find((t) => t.id === selectedTripId);
  const progressPercent = stats.totalPassengers > 0 
    ? Math.min(100, Math.round((stats.checkedInCount / stats.totalPassengers) * 100))
    : 0;

  // Filtrage des passagers dans le drawer
  const filteredTravelers = travelers.filter((tr) => {
    const matchesSearch = 
      tr.fullName.toLowerCase().includes(drawerSearch.toLowerCase()) ||
      tr.cinPassport.toLowerCase().includes(drawerSearch.toLowerCase()) ||
      tr.bookingReference.toLowerCase().includes(drawerSearch.toLowerCase());
    
    if (!matchesSearch) return false;
    if (drawerFilter === "CHECKED") return tr.isCheckedIn;
    if (drawerFilter === "PENDING") return !tr.isCheckedIn;
    return true;
  });

  return (
    <div className="min-h-[calc(100vh-8rem)] bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 flex flex-col justify-between select-none rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-colors duration-200">
      {/* ========================================================================= */}
      {/* 1. EN-TÊTE FIXE MOBILE : SÉLECTEUR DE VOYAGE & STATS DE PRÉSENCE EN DIRECT */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-4 py-3 space-y-3 transition-colors">
        {/* Navigation & Titre */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <Link
              href={`/${locale}/admin/trips`}
              className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition active:scale-95"
              aria-label="Retour"
            >
              <ArrowLeft className="w-4 h-4 rtl:rotate-180" />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <h1 className="text-xs font-black uppercase tracking-wider text-cyan-600 dark:text-tp-cyan truncate">
                  Pointage Autocar TIST
                </h1>
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {selectedTripObj ? (isAr ? selectedTripObj.titleAr : selectedTripObj.titleFr) : "Sélectionnez un circuit"}
                </p>
                {operatorPermissions && (
                  <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-pill bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[10px] font-bold text-slate-700 dark:text-slate-300">
                    <UserCheck className="w-3 h-3 text-cyan-500" />
                    <span>{operatorPermissions.fullName}</span>
                    <span className="text-cyan-600 dark:text-cyan-400">({operatorPermissions.role})</span>
                    {operatorPermissions.canCollectCash && (
                      <span className="text-emerald-500 font-mono text-[9px] font-bold">💵 Cash OK</span>
                    )}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Bouton vers la feuille de route officielle */}
          {selectedTripId && (
            <Link
              href={`/${locale}/admin/trips/${selectedTripId}/voyageurs`}
              className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1.5 transition shrink-0 active:scale-95"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-600 dark:text-tp-cyan" />
              <span className="hidden sm:inline">Manifeste TIST</span>
            </Link>
          )}
        </div>

        {/* Sélecteur de Circuit Déroulant */}
        <div className="relative">
          <select
            value={selectedTripId}
            onChange={(e) => {
              setSelectedTripId(e.target.value);
              router.replace(`/${locale}/admin/scanner?tripId=${e.target.value}`);
            }}
            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl px-3.5 py-2.5 text-xs font-bold appearance-none focus:outline-none focus:border-cyan-500 dark:focus:border-tp-cyan transition pr-10 cursor-pointer shadow-xs"
          >
            {initialTrips.map((t) => (
              <option key={t.id} value={t.id}>
                {isAr ? t.titleAr : t.titleFr} ({t.departureDateStr}) — {t.totalPassengers} pax
              </option>
            ))}
          </select>
          <ChevronDown className="w-4 h-4 text-slate-400 absolute end-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        </div>

        {/* Pastille KPI & Barre de Progression */}
        <div className="bg-slate-50 dark:bg-slate-900/90 rounded-2xl border border-slate-200 dark:border-slate-800/80 p-3 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-cyan-600 dark:text-tp-cyan" />
              <span>Passagers à bord :</span>
            </span>
            <span className="font-mono font-black text-slate-900 dark:text-white">
              <strong className="text-emerald-600 dark:text-emerald-400 text-sm">{stats.checkedInCount}</strong>
              <span className="text-slate-500 dark:text-slate-400"> / {stats.totalPassengers} pointés</span>
              <span className="ms-1.5 text-cyan-600 dark:text-tp-cyan font-bold">({progressPercent}%)</span>
            </span>
          </div>

          {/* Barre de progression fluide */}
          <div className="w-full bg-slate-200 dark:bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-300/60 dark:border-slate-800">
            <div
              className="bg-gradient-to-r from-cyan-500 to-emerald-400 h-full transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>

          {/* Badges récapitulatifs */}
          <div className="flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400 pt-0.5">
            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold">
              <CheckCircle2 className="w-3 h-3" />
              {stats.checkedInCount} monté(s)
            </span>
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400 font-bold">
              <Clock className="w-3 h-3" />
              {stats.pendingCount} en attente
            </span>
            <span className="text-slate-500 dark:text-slate-400 font-mono">
              Capacité : {tripDetails?.totalSeats || selectedTripObj?.totalSeats || 48}
            </span>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. ZONE DE VISEUR CAMÉRA CENTRALE (HTML5-QRCODE + VISEUR CYAN ANIMÉ) */}
      {/* ========================================================================= */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 relative overflow-hidden">
        {/* Conteneur du Viseur Caméra */}
        <div className="w-full max-w-sm aspect-square relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-950 border-2 border-slate-300 dark:border-slate-800 shadow-xl flex items-center justify-center">
          {/* Element DOM requis pour html5-qrcode */}
          <div id="reader-viewport" className="w-full h-full object-cover" />

          {/* Cadre de Ciblage Cyan Stylisé (4 Coins & Effet Laser) */}
          <div className="absolute inset-6 pointer-events-none z-10 flex flex-col justify-between">
            {/* Coin Haut Gauche & Haut Droit */}
            <div className="flex justify-between">
              <div className="w-8 h-8 border-t-4 border-l-4 border-cyan-500 dark:border-tp-cyan rounded-tl-xl shadow-sm" />
              <div className="w-8 h-8 border-t-4 border-r-4 border-cyan-500 dark:border-tp-cyan rounded-tr-xl shadow-sm" />
            </div>

            {/* Ligne Laser de Scan Animée */}
            {isScannerRunning && (
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-500 dark:via-tp-cyan to-transparent shadow-[0_0_12px_#00c0d8] animate-bounce" />
            )}

            {/* Coin Bas Gauche & Bas Droit */}
            <div className="flex justify-between">
              <div className="w-8 h-8 border-b-4 border-l-4 border-cyan-500 dark:border-tp-cyan rounded-bl-xl shadow-sm" />
              <div className="w-8 h-8 border-b-4 border-r-4 border-cyan-500 dark:border-tp-cyan rounded-br-xl shadow-sm" />
            </div>
          </div>

          {/* Message si caméra en chargement ou erreur */}
          {!isScannerRunning && (
            <div className="absolute inset-0 bg-white/95 dark:bg-slate-950/95 z-20 flex flex-col items-center justify-center p-6 text-center space-y-3">
              {cameraError ? (
                <>
                  <CameraOff className="w-10 h-10 text-red-500" />
                  <p className="text-xs text-red-600 dark:text-red-300 font-bold max-w-xs">{cameraError}</p>
                  <button
                    onClick={() => startCamera()}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-bold transition shadow-sm"
                  >
                    Réessayer
                  </button>
                </>
              ) : (
                <>
                  <Loader2 className="w-8 h-8 text-cyan-500 dark:text-tp-cyan animate-spin" />
                  <p className="text-xs text-slate-600 dark:text-slate-300 font-bold">Initialisation de la caméra...</p>
                </>
              )}
            </div>
          )}

          {/* Indicateur de statut en cours */}
          {isSubmittingCheckIn && (
            <div className="absolute inset-0 bg-slate-950/80 z-25 flex flex-col items-center justify-center p-4 backdrop-blur-xs space-y-2">
              <Loader2 className="w-8 h-8 text-cyan-400 dark:text-tp-cyan animate-spin" />
              <p className="text-xs text-white font-black">Vérification du dossier...</p>
            </div>
          )}
        </div>

        {/* Contrôles de la Caméra (Torche, Bascule caméra, Saisie manuelle) */}
        <div className="w-full max-w-sm mt-4 flex items-center justify-center gap-3">
          {/* Bouton Flash / Torche */}
          <button
            type="button"
            onClick={toggleTorch}
            disabled={!isTorchSupported || !isScannerRunning}
            className={`p-3.5 rounded-2xl border transition active:scale-95 flex items-center gap-1.5 text-xs font-bold shadow-sm ${
              isTorchOn
                ? "bg-amber-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20"
                : "bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 disabled:opacity-40"
            }`}
            title="Activer la torche"
          >
            {isTorchOn ? <FlashlightOff className="w-4 h-4" /> : <Flashlight className="w-4 h-4" />}
            <span className="hidden xs:inline">{isTorchOn ? "Éteindre" : "Flash"}</span>
          </button>

          {/* Bouton Bascule Caméra (Front/Back) */}
          <button
            type="button"
            onClick={() => switchCamera()}
            className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs transition active:scale-95 flex items-center gap-1.5 shadow-sm"
            title={
              availableCameras.length > 1
                ? `Changer d'objectif (${availableCameras.find((c) => c.deviceId === selectedCameraId)?.label || "Caméra"})`
                : "Changer de caméra"
            }
          >
            <RefreshCw className="w-4 h-4" />
            <span className="hidden xs:inline">
              {availableCameras.length > 1 ? `Objectif (${availableCameras.length})` : "Caméra"}
            </span>
          </button>

          {/* Bouton Saisie Manuelle (Code endommagé) */}
          <button
            type="button"
            onClick={() => setIsManualInputOpen(true)}
            className="p-3.5 rounded-2xl bg-cyan-50 dark:bg-tp-cyan/10 hover:bg-cyan-100 dark:hover:bg-tp-cyan/20 border border-cyan-200 dark:border-tp-cyan/30 text-cyan-800 dark:text-tp-cyan font-bold text-xs transition active:scale-95 flex items-center gap-1.5 shadow-sm"
            title="Saisie manuelle"
          >
            <Keyboard className="w-4 h-4" />
            <span>Saisie manuelle</span>
          </button>
        </div>

        {/* Sélecteur de capteur si plusieurs caméras détectées */}
        {availableCameras.length > 1 && (
          <div className="w-full max-w-sm mt-3 flex items-center justify-center animate-in fade-in">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 shadow-sm max-w-full">
              <Camera className="w-3.5 h-3.5 text-cyan-600 dark:text-tp-cyan shrink-0" />
              <select
                value={selectedCameraId}
                onChange={(e) => switchCamera(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-200 font-semibold text-xs focus:outline-none cursor-pointer truncate max-w-[240px]"
              >
                {availableCameras.map((cam, idx) => (
                  <option
                    key={cam.deviceId || idx}
                    value={cam.deviceId}
                    className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {cam.label || `Caméra ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* 3. BARRE INFÉRIEURE : ACCÈS RAPIDE À LA LISTE DES PASSAGERS */}
      {/* ========================================================================= */}
      <footer className="sticky bottom-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 p-3 transition-colors">
        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className="w-full py-3 px-4 rounded-2xl bg-slate-50 hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-between transition shadow-xs active:scale-95"
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-cyan-600 dark:text-tp-cyan" />
            <span>Liste d&apos;émargement ({travelers.length} voyageurs)</span>
          </div>
          <span className="text-[11px] text-cyan-600 dark:text-tp-cyan font-bold">Consulter & Pointer &rarr;</span>
        </button>
      </footer>

      {/* ========================================================================= */}
      {/* MODAL 1 : RÉSULTAT DE SCAN (SUCCÈS / DÉJÀ POINTÉ / ERREUR) */}
      {/* ========================================================================= */}
      {scanModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-5 text-center relative overflow-hidden text-slate-900 dark:text-white">
            {/* CAS 1 : SUCCÈS - PASSAGER POINTÉ */}
            {scanModal.type === "SUCCESS" && (
              <>
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto ring-8 ring-emerald-500/10 animate-pulse">
                  <CheckCircle2 className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 font-black text-[10px] uppercase tracking-wider border border-emerald-300 dark:border-emerald-500/30">
                    Embarquement Validé
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    {scanModal.data.travelers?.[0]?.fullName || scanModal.data.booking?.clientName}
                  </h3>
                  <p className="text-xs font-mono text-cyan-600 dark:text-tp-cyan font-bold">
                    Réf. {scanModal.data.booking?.reference}
                  </p>
                </div>

                {/* Fiche Voyageur Détails */}
                <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-start space-y-2.5 text-xs text-slate-800 dark:text-slate-200">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">N° CIN / Passeport :</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {scanModal.data.travelers?.[0]?.cinPassport || "—"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Point de Ramassage :</span>
                    <span className="font-bold text-cyan-600 dark:text-tp-cyan flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {scanModal.data.booking?.pickupCity || "Casablanca"}
                    </span>
                  </div>

                  {scanModal.data.travelers?.length > 1 && (
                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 block mb-1">
                        Voyageurs du dossier ({scanModal.data.travelers.length}) :
                      </span>
                      <ul className="space-y-1">
                        {scanModal.data.travelers.map((t: any) => (
                          <li key={t.id} className="text-[11px] text-slate-700 dark:text-slate-300 font-bold flex items-center gap-1.5">
                            <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>{t.fullName}</span>
                            <span className="font-mono text-slate-400">({t.cinPassport})</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* STATUT FINANCIER & ENCAISSEMENT EN ESPÈCES */}
                {scanModal.data.booking?.balanceDue > 0 ? (
                  <div className="bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 rounded-2xl p-4 text-start space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-amber-800 dark:text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Solde à percevoir :
                      </span>
                      <span className="text-base font-mono font-black text-amber-700 dark:text-amber-300">
                        {scanModal.data.booking.balanceDue.toLocaleString("fr-FR")} MAD
                      </span>
                    </div>

                    {operatorPermissions && !operatorPermissions.canCollectCash ? (
                      <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-bold text-center border border-slate-200 dark:border-slate-700">
                        🔒 Encaissement en espèces réservé aux chefs de voyage habilités
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          handleCollectCash(
                            scanModal.data.booking.id,
                            scanModal.data.booking.balanceDue
                          )
                        }
                        disabled={isCollectingCash}
                        className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition shadow-md flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
                      >
                        {isCollectingCash ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Encaissement...</span>
                          </>
                        ) : (
                          <>
                            <DollarSign className="w-4 h-4" />
                            <span>Encaisser {scanModal.data.booking.balanceDue.toLocaleString("fr-FR")} MAD en espèces</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-2xl p-2.5 text-center text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center justify-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Billet 100% Soldé • Aucun reliquat</span>
                  </div>
                )}

                {/* Bouton Passager Suivant + Compte à rebours */}
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={closeModalAndResume}
                    className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-600 dark:bg-tp-cyan dark:hover:bg-tp-cyan-hover text-slate-950 font-black text-sm shadow-lg shadow-cyan-500/25 transition active:scale-95 flex items-center justify-center gap-2"
                  >
                    <span>Passager Suivant</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-950/20 text-slate-950 text-xs font-mono">
                      {countdown}s
                    </span>
                  </button>
                </div>
              </>
            )}

            {/* CAS 2 : PASSAGER DÉJÀ POINTÉ (ALERTE AMBRE) */}
            {scanModal.type === "ALREADY_CHECKED_IN" && (
              <>
                <div className="w-16 h-16 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto ring-8 ring-amber-500/10">
                  <AlertTriangle className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 font-black text-[10px] uppercase tracking-wider border border-amber-300 dark:border-amber-500/30">
                    Doublon Détecté
                  </span>
                  <h3 className="text-xl font-black text-slate-900 dark:text-white">
                    Passager déjà monté à bord
                  </h3>
                  <p className="text-xs text-amber-700 dark:text-amber-300 font-bold">
                    Pointé à {scanModal.data.checkedInAtTime || "une heure précédente"}
                  </p>
                </div>

                <div className="bg-slate-50 dark:bg-slate-950/80 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 text-start space-y-2 text-xs">
                  <p className="text-slate-900 dark:text-white font-bold">
                    {scanModal.data.travelers?.[0]?.fullName || scanModal.data.booking?.clientName}
                  </p>
                  <p className="font-mono text-slate-500 dark:text-slate-400">
                    CIN : {scanModal.data.travelers?.[0]?.cinPassport || "—"}
                  </p>
                  <p className="font-mono text-cyan-600 dark:text-tp-cyan text-[11px] font-bold">
                    Dossier : {scanModal.data.booking?.reference}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModalAndResume}
                  className="w-full py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-xs border border-slate-200 dark:border-slate-700 transition active:scale-95"
                >
                  Continuer le Scan
                </button>
              </>
            )}

            {/* CAS 3 : ERREUR / MAUVAIS VOYAGE / CODE INVALIDE */}
            {scanModal.type === "ERROR" && (
              <>
                <div className="w-16 h-16 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto ring-8 ring-red-500/10">
                  <XCircle className="w-9 h-9" />
                </div>

                <div className="space-y-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 font-black text-[10px] uppercase tracking-wider border border-red-300 dark:border-red-500/30">
                    {scanModal.title}
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white">
                    Accès Refusé
                  </h3>
                  <p className="text-xs text-red-600 dark:text-red-300 font-bold">
                    {scanModal.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={closeModalAndResume}
                  className="w-full py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition active:scale-95 shadow-md shadow-red-600/20"
                >
                  Réessayer
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2 : SAISIE MANUELLE (POUR QR CODES ILLISIBLES OU DÉGRADÉS) */}
      {/* ========================================================================= */}
      {isManualInputOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-slate-950/85 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-cyan-600 dark:text-tp-cyan font-bold text-sm">
                <Keyboard className="w-4 h-4" />
                <span>Saisie Manuelle</span>
              </div>
              <button
                type="button"
                onClick={() => setIsManualInputOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white text-lg"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Tapez la référence du dossier (ex: <strong className="text-slate-900 dark:text-white">RB-2026-342873</strong>) ou le N° CIN du voyageur :
            </p>

            <form onSubmit={handleManualSubmit} className="space-y-3">
              <input
                type="text"
                autoFocus
                placeholder="Ex: RB-2026-342873 ou A123456"
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white text-sm font-mono placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-cyan-500 dark:focus:border-tp-cyan focus:outline-none uppercase shadow-xs"
              />

              <div className="flex items-center gap-2">
                <button
                  type="submit"
                  disabled={!manualCode.trim() || isSubmittingCheckIn}
                  className="flex-1 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-600 dark:bg-tp-cyan dark:hover:bg-tp-cyan-hover text-slate-950 font-black text-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
                >
                  {isSubmittingCheckIn ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <span>Valider le Pointage</span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setIsManualInputOpen(false)}
                  className="px-4 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DRAWER / BOTTOM SHEET : FEUILLE D'ÉMARGEMENT EN DIRECT */}
      {/* ========================================================================= */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 dark:bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-h-[85vh] bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-4 sm:p-6 shadow-2xl flex flex-col space-y-4 text-slate-900 dark:text-white">
            {/* Header du Drawer */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-600 dark:text-tp-cyan" />
                  <span>Feuille d&apos;Émargement Autocar</span>
                </h3>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {stats.checkedInCount} / {stats.totalPassengers} passagers montés
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition"
              >
                Fermer
              </button>
            </div>

            {/* Barre de Recherche et Filtres */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute start-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, CIN, dossier..."
                  value={drawerSearch}
                  onChange={(e) => setDrawerSearch(e.target.value)}
                  className="w-full ps-9 pe-4 py-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:border-cyan-500 dark:focus:border-tp-cyan shadow-xs"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDrawerFilter("ALL")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    drawerFilter === "ALL"
                      ? "bg-cyan-500 text-slate-950 font-black shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  Tous ({travelers.length})
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerFilter("PENDING")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    drawerFilter === "PENDING"
                      ? "bg-amber-500 text-slate-950 font-black shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  En Attente ({stats.pendingCount})
                </button>
                <button
                  type="button"
                  onClick={() => setDrawerFilter("CHECKED")}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    drawerFilter === "CHECKED"
                      ? "bg-emerald-500 text-slate-950 font-black shadow-xs"
                      : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                  }`}
                >
                  À Bord ({stats.checkedInCount})
                </button>
              </div>
            </div>

            {/* Liste scrollable des voyageurs */}
            <div className="flex-1 overflow-y-auto space-y-2 max-h-[50vh] pr-1 divide-y divide-slate-100 dark:divide-slate-800/60">
              {filteredTravelers.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
                  Aucun voyageur ne correspond aux filtres.
                </div>
              ) : (
                filteredTravelers.map((tr) => (
                  <div
                    key={tr.id}
                    className="pt-2 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-slate-900 dark:text-white truncate">{tr.fullName}</p>
                      <div className="flex items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>CIN : {tr.cinPassport}</span>
                        <span>•</span>
                        <span className="text-cyan-600 dark:text-tp-cyan font-bold">{tr.bookingReference}</span>
                      </div>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-2.5 h-2.5 text-slate-400" />
                        <span>{tr.pickupCity}</span>
                        {tr.balanceDue > 0 && (
                          <span className="text-amber-600 dark:text-amber-400 font-bold ms-1">
                            (Dû: {tr.balanceDue} MAD)
                          </span>
                        )}
                      </p>
                    </div>

                    {/* Bouton Switch Embarquement Manuel */}
                    <button
                      type="button"
                      onClick={() => handleToggleTraveler(tr.id)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                        tr.isCheckedIn
                          ? "bg-emerald-100 dark:bg-emerald-500/20 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-500/30"
                          : "bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-700"
                      }`}
                    >
                      {tr.isCheckedIn ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>À bord</span>
                        </>
                      ) : (
                        <span>Pointer</span>
                      )}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
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

type ErrorSubType =
  | "NOT_FOUND"        // QR inconnu
  | "WRONG_TRIP"       // Passager d'un autre voyage
  | "CANCELLED"        // Réservation annulée
  | "NETWORK"          // Erreur réseau / serveur
  | "PERMISSION"       // Accès refusé (profil inactif ou sans permission)
  | "NO_TRIP"          // Aucun voyage sélectionné
  | "GENERIC";         // Autre erreur technique

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
      subType: ErrorSubType;
      title: string;
      message: string;
      canRetryImmediately: boolean; // true = reprend le scan auto, false = attend l'action utilisateur
      details?: any;
    }
  | null;

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
  const [retryCount, setRetryCount] = useState(0); // Compteur de tentatives réseau

  // 4. Modal de résultat de scan
  const [scanModal, setScanModal] = useState<ScanResultModal>(null);
  const [countdown, setCountdown] = useState<number>(3);
  const [isCollectingCash, setIsCollectingCash] = useState(false);

  // Ref pour cooldown anti-doublon (évite les double-scans involontaires)
  const lastScannedCodeRef = useRef<string>("");
  const lastScannedAtRef = useRef<number>(0);

  // 5. Drawer Feuille de route
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerSearch, setDrawerSearch] = useState("");
  const [drawerFilter, setDrawerFilter] = useState<"ALL" | "CHECKED" | "PENDING">("ALL");

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const currentStreamRef = useRef<MediaStream | null>(null);
  const detectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const zxingReaderRef = useRef<any>(null);
  const isScanningRef = useRef(false);
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

  // ─────────────────────────────────────────────────────────────────────────
  // CAMÉRA — Toutes les fonctions sont des refs stables pour éviter les
  // dépendances circulaires useCallback → useEffect → re-render → boucle infinie
  // ─────────────────────────────────────────────────────────────────────────

  // ── stopCamera ─────────────────────────────────────────────────────────────
  const stopCameraRef = useRef<() => void>(() => {});
  stopCameraRef.current = () => {
    isScanningRef.current = false;
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (zxingReaderRef.current) {
      try { zxingReaderRef.current.reset(); } catch {}
      zxingReaderRef.current = null;
    }
    if (currentStreamRef.current) {
      try { currentStreamRef.current.getTracks().forEach((t) => t.stop()); } catch {}
      currentStreamRef.current = null;
    }
    if (videoRef.current) {
      try { videoRef.current.srcObject = null; } catch {}
    }
    setIsScannerRunning(false);
    setIsTorchOn(false);
  };
  const stopCamera = useCallback(() => stopCameraRef.current(), []);

  // ── startScanningLoop ─────────────────────────────────────────────────────
  const startScanningLoopRef = useRef<(video: HTMLVideoElement) => void>(() => {});
  startScanningLoopRef.current = (video: HTMLVideoElement) => {
    isScanningRef.current = true;
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (zxingReaderRef.current) {
      try { zxingReaderRef.current.reset(); } catch {};
      zxingReaderRef.current = null;
    }

    // ─── Approche A : BarcodeDetector natif ────────────────────────────────
    if (typeof window !== "undefined" && "BarcodeDetector" in window) {
      let detector: any = null;
      try {
        detector = new (window as any).BarcodeDetector({ formats: ["qr_code"] });
      } catch { detector = null; }

      if (detector) {
        detectionIntervalRef.current = setInterval(async () => {
          if (!isScanningRef.current || isProcessingRef.current) return;
          if (!video || video.readyState < 2 || video.videoWidth === 0) return;
          try {
            const barcodes = await detector.detect(video);
            if (barcodes?.length > 0) {
              const raw = barcodes[0]?.rawValue?.trim();
              if (raw && isScanningRef.current && !isProcessingRef.current) {
                handleDetectedCodeRef.current?.(raw);
              }
            }
          } catch { /* frame ignorée */ }
        }, 120);
        return;
      }
    }

    // ─── Approche B : Canvas + jsQR (universel — iOS Safari, Firefox, etc.) ─
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) { console.warn("Canvas 2D indisponible"); return; }

    detectionIntervalRef.current = setInterval(async () => {
      if (!isScanningRef.current || isProcessingRef.current) return;
      if (!video || video.readyState < 2 || video.videoWidth === 0) return;
      try {
        canvas.width  = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const jsQR = (await import("jsqr")).default;
        const result = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        if (result?.data && isScanningRef.current && !isProcessingRef.current) {
          handleDetectedCodeRef.current?.(result.data.trim());
        }
      } catch { /* frame ignorée */ }
    }, 180);
  };
  const startScanningLoop = useCallback((video: HTMLVideoElement) => startScanningLoopRef.current(video), []);

  // ── attachStreamToVideo ────────────────────────────────────────────────────
  const attachStreamToVideoRef = useRef<(stream: MediaStream) => void>(() => {});
  attachStreamToVideoRef.current = (stream: MediaStream) => {
    currentStreamRef.current = stream;
    const video = videoRef.current;
    if (!video) return;

    video.srcObject = stream;
    video.setAttribute("playsinline", "true");

    // Vérifier support torche
    try {
      const track = stream.getVideoTracks()[0];
      if (track && typeof track.getCapabilities === "function") {
        const caps: any = track.getCapabilities();
        setIsTorchSupported(!!caps.torch);
      } else {
        setIsTorchSupported(false);
      }
    } catch {
      setIsTorchSupported(false);
    }

    const onPlaying = () => {
      setIsScannerRunning(true);
      setCameraError(null);
      startScanningLoopRef.current(video);
      video.removeEventListener("playing", onPlaying);
    };

    video.addEventListener("playing", onPlaying);

    video.play().catch((err) => {
      console.warn("Video play() avertissement :", err);
      // Sur iOS le play peut échouer en silence — on force quand même le scan
      setIsScannerRunning(true);
      setCameraError(null);
      startScanningLoopRef.current(video);
    });

    // Énumération des caméras disponibles (après permission accordée)
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.enumerateDevices) {
      navigator.mediaDevices
        .enumerateDevices()
        .then((devices) => {
          const videoDevices = devices.filter((d) => d.kind === "videoinput");
          setAvailableCameras(videoDevices);
        })
        .catch(() => {});
    }
  };
  const attachStreamToVideo = useCallback((stream: MediaStream) => attachStreamToVideoRef.current(stream), []);

  // ── startCamera ────────────────────────────────────────────────────────────
  const startCameraRef = useRef<(preferredCameraId?: string, preferredFacing?: "environment" | "user") => Promise<void>>(async () => {});
  startCameraRef.current = async (preferredCameraId?: string, preferredFacing?: "environment" | "user") => {
    stopCameraRef.current();
    setCameraError(null);

    const targetFacing = preferredFacing || facingMode;

    try {
      // Tentative 1 : contrainte souple (facingMode ou deviceId spécifique)
      const videoConstraints: MediaTrackConstraints = preferredCameraId
        ? { deviceId: { exact: preferredCameraId } }
        : {
            facingMode: { ideal: targetFacing },
            width:  { ideal: 1280 },
            height: { ideal: 720 },
          };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });
      attachStreamToVideoRef.current(stream);
    } catch (err: any) {
      console.warn("Tentative idéale échouée, repli sans contrainte…", err);
      try {
        // Tentative 2 : repli universel sans contrainte
        const fallbackStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
        attachStreamToVideoRef.current(fallbackStream);
      } catch (finalError: any) {
        console.error("Accès caméra impossible :", finalError);
        setIsScannerRunning(false);
        if (finalError.name === "NotAllowedError" || finalError.name === "PermissionDeniedError") {
          setCameraError("Permission caméra refusée. Appuyez sur l'icône 🔒 dans la barre d'adresse pour autoriser l'appareil photo.");
        } else if (finalError.name === "NotFoundError") {
          setCameraError("Aucune caméra physique détectée sur cet appareil.");
        } else if (finalError.name === "NotReadableError" || finalError.name === "TrackStartError") {
          setCameraError("La caméra est déjà utilisée par une autre application. Fermez les autres apps et réessayez.");
        } else {
          setCameraError("Impossible d'accéder à la caméra (" + finalError.name + "). Vérifiez les autorisations.");
        }
      }
    }
  };
  const startCamera = useCallback(
    (preferredCameraId?: string, preferredFacing?: "environment" | "user") =>
      startCameraRef.current(preferredCameraId, preferredFacing),
    []
  );

  // ── Basculement entre caméras ──────────────────────────────────────────────
  const switchCamera = async (targetCameraId?: string) => {
    stopCameraRef.current();
    if (targetCameraId) {
      setSelectedCameraId(targetCameraId);
      selectedCameraIdRef.current = targetCameraId;
      await startCameraRef.current(targetCameraId);
      return;
    }
    if (availableCameras.length > 1) {
      const currentId = selectedCameraIdRef.current || selectedCameraId;
      const currentIndex = availableCameras.findIndex((cam) => cam.deviceId === currentId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      const nextCamera = availableCameras[nextIndex];
      setSelectedCameraId(nextCamera.deviceId);
      selectedCameraIdRef.current = nextCamera.deviceId;
      await startCameraRef.current(nextCamera.deviceId);
    } else {
      const nextMode = facingMode === "environment" ? "user" : "environment";
      setFacingMode(nextMode);
      await startCameraRef.current(undefined, nextMode);
    }
  };

  const toggleTorch = async () => {
    if (!currentStreamRef.current || !isTorchSupported) return;
    try {
      const track = currentStreamRef.current.getVideoTracks()[0];
      const newState = !isTorchOn;
      await track.applyConstraints({ advanced: [{ torch: newState } as any] });
      setIsTorchOn(newState);
    } catch (e) {
      console.warn("Torch toggle error:", e);
    }
  };

  // Détection du QR Code

  const handleDetectedCode = async (rawCode: string) => {
    if (isProcessingRef.current || scanModal) return;
    isProcessingRef.current = true;
    isScanningRef.current = false;

    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
      detectionIntervalRef.current = null;
    }
    if (zxingReaderRef.current) {
      try {
        zxingReaderRef.current.reset();
      } catch {}
    }

    await processCheckIn(rawCode);
  };
  handleDetectedCodeRef.current = handleDetectedCode;

  // Traitement Métier du Pointage — avec classification fine des erreurs
  const processCheckIn = async (code: string, attempt = 1) => {
    // Protection anti-doublon : rejeter le même code scanné dans les 4 secondes
    const now = Date.now();
    if (code === lastScannedCodeRef.current && now - lastScannedAtRef.current < 4000) {
      isProcessingRef.current = false;
      isScanningRef.current = true;
      if (videoRef.current && currentStreamRef.current?.active) {
        startScanningLoop(videoRef.current);
      }
      return;
    }

    if (!selectedTripId) {
      sensoryFeedback.playError();
      setScanModal({
        type: "ERROR",
        subType: "NO_TRIP",
        title: "Aucun Voyage Sélectionné",
        message: "Veuillez d'abord sélectionner un circuit dans le menu déroulant avant de scanner.",
        canRetryImmediately: false,
      });
      setIsSubmittingCheckIn(false);
      isProcessingRef.current = false;
      return;
    }

    setIsSubmittingCheckIn(true);
    try {
      const result = await checkInPassengerAction(code, selectedTripId);

      // Enregistrer le code scanné pour protection anti-doublon
      lastScannedCodeRef.current = code;
      lastScannedAtRef.current = Date.now();
      setRetryCount(0);

      if (result.status === "SUCCESS") {
        sensoryFeedback.playSuccess();
        setScanModal({ type: "SUCCESS", data: result });
        loadTripData(selectedTripId);
        startAutoResumeTimer();

      } else if (result.status === "ALREADY_CHECKED_IN") {
        sensoryFeedback.playWarning();
        setScanModal({ type: "ALREADY_CHECKED_IN", data: result });

      } else if (result.status === "WRONG_TRIP") {
        sensoryFeedback.playError();
        setScanModal({
          type: "ERROR",
          subType: "WRONG_TRIP",
          title: "Passager sur un Autre Voyage",
          message: result.error || `Ce billet est associé au voyage : "${(result as any).tripTitle}".
Vérifiez le circuit sélectionné.`,
          canRetryImmediately: false,
          details: result,
        });

      } else if (result.status === "CANCELLED") {
        sensoryFeedback.playError();
        setScanModal({
          type: "ERROR",
          subType: "CANCELLED",
          title: "Réservation Annulée",
          message: result.error || "Ce dossier a été annulé. Le passager ne peut pas embarquer.",
          canRetryImmediately: false,
          details: result,
        });

      } else if (result.status === "NOT_FOUND") {
        sensoryFeedback.playError();
        setScanModal({
          type: "ERROR",
          subType: "NOT_FOUND",
          title: "QR Code Non Reconnu",
          message: result.error || "Aucune réservation ne correspond à ce code. Vérifiez le billet ou utilisez la saisie manuelle.",
          canRetryImmediately: true,
          details: result,
        });

      } else if (result.status === "ERROR" && (result.error?.includes("inactif") || result.error?.includes("permission"))) {
        sensoryFeedback.playError();
        setScanModal({
          type: "ERROR",
          subType: "PERMISSION",
          title: "Accès Refusé",
          message: result.error || "Votre profil ne dispose pas de la permission de pointer les billets.",
          canRetryImmediately: false,
          details: result,
        });

      } else {
        sensoryFeedback.playError();
        setScanModal({
          type: "ERROR",
          subType: "GENERIC",
          title: "Erreur de Validation",
          message: result.error || "Impossible de valider ce billet. Réessayez ou utilisez la saisie manuelle.",
          canRetryImmediately: true,
          details: result,
        });
      }

    } catch (err: any) {
      sensoryFeedback.playError();
      const isNetworkError =
        err.name === "TypeError" ||
        err.message?.includes("fetch") ||
        err.message?.includes("network") ||
        err.message?.includes("Failed");

      // Retry automatique jusqu'à 2 fois pour les erreurs réseau
      if (isNetworkError && attempt <= 2) {
        setRetryCount(attempt);
        const delay = attempt * 1200; // 1.2s puis 2.4s
        await new Promise((r) => setTimeout(r, delay));
        setIsSubmittingCheckIn(false);
        await processCheckIn(code, attempt + 1);
        return;
      }

      setRetryCount(0);
      setScanModal({
        type: "ERROR",
        subType: isNetworkError ? "NETWORK" : "GENERIC",
        title: isNetworkError ? "Problème de Connexion" : "Erreur Technique",
        message: isNetworkError
          ? `Impossible de joindre le serveur. Vérifiez votre connexion internet.${attempt > 1 ? ` (${attempt - 1} tentative${attempt > 2 ? "s" : ""})` : ""}`
          : err.message || "Une erreur inattendue s'est produite.",
        canRetryImmediately: false,
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
  // Fermer la modale et reprendre le scan (utilise les refs stables)
  const closeModalAndResume = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setScanModal(null);
    isProcessingRef.current = false;
    isScanningRef.current = true;

    if (videoRef.current && currentStreamRef.current && currentStreamRef.current.active) {
      startScanningLoopRef.current(videoRef.current);
    } else {
      startCameraRef.current();
    }
  };

  // Bascule caméra avant / arrière / multi-objectifs


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

  // Démarrage initial de la caméra au montage — deps [] pour ne jamais relancer
  useEffect(() => {
    startCameraRef.current();
    return () => {
      stopCameraRef.current();
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);



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
          {/* Element vidéo optimisé pour mobile avec les 4 attributs indispensables */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />

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

            {/* CAS 3 : ERREUR — Affichage contextuel selon sous-type */}
            {scanModal.type === "ERROR" && (() => {
              const isWrongTrip = scanModal.subType === "WRONG_TRIP";
              const isCancelled = scanModal.subType === "CANCELLED";
              const isNetwork = scanModal.subType === "NETWORK";
              const isPermission = scanModal.subType === "PERMISSION";
              const isNoTrip = scanModal.subType === "NO_TRIP";
              const isNotFound = scanModal.subType === "NOT_FOUND";

              const iconColor = isWrongTrip
                ? "text-amber-600 dark:text-amber-400 bg-amber-500/20 ring-amber-500/10"
                : isCancelled
                ? "text-red-600 dark:text-red-400 bg-red-500/20 ring-red-500/10"
                : isNetwork
                ? "text-blue-600 dark:text-blue-400 bg-blue-500/20 ring-blue-500/10"
                : isPermission
                ? "text-slate-600 dark:text-slate-400 bg-slate-500/20 ring-slate-500/10"
                : "text-red-600 dark:text-red-400 bg-red-500/20 ring-red-500/10";

              const badgeColor = isWrongTrip
                ? "bg-amber-500/10 dark:bg-amber-500/20 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-500/30"
                : isCancelled || isPermission
                ? "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30"
                : isNetwork
                ? "bg-blue-500/10 dark:bg-blue-500/20 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-500/30"
                : isNoTrip
                ? "bg-slate-500/10 dark:bg-slate-500/20 text-slate-700 dark:text-slate-400 border-slate-300 dark:border-slate-500/30"
                : "bg-red-500/10 dark:bg-red-500/20 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/30";

              const btnColor = isWrongTrip
                ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20"
                : isNetwork
                ? "bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/20"
                : isNoTrip
                ? "bg-slate-700 hover:bg-slate-600 text-white shadow-slate-700/20"
                : "bg-red-600 hover:bg-red-500 text-white shadow-red-600/20";

              return (
                <>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto ring-8 ${iconColor}`}>
                    {isWrongTrip ? (
                      <AlertTriangle className="w-9 h-9" />
                    ) : isNetwork ? (
                      <RefreshCw className="w-9 h-9" />
                    ) : isPermission ? (
                      <ShieldCheck className="w-9 h-9" />
                    ) : isNoTrip ? (
                      <QrCode className="w-9 h-9" />
                    ) : (
                      <XCircle className="w-9 h-9" />
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <span className={`inline-block px-3 py-1 rounded-full font-black text-[10px] uppercase tracking-wider border ${badgeColor}`}>
                      {scanModal.title}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-xs mx-auto whitespace-pre-line">
                      {scanModal.message}
                    </p>

                    {/* Info complémentaire pour mauvais voyage */}
                    {isWrongTrip && (scanModal.details as any)?.tripTitle && (
                      <div className="mt-2 px-3 py-2 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 text-xs text-amber-800 dark:text-amber-300 font-bold">
                        🗺️ Voyage associé : {(scanModal.details as any).tripTitle}
                      </div>
                    )}

                    {/* Info dossier annulé */}
                    {isCancelled && (scanModal.details as any)?.bookingRef && (
                      <div className="mt-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-xs text-red-700 dark:text-red-300 font-mono font-bold">
                        Dossier : {(scanModal.details as any).bookingRef}
                      </div>
                    )}

                    {/* Indicator réseau */}
                    {isNetwork && retryCount > 0 && (
                      <div className="mt-2 text-[11px] text-slate-400 dark:text-slate-500">
                        {retryCount} tentative{retryCount > 1 ? "s" : ""} effectuée{retryCount > 1 ? "s" : ""} automatiquement
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <button
                      type="button"
                      onClick={closeModalAndResume}
                      className={`w-full py-3 rounded-2xl font-bold text-xs transition active:scale-95 shadow-md ${btnColor}`}
                    >
                      {isNoTrip ? "Sélectionner un Voyage" : isNetwork ? "Réessayer la Connexion" : "Reprendre le Scan"}
                    </button>

                    {/* Bouton saisie manuelle contextuel si QR illisible ou non trouvé */}
                    {(isNotFound || scanModal.subType === "GENERIC") && (
                      <button
                        type="button"
                        onClick={() => {
                          closeModalAndResume();
                          setTimeout(() => setIsManualInputOpen(true), 150);
                        }}
                        className="w-full py-2.5 rounded-2xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition active:scale-95 flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
                      >
                        <Keyboard className="w-3.5 h-3.5" />
                        Saisir la référence manuellement
                      </button>
                    )}
                  </div>
                </>
              );
            })()}
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

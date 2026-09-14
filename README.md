# Rahalat Bladna (رحلات بلادنا) 🐪🇲🇦
> **"Découvrez le Maroc autrement" (اكتشف المغرب بطريقة مختلفة)**

Plateforme SaaS B2B/B2C complète de gestion d'agences de voyages organisés, excursions et circuits touristiques réceptifs au Maroc.

---

## 🌟 Fonctionnalités Clés & Spécificités Marché Marocain

1. **Tunnel de Réservation Multi-Étapes :**
   - Sélection du nombre de places et du point de ramassage (ex: Casa-Voyageurs 05:30, Rabat-Agdal 06:45, Meknès-Ville).
   - Déclaration obligatoire des **CIN marocaines** (ex: `AB123456`) ou numéros de passeport.
   - Répartition par type de chambre (Double Twin, Double Matrimoniale, Triple, Single avec supplément).
   - Extras & Upselling (Quad au désert, balade dromadaires, shooting photo pro).
   - Paiement mixte : **Acompte (ex: 500 DH/pers)** ou **Paiement Intégral 100%**.
   - Modes de règlement : Carte bancaire marocaine & CMI, Stripe, ou **Virement Bancaire (CIH, Attijariwafa, Bank of Africa)** avec téléversement immédiat de la preuve/reçu.

2. **Module Réglementaire & Sécurité Routière (Gendarmerie Royale & DGSN) :**
   - Gestion des transporteurs touristiques agréés (**Série TIST**, immatriculation marocaine ex: `45210|A|6`, chauffeur professionnel avec permis de confiance / carte pro).
   - Export en 1 clic de la **Feuille de Route Officielle / Manifeste Passagers** au format PDF conforme aux réquisitions des barrages routiers.

3. **Accompagnateur Terrain (Tour Leader Mobile) :**
   - Émargement des passagers aux points de ramassage.
   - Journal de bord des dépenses de route (péages autoroutes ADM / Jawaz, carburant, imprévus).

4. **Tableau de Bord Financier & Rentabilité :**
   - Calcul automatique du **seuil de rentabilité (Point Mort)** et de la marge brute par circuit.

5. **Internationalisation & Support RTL :**
   - Français (FR - gestion par défaut).
   - Arabe (AR - `dir="rtl"`, typographie `Tajawal` / `Cairo`).
   - Anglais (EN).

---

## 🛠️ Stack Technique

* **Framework :** Next.js 14+ (App Router), React 18, TypeScript.
* **Styles & UI :** Tailwind CSS avec support RTL complet, Lucide React Icons.
* **Internationalisation :** `next-intl`.
* **ORM & Base de données :** Prisma ORM avec PostgreSQL (ou Supabase).
* **Génération PDF :** HTML to PDF conforme pour les feuilles de route réglementaires.
* **Intégrations :** WhatsApp Business API (Billet numérique & QR Code).

---

## 🚀 Installation & Démarrage

### 1. Cloner et installer les dépendances
```bash
npm install
```

### 2. Configuration des variables d'environnement
Copiez `.env.example` vers `.env` :
```bash
cp .env.example .env
```

### 3. Initialiser la Base de Données
```bash
# Générer le client Prisma
npm run prisma:generate

# Exécuter les migrations
npm run prisma:migrate

# Peupler la base avec les données marocaines (Merzouga, Akchour, Dakhla)
npm run prisma:seed
```

### 4. Lancer le serveur de développement
```bash
npm run dev
```
Ouvrez [http://localhost:3000](http://localhost:3000) dans votre navigateur.

---

## 📂 Arborescence du Projet

```
rihlat-bladna/
├── prisma/
│   ├── schema.prisma            # Modèle relationnel complet
│   └── seed.ts                  # Circuits marocains de démonstration
├── public/
│   └── locales/                 # Dictionnaires i18n (fr.json, ar.json, en.json)
├── src/
│   ├── app/
│   │   ├── [locale]/            # Next.js App Router i18n
│   │   │   ├── layout.tsx       # Root layout avec détection RTL & fonts
│   │   │   ├── page.tsx         # Page d'accueil B2C
│   │   │   ├── trips/           # Catalogue des voyages
│   │   │   │   └── [slug]/      # Détail circuit + BookingWizard
│   │   │   └── admin/
│   │   │       └── manifests/   # Feuille de route & Calcul de rentabilité
│   ├── components/
│   │   ├── booking/             # Wizard de réservation 4 étapes
│   │   ├── admin/               # Manifeste passagers & Analyse financière
│   │   └── shared/              # Header, LanguageSwitcher, Devise MAD
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── i18n.ts
│   │   ├── utils.ts
│   │   ├── pdf-generator.ts     # Template PDF officiel Gendarmerie/Police
│   │   └── whatsapp.ts          # API WhatsApp
│   ├── services/
│   │   └── financial.service.ts # Calcul du Point Mort
│   └── types/
│       └── index.ts             # Interfaces TypeScript
```

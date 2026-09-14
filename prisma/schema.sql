-- =============================================================================
-- RAHALAT BLADNA (رحلات بلادنا) — SCHÉMA SQL COMPLET POSTGRESQL (V5)
-- Plateforme Marocaine de Réservation de Circuits Touristiques & Escapades
-- =============================================================================

-- Extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. ENUMS (TYPES ÉNUMÉRÉS)
-- -----------------------------------------------------------------------------

CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',
    'AGENCY_ADMIN',
    'AGENCY_STAFF',
    'TOUR_LEADER',
    'CLIENT'
);

CREATE TYPE notification_type AS ENUM (
    'DEPARTURE_GUARANTEED',
    'PAYMENT_CONFIRMED',
    'NEW_TRIP_AVAILABLE',
    'TRIP_REMINDER',
    'ADMIN_ALERT'
);

CREATE TYPE trip_type AS ENUM (
    'WEEKEND_BREAK',
    'MULTI_DAY_TOUR',
    'DAY_TRIP',
    'TREKKING_HIKING',
    'SAHARA_SPECIAL'
);

CREATE TYPE departure_status AS ENUM (
    'DRAFT',
    'OPEN_FOR_BOOKING',
    'GUARANTEED',
    'ALMOST_FULL',
    'SOLD_OUT',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);

CREATE TYPE booking_status AS ENUM (
    'PENDING_PAYMENT',
    'CONFIRMED',
    'CHECKED_IN',
    'COMPLETED',
    'CANCELLED',
    'REFUNDED'
);

CREATE TYPE payment_status AS ENUM (
    'UNPAID',
    'DEPOSIT_PAID',
    'FULLY_PAID',
    'REFUNDED'
);

CREATE TYPE room_type AS ENUM (
    'DOUBLE_TWIN',
    'DOUBLE_MATRIMONIAL',
    'TRIPLE',
    'QUADRUPLE',
    'SINGLE'
);

CREATE TYPE payment_method AS ENUM (
    'CMI_CARD',
    'STRIPE_CARD',
    'BANK_TRANSFER',
    'CASH_AT_AGENCY',
    'CASH_AT_DEPARTURE',
    'WAFA_CASH_CASH_PLUS'
);

CREATE TYPE transaction_status AS ENUM (
    'PENDING_VALIDATION',
    'APPROVED',
    'REJECTED',
    'FAILED'
);

CREATE TYPE expense_category AS ENUM (
    'HIGHWAY_TOLL',
    'FUEL_DIESEL',
    'PARKING_GUARDING',
    'LOCAL_GUIDE_FEE',
    'MEAL_INCIDENTAL',
    'POLICE_FORMALITY',
    'EMERGENCY_REPAIR'
);

-- -----------------------------------------------------------------------------
-- 2. TABLES PRINCIPALES
-- -----------------------------------------------------------------------------

-- Table des Agences Partenaires (Multi-Tenant)
CREATE TABLE IF NOT EXISTS agencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    license_number VARCHAR(100), -- N° Agrément Ministère du Tourisme
    logo_url TEXT,
    phone VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100) DEFAULT 'Casablanca',
    ice_number VARCHAR(50), -- Identifiant Commun de l'Entreprise (ICE)
    rc_number VARCHAR(50), -- Registre de Commerce
    bank_accounts JSONB, -- RIBs CIH, Attijari, BOA
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des Utilisateurs
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    email_verified TIMESTAMP WITH TIME ZONE,
    image TEXT,
    password_hash VARCHAR(255), -- NULL pour les comptes Google OAuth
    full_name VARCHAR(255),
    phone VARCHAR(50) UNIQUE, -- NULL à l'inscription Google, complété au profil
    phone_number VARCHAR(50),
    cin_or_passport VARCHAR(50), -- Optionnel pour Google, complété au profil
    role user_role DEFAULT 'CLIENT',
    is_verified BOOLEAN DEFAULT FALSE,
    is_profile_complete BOOLEAN DEFAULT FALSE, -- Statut complétion téléphone & CIN
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tables NextAuth standard pour Google OAuth et sessions
CREATE TABLE IF NOT EXISTS accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at INTEGER,
    token_type VARCHAR(255),
    scope TEXT,
    id_token TEXT,
    session_state TEXT,
    CONSTRAINT uq_provider_account UNIQUE (provider, provider_account_id)
);

CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_token VARCHAR(255) UNIQUE NOT NULL,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL
);

CREATE TABLE IF NOT EXISTS verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- Table des Notifications Utilisateurs
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'DEPARTURE_GUARANTEED',
    is_read BOOLEAN DEFAULT FALSE,
    link_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des Tokens de Réinitialisation de Mot de Passe
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    is_used BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des Circuits Touristiques
CREATE TABLE IF NOT EXISTS trips (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    title_fr VARCHAR(255) NOT NULL,
    title_ar VARCHAR(255) NOT NULL,
    title_en VARCHAR(255),
    slug VARCHAR(255) UNIQUE NOT NULL,
    trip_type trip_type DEFAULT 'MULTI_DAY_TOUR',
    duration_days INTEGER DEFAULT 3,
    duration_nights INTEGER DEFAULT 2,
    destination_region VARCHAR(255) NOT NULL,
    departure_city VARCHAR(255) NOT NULL,
    short_description_fr TEXT NOT NULL,
    short_description_ar TEXT NOT NULL,
    long_description_fr TEXT NOT NULL,
    long_description_ar TEXT NOT NULL,
    included_services_fr TEXT[] DEFAULT '{}',
    included_services_ar TEXT[] DEFAULT '{}',
    excluded_services_fr TEXT[] DEFAULT '{}',
    excluded_services_ar TEXT[] DEFAULT '{}',
    checklist_items_fr TEXT[] DEFAULT '{}',
    checklist_items_ar TEXT[] DEFAULT '{}',
    cover_image_url TEXT NOT NULL,
    gallery_images TEXT[] DEFAULT '{}',
    is_featured BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Points de Ramassage des Passagers (Gare Casa-Voyageurs, Rabat-Agdal, etc.)
CREATE TABLE IF NOT EXISTS trip_pickup_points (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    city_name VARCHAR(100) NOT NULL,
    location_name_fr VARCHAR(255) NOT NULL,
    location_name_ar VARCHAR(255) NOT NULL,
    google_maps_url TEXT,
    departure_time VARCHAR(20) NOT NULL, -- Ex: '06:00'
    order_index INTEGER DEFAULT 0
);

-- Contrats de Transport Touristique (Conformité Série TIST)
CREATE TABLE IF NOT EXISTS transport_contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    transporter_name VARCHAR(255) NOT NULL,
    tist_registration_no VARCHAR(100) NOT NULL, -- N° Série TIST
    vehicle_type VARCHAR(100) NOT NULL, -- Ex: 'Autocar 48 places Mercedes Travego'
    license_plate VARCHAR(50) NOT NULL, -- Ex: '12345|A|6'
    driver_name VARCHAR(255) NOT NULL,
    driver_phone VARCHAR(50) NOT NULL,
    driver_card_number VARCHAR(100) NOT NULL, -- Permis de confiance
    cost_agreed NUMERIC(10, 2) NOT NULL,
    is_paid BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Dates de Départs Programmé & Tarification
CREATE TABLE IF NOT EXISTS departure_dates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_capacity INTEGER DEFAULT 48,
    min_seats_for_guaranteed INTEGER DEFAULT 15,
    base_price_double NUMERIC(10, 2) NOT NULL, -- Prix par pers. en chambre double
    price_triple NUMERIC(10, 2), -- Prix par pers. en chambre triple
    single_room_supplement NUMERIC(10, 2) DEFAULT 0, -- Supplément chambre individuelle
    deposit_amount NUMERIC(10, 2) DEFAULT 500.00, -- Acompte min requis
    status departure_status DEFAULT 'OPEN_FOR_BOOKING',
    tour_leader_id UUID REFERENCES users(id),
    transport_contract_id UUID REFERENCES transport_contracts(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Activités Optionnelles & Extras (Quad, 4x4, Photo Drone)
CREATE TABLE IF NOT EXISTS trip_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
    name_fr VARCHAR(255) NOT NULL,
    name_ar VARCHAR(255) NOT NULL,
    price NUMERIC(10, 2) NOT NULL,
    description_fr TEXT,
    description_ar TEXT,
    is_per_person BOOLEAN DEFAULT TRUE,
    is_active BOOLEAN DEFAULT TRUE
);

-- Réservations Voyageurs
CREATE TABLE IF NOT EXISTS bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_number VARCHAR(50) UNIQUE NOT NULL, -- Ex: 'RB-2026-08492'
    departure_date_id UUID NOT NULL REFERENCES departure_dates(id) ON DELETE RESTRICT,
    client_id UUID NOT NULL REFERENCES users(id),
    total_amount NUMERIC(10, 2) NOT NULL,
    paid_amount NUMERIC(10, 2) DEFAULT 0,
    remaining_balance NUMERIC(10, 2) NOT NULL,
    booking_status booking_status DEFAULT 'PENDING_PAYMENT',
    payment_status payment_status DEFAULT 'UNPAID',
    qr_code_token UUID UNIQUE DEFAULT uuid_generate_v4(),
    notes TEXT,
    special_requests TEXT,
    source VARCHAR(50) DEFAULT 'WEB',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Passagers Individuels (Déclaration Manifeste & Gendarmerie)
CREATE TABLE IF NOT EXISTS passengers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    cin_or_passport VARCHAR(50) NOT NULL,
    nationality VARCHAR(100) DEFAULT 'Marocaine',
    phone VARCHAR(50),
    birth_date DATE,
    gender VARCHAR(10) DEFAULT 'M',
    pickup_point_id UUID REFERENCES trip_pickup_points(id),
    room_type_preference room_type DEFAULT 'DOUBLE_TWIN',
    room_share_notes TEXT,
    is_checked_in BOOLEAN DEFAULT FALSE,
    checked_in_at TIMESTAMP WITH TIME ZONE,
    seat_number INTEGER,
    emergency_contact VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Extras Choisis dans une Réservation
CREATE TABLE IF NOT EXISTS booking_addons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    addon_id UUID NOT NULL REFERENCES trip_addons(id),
    quantity INTEGER DEFAULT 1,
    unit_price NUMERIC(10, 2) NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL
);

-- Transactions & Justificatifs de Paiement
CREATE TABLE IF NOT EXISTS payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    amount NUMERIC(10, 2) NOT NULL,
    payment_method payment_method NOT NULL,
    status transaction_status DEFAULT 'PENDING_VALIDATION',
    gateway_ref VARCHAR(255),
    receipt_image_url TEXT,
    bank_name VARCHAR(100),
    validated_by_id UUID REFERENCES users(id),
    validated_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Hôtels & Partenaires Hébergement
CREATE TABLE IF NOT EXISTS hotel_partners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agency_id UUID NOT NULL REFERENCES agencies(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(100) NOT NULL,
    category_stars INTEGER DEFAULT 4,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Allotements Hôteliers par Date de Départ
CREATE TABLE IF NOT EXISTS hotel_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    departure_date_id UUID NOT NULL REFERENCES departure_dates(id) ON DELETE CASCADE,
    hotel_id UUID NOT NULL REFERENCES hotel_partners(id),
    check_in_date DATE NOT NULL,
    check_out_date DATE NOT NULL,
    rooms_double_twin INTEGER DEFAULT 0,
    rooms_double_matrimonial INTEGER DEFAULT 0,
    rooms_triple INTEGER DEFAULT 0,
    rooms_single INTEGER DEFAULT 0,
    cost_per_night NUMERIC(10, 2) NOT NULL,
    confirmation_code VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Frais de Route Déclarés par les Guides
CREATE TABLE IF NOT EXISTS tour_leader_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    departure_date_id UUID NOT NULL REFERENCES departure_dates(id) ON DELETE CASCADE,
    tour_leader_id UUID NOT NULL REFERENCES users(id),
    category expense_category NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    receipt_photo_url TEXT,
    description TEXT NOT NULL,
    spent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_reimbursed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Table des Factures et Devis Officiels
CREATE TYPE invoice_type AS ENUM ('DEVIS', 'FACTURE', 'FACTURE_ACOMPTE', 'FACTURE_SOLDE');
CREATE TYPE invoice_status AS ENUM ('EMIS', 'PAYE', 'ANNULE', 'EN_ATTENTE');

CREATE TABLE IF NOT EXISTS invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type invoice_type DEFAULT 'FACTURE',
    status invoice_status DEFAULT 'EMIS',
    client_name VARCHAR(255) NOT NULL,
    client_cin VARCHAR(50),
    client_phone VARCHAR(50),
    client_email VARCHAR(255),
    client_company VARCHAR(255),
    client_address TEXT,
    trip_title VARCHAR(255),
    travel_dates VARCHAR(100),
    passenger_count INT DEFAULT 1,
    items JSONB,
    total_ht NUMERIC(10, 2) NOT NULL,
    tva_rate NUMERIC(5, 2) DEFAULT 20.00,
    tva_amount NUMERIC(10, 2) NOT NULL,
    total_ttc_mad NUMERIC(10, 2) NOT NULL,
    deposit_paid_mad NUMERIC(10, 2) DEFAULT 0,
    remaining_balance_mad NUMERIC(10, 2) DEFAULT 0,
    pdf_url TEXT,
    qr_code_url TEXT,
    notes TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    due_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 3. INDEX DE PERFORMANCE
-- -----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_phone ON users(phone);
CREATE INDEX IF NOT EXISTS idx_users_agency ON users(agency_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

CREATE INDEX IF NOT EXISTS idx_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_reset_tokens_token ON password_reset_tokens(token);

CREATE INDEX IF NOT EXISTS idx_trips_slug ON trips(slug);
CREATE INDEX IF NOT EXISTS idx_trips_agency ON trips(agency_id);
CREATE INDEX IF NOT EXISTS idx_trips_featured ON trips(is_featured);

CREATE INDEX IF NOT EXISTS idx_departure_dates_trip ON departure_dates(trip_id);
CREATE INDEX IF NOT EXISTS idx_departure_dates_start ON departure_dates(start_date);
CREATE INDEX IF NOT EXISTS idx_departure_dates_status ON departure_dates(status);

CREATE INDEX IF NOT EXISTS idx_bookings_number ON bookings(booking_number);
CREATE INDEX IF NOT EXISTS idx_bookings_client ON bookings(client_id);
CREATE INDEX IF NOT EXISTS idx_bookings_departure ON bookings(departure_date_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON bookings(booking_status);

CREATE INDEX IF NOT EXISTS idx_passengers_booking ON passengers(booking_id);
CREATE INDEX IF NOT EXISTS idx_passengers_cin ON passengers(cin_or_passport);

CREATE INDEX IF NOT EXISTS idx_payments_booking ON payment_transactions(booking_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payment_transactions(status);

-- -----------------------------------------------------------------------------
-- 4. TRIGGERS AUTOMATIQUES (Mise à jour updated_at)
-- -----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_users BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_agencies BEFORE UPDATE ON agencies FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_trips BEFORE UPDATE ON trips FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_departure_dates BEFORE UPDATE ON departure_dates FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_bookings BEFORE UPDATE ON bookings FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_passengers BEFORE UPDATE ON passengers FOR EACH ROW EXECUTE FUNCTION update_timestamp();
CREATE TRIGGER trg_update_payments BEFORE UPDATE ON payment_transactions FOR EACH ROW EXECUTE FUNCTION update_timestamp();

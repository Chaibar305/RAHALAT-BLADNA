import { ManifestTransportInfo, ManifestPassengerRow } from "@/types";

export function generateOfficialManifestHtml(
  info: ManifestTransportInfo,
  passengers: ManifestPassengerRow[]
): string {
  const currentDate = new Date().toLocaleDateString("fr-FR");

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>FEUILLE DE ROUTE OFFICIELLE - ${info.tripTitle}</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      margin: 20px;
      color: #111;
      font-size: 11px;
    }
    .header {
      border: 2px solid #000;
      padding: 12px;
      margin-bottom: 15px;
      background-color: #fcfcfc;
    }
    .header-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid #999;
      padding-bottom: 8px;
      margin-bottom: 8px;
    }
    .title {
      font-size: 16px;
      font-weight: bold;
      text-transform: uppercase;
      text-align: center;
      margin: 5px 0;
      letter-spacing: 0.5px;
    }
    .subtitle {
      text-align: center;
      font-size: 10px;
      font-weight: bold;
      color: #444;
      margin-bottom: 5px;
    }
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
      font-size: 11px;
    }
    .info-box {
      border: 1px solid #ccc;
      padding: 6px;
      background: #fafafa;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-top: 10px;
    }
    th, td {
      border: 1px solid #333;
      padding: 5px 6px;
      text-align: left;
    }
    th {
      background-color: #eee;
      font-size: 10px;
      text-transform: uppercase;
    }
    .text-center { text-align: center; }
    .font-bold { font-weight: bold; }
    .signatures {
      margin-top: 30px;
      display: flex;
      justify-content: space-between;
      page-break-inside: avoid;
    }
    .signature-box {
      border: 1px dashed #444;
      width: 30%;
      height: 80px;
      padding: 6px;
      text-align: center;
      font-weight: bold;
    }
    .legal-notice {
      margin-top: 15px;
      font-size: 9px;
      color: #555;
      text-align: justify;
      border-top: 1px dotted #888;
      padding-top: 5px;
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="header-top">
      <div>
        <strong>ROYAUME DU MAROC</strong><br/>
        Ministère du Tourisme & Ministère du Transport<br/>
        <strong>Transport Touristique (Série TIST)</strong>
      </div>
      <div style="text-align: right;">
        <strong>Agence :</strong> ${info.agencyName}<br/>
        <strong>N° Agrément :</strong> ${info.agencyLicense}<br/>
        <strong>Date d'émission :</strong> ${currentDate}
      </div>
    </div>

    <div class="title">FEUILLE DE ROUTE OFFICIELLE & MANIFESTE DES PASSAGERS</div>
    <div class="subtitle">Conforme aux réquisitions des postes de contrôle de la Gendarmerie Royale et de la Sûreté Nationale (DGSN)</div>

    <div class="info-grid">
      <div class="info-box">
        <strong>Circuit / Voyage :</strong> ${info.tripTitle}<br/>
        <strong>Date de départ :</strong> ${info.departureDate}<br/>
        <strong>Société de Transport :</strong> ${info.transporterName}
      </div>
      <div class="info-box">
        <strong>N° Autorisation TIST :</strong> ${info.tistNumber}<br/>
        <strong>Immatriculation Véhicule :</strong> ${info.plateNumber}<br/>
        <strong>Chauffeur :</strong> ${info.driverName} (Tél: ${info.driverPhone} | Carte Pro: ${info.driverCard})
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th class="text-center" style="width: 30px;">N°</th>
        <th>Nom et Prénom</th>
        <th class="text-center">N° CIN / Passeport</th>
        <th class="text-center">Nationalité</th>
        <th>Téléphone</th>
        <th>Point d'embarquement</th>
        <th class="text-center">Émargement / Présence</th>
      </tr>
    </thead>
    <tbody>
      ${passengers
        .map(
          (p, index) => `
      <tr>
        <td class="text-center font-bold">${index + 1}</td>
        <td class="font-bold">${p.fullName}</td>
        <td class="text-center font-bold" style="font-family: monospace;">${p.cinOrPassport}</td>
        <td class="text-center">${p.nationality}</td>
        <td>${p.phone}</td>
        <td>${p.pickupLocation}</td>
        <td class="text-center font-bold">
          ${p.isCheckedIn ? "[X] EMBARQUÉ" : "[ ] EN ATTENTE"}
        </td>
      </tr>
      `
        )
        .join("")}
    </tbody>
  </table>

  <div class="signatures">
    <div class="signature-box">
      Cachet de l'Agence Organisateur
    </div>
    <div class="signature-box">
      Signature du Tour Leader / Guide
    </div>
    <div class="signature-box">
      Signature du Conducteur Agréé
    </div>
  </div>

  <div class="legal-notice">
    Document officiel établi en application de la réglementation en vigueur régissant le transport touristique au Maroc. 
    Tout passager présent à bord doit obligatoirement figurer sur cette liste et être muni de sa pièce d'identité originale.
  </div>
</body>
</html>
  `;
}

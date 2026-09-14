import { NextResponse } from "next/server";
import { generatePassengerImportTemplate } from "@/lib/excel/excelService";

export async function GET() {
  try {
    const buffer = generatePassengerImportTemplate();
    const filename = "modele_import_voyageurs_rahalat_bladna.xlsx";

    return new NextResponse(buffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache",
      },
    });
  } catch (error: any) {
    console.error("Erreur génération modèle Excel:", error);
    return NextResponse.json(
      { error: "Impossible de générer le modèle Excel." },
      { status: 500 }
    );
  }
}

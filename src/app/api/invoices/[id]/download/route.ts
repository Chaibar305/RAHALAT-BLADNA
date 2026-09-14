import { NextRequest, NextResponse } from "next/server";
import { getInvoiceData } from "@/actions/invoice.actions";
import { generateInvoicePdfBuffer } from "@/lib/pdf/generateInvoice";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const documentId = params.id;
    const partnerQuery = req.nextUrl.searchParams.get("partner");
    const isPartner = partnerQuery !== null 
      ? partnerQuery === "true" 
      : documentId.startsWith("DEV");

    const pdfData = await getInvoiceData(documentId, isPartner);
    
    // Génération du Buffer PDF avec le nouveau moteur
    const pdfBuffer = await generateInvoicePdfBuffer(pdfData);

    const fileName = `${pdfData.documentNumber}.pdf`;

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Cache-Control": "public, max-age=3600, immutable",
      },
    });
  } catch (error: any) {
    console.error("PDF Download error:", error);
    return NextResponse.json(
      { error: "Impossible de générer le document PDF." },
      { status: 500 }
    );
  }
}

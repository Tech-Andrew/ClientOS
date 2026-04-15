import "https://esm.sh/@supabase/functions-js@2.4.2/src/edge-runtime.d.ts";
import { PDFDocument, rgb, StandardFonts } from "https://esm.sh/pdf-lib@1.17.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { invoiceNumber, amount, dueDate, clientName, clientCompany } = body;

    // Create a new PDFDocument
    const pdfDoc = await PDFDocument.create();

    // Add a blank page to the document
    const page = pdfDoc.addPage([600, 800]);

    // Get fonts
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const helveticaBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Styling constants
    const brandColor = rgb(0.18, 0.54, 1.0); // Vibrant blue #2F8BFF approx
    const textColor = rgb(0.2, 0.2, 0.2);

    // Draw Header
    page.drawText("Client OS", {
      x: 50,
      y: 730,
      size: 30,
      font: helveticaBold,
      color: brandColor,
    });

    page.drawText("INVOICE", {
      x: 430,
      y: 730,
      size: 24,
      font: helveticaBold,
      color: rgb(0.6, 0.6, 0.6),
    });

    // Separator line
    page.drawLine({
      start: { x: 50, y: 700 },
      end: { x: 550, y: 700 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    // Invoice Details
    page.drawText(`Invoice Number: ${invoiceNumber || "INV-0000"}`, { x: 50, y: 660, size: 12, font: helveticaBold, color: textColor });
    page.drawText(`Due Date: ${dueDate ? new Date(dueDate).toLocaleDateString() : "Upon Receipt"}`, { x: 50, y: 640, size: 12, font: helveticaFont, color: textColor });

    // Billed To
    page.drawText("Billed To:", { x: 50, y: 590, size: 14, font: helveticaBold, color: brandColor });
    page.drawText(clientName || "Valued Client", { x: 50, y: 570, size: 12, font: helveticaFont, color: textColor });
    if (clientCompany) {
      page.drawText(clientCompany, { x: 50, y: 550, size: 12, font: helveticaFont, color: textColor });
    }

    // Amount Block (simplified table)
    page.drawRectangle({
      x: 50,
      y: 450,
      width: 500,
      height: 40,
      color: rgb(0.95, 0.95, 0.95),
    });

    page.drawText("Description", { x: 70, y: 465, size: 12, font: helveticaBold, color: textColor });
    page.drawText("Total", { x: 480, y: 465, size: 12, font: helveticaBold, color: textColor });

    page.drawText("Services Rendered", { x: 70, y: 410, size: 12, font: helveticaFont, color: textColor });
    page.drawText(`$${amount ? amount.toFixed(2) : "0.00"}`, { x: 480, y: 410, size: 12, font: helveticaFont, color: textColor });

    // Separator before strict total
    page.drawLine({
      start: { x: 380, y: 380 },
      end: { x: 550, y: 380 },
      thickness: 1,
      color: rgb(0.8, 0.8, 0.8),
    });

    page.drawText("Total Due:", { x: 380, y: 350, size: 14, font: helveticaBold, color: brandColor });
    page.drawText(`$${amount ? amount.toFixed(2) : "0.00"}`, { x: 480, y: 350, size: 14, font: helveticaBold, color: brandColor });

    // Footer
    page.drawText("Thank you for your business!", {
      x: 50,
      y: 100,
      size: 12,
      font: helveticaFont,
      color: rgb(0.5, 0.5, 0.5),
    });

    // Serialize to Uint8Array
    const pdfBytes = await pdfDoc.save();

    return new Response(pdfBytes, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="invoice_${invoiceNumber || "standard"}.pdf"`,
      },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Unknown error occurred" }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});

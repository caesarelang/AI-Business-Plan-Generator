import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Aggressively strip everything that is not the JSON object
function extractJSON(raw) {
  // Remove ```json ... ``` or ``` ... ``` fences
  let text = raw.replace(/```(?:json)?[\s\S]*?```/g, (m) => {
    // keep only the content inside the fence
    return m.replace(/```(?:json)?/g, "").replace(/```/g, "");
  });
  // Find the first { and last } to isolate the object
  const start = text.indexOf("{");
  const end   = text.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  return text.slice(start, end + 1).trim();
}

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // --- FIX: resolve userId safely ---
    // NextAuth credentials provider puts id in token.sub or token.id
    // depending on how your auth.js callbacks are configured.
    // We look up the user by email as a safe fallback.
    let userId = session.user?.id;
    if (!userId) {
      const dbUser = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: { id: true },
      });
      if (!dbUser) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
      }
      userId = dbUser.id;
    }

    const { industry, capital, skills } = await req.json();
    if (!industry || !capital || !skills) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

    const prompt = `Kamu adalah konsultan bisnis profesional. Analisis dan buatkan business plan terstruktur.

Industri: ${industry}
Modal Awal: ${capital}
Keahlian Pemilik: ${skills}

PENTING: Balas HANYA dengan satu JSON object yang valid. Jangan tambahkan teks, penjelasan, atau markdown apapun di luar JSON. Mulai langsung dengan karakter "{" dan akhiri dengan "}".

Format JSON yang harus diikuti persis:
{"scores":{"market":75,"skill":80,"capital":60,"overall":72},"executiveSummary":{"idea":"deskripsi ide bisnis","tagline":"tagline bisnis","potential":"potensi bisnis","risk_level":"Sedang"},"marketAnalysis":{"target_segment":"deskripsi target","market_size":"estimasi ukuran pasar","competitors":["kompetitor1","kompetitor2","kompetitor3"],"differentiator":"keunggulan unik"},"strategyPlan":{"positioning":"strategi positioning","marketing_channels":["channel1","channel2","channel3"],"pricing_strategy":"strategi harga","usp":"unique selling proposition"},"financialPlan":{"initial_cost":"Rp X.XXX.XXX","monthly_cost":"Rp X.XXX.XXX","monthly_revenue":"Rp X.XXX.XXX","break_even_months":6,"roi_12months":"120%"},"actionPlan":{"day30":["aksi1","aksi2","aksi3","aksi4"],"day60":["aksi1","aksi2","aksi3"],"day90":["aksi1","aksi2","aksi3"]},"riskAnalysis":{"risks":[{"title":"nama risiko","level":"Sedang","mitigation":"cara mitigasi"},{"title":"nama risiko","level":"Rendah","mitigation":"cara mitigasi"},{"title":"nama risiko","level":"Tinggi","mitigation":"cara mitigasi"}]}}

Ganti semua nilai contoh dengan analisis nyata untuk bisnis: ${industry} dengan modal ${capital} dan keahlian ${skills}.`;

    const geminiResult = await model.generateContent(prompt);
    const rawText = geminiResult.response.text();

    console.log("[generate] raw response (first 300 chars):", rawText.substring(0, 300));

    // Extract & parse JSON
    const jsonStr = extractJSON(rawText);
    if (!jsonStr) {
      console.error("[generate] Could not find JSON in response:", rawText);
      return NextResponse.json(
        { error: "AI tidak mengembalikan format yang benar. Coba lagi." },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error("[generate] JSON parse error:", parseErr.message);
      console.error("[generate] Attempted to parse:", jsonStr.substring(0, 300));
      return NextResponse.json(
        { error: "Gagal memparse respons AI. Coba lagi." },
        { status: 500 }
      );
    }

    const {
      scores = {},
      executiveSummary = {},
      marketAnalysis = {},
      strategyPlan = {},
      financialPlan = {},
      actionPlan = {},
      riskAnalysis = {},
    } = parsed;

    const businessPlan = await prisma.businessPlan.create({
      data: {
        userId,
        industry,
        capital,
        skills,
        result: JSON.stringify(parsed),

        scoreMarket:   Number(scores.market)   || null,
        scoreSkill:    Number(scores.skill)    || null,
        scoreCapital:  Number(scores.capital)  || null,
        scoreOverall:  Number(scores.overall)  || null,

        executiveSummary: JSON.stringify(executiveSummary),
        marketAnalysis:   JSON.stringify(marketAnalysis),
        strategyPlan:     JSON.stringify(strategyPlan),
        financialPlan:    JSON.stringify(financialPlan),
        actionPlan:       JSON.stringify(actionPlan),
        riskAnalysis:     JSON.stringify(riskAnalysis),
      },
    });

    console.log("[generate] saved to DB, id:", businessPlan.id);

    return NextResponse.json({ ...businessPlan, parsed }, { status: 201 });

  } catch (error) {
    console.error("[generate] Unhandled error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
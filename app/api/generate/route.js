import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function POST(req) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { industry, capital, skills } = await req.json();

    if (!industry || !capital || !skills) {
      return NextResponse.json(
        { error: "Missing required fields (industry, capital, skills)" },
        { status: 400 }
      );
    }

    // Generate business plan using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const prompt = `Buatkan business plan profesional berdasarkan informasi berikut:

Industri: ${industry}
Modal Awal: ${capital}
Keahlian: ${skills}

Tolong buatkan business plan yang komprehensif dan siap implementasi. Format: markdown dengan heading, penjelasan, dan actionable items.`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // Save to database
    const businessPlan = await prisma.businessPlan.create({
      data: {
        userId: session.user.id,
        industry,
        capital,
        skills,
        result: text,
      },
    });

    return NextResponse.json(businessPlan, { status: 201 });
  } catch (error) {
    console.error("Generate error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

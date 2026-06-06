"use client";
import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

// ─── Helpers ────────────────────────────────────────────────────────────────

function safeJSON(str, fallback = {}) {
  if (!str) return fallback;
  if (typeof str === "object") return str;
  try { return JSON.parse(str); } catch { return fallback; }
}

function scoreColor(score) {
  if (score >= 75) return { bar: "#22c55e", text: "#15803d", bg: "#f0fdf4", border: "#bbf7d0" };
  if (score >= 50) return { bar: "#f59e0b", text: "#b45309", bg: "#fffbeb", border: "#fde68a" };
  return { bar: "#ef4444", text: "#b91c1c", bg: "#fef2f2", border: "#fecaca" };
}

function riskColor(level) {
  if (level === "Rendah") return { bg: "#f0fdf4", text: "#15803d", border: "#bbf7d0" };
  if (level === "Tinggi") return { bg: "#fef2f2", text: "#b91c1c", border: "#fecaca" };
  return { bg: "#fffbeb", text: "#b45309", border: "#fde68a" };
}

// ─── Score Ring ──────────────────────────────────────────────────────────────

function ScoreRing({ score, label, size = 80 }) {
  const c = scoreColor(score);
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#e5e7eb" strokeWidth={8} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={c.bar} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
        <text
          x={size / 2} y={size / 2 + 1}
          textAnchor="middle" dominantBaseline="middle"
          fill={c.text} fontSize={18} fontWeight={700}
          style={{ transform: `rotate(90deg)`, transformOrigin: `${size / 2}px ${size / 2}px` }}
        >
          {score}
        </text>
      </svg>
      <span style={{ fontSize: 12, color: "#6b7280", textAlign: "center", fontWeight: 500 }}>{label}</span>
    </div>
  );
}

// ─── Section Cards ───────────────────────────────────────────────────────────

const CARD_STYLE = {
  background: "#fff",
  borderRadius: 16,
  border: "1px solid #e5e7eb",
  padding: "1.5rem",
  marginBottom: "1rem",
};

function SectionHeader({ icon, title, color = "#4f46e5" }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "1.25rem" }}>
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: color + "18",
        display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 18,
      }}>
        {icon}
      </div>
      <h3 style={{ fontSize: 16, fontWeight: 700, color: "#111827", margin: 0 }}>{title}</h3>
    </div>
  );
}

function Pill({ text, color = "#4f46e5" }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "3px 12px",
      borderRadius: 999,
      background: color + "15",
      color,
      fontSize: 13,
      fontWeight: 500,
      margin: "3px 4px 3px 0",
    }}>
      {text}
    </span>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      padding: "10px 0", borderBottom: "1px solid #f3f4f6",
      gap: 12,
    }}>
      <span style={{ fontSize: 13, color: "#6b7280", flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 13, color: "#111827", fontWeight: 500, textAlign: "right" }}>{value}</span>
    </div>
  );
}

// ─── Stepper ─────────────────────────────────────────────────────────────────

const STEPS = [
  { key: "overview",  label: "Overview",   icon: "📋" },
  { key: "market",    label: "Pasar",      icon: "📊" },
  { key: "strategy",  label: "Strategi",   icon: "🎯" },
  { key: "finance",   label: "Keuangan",   icon: "💰" },
  { key: "action",    label: "Action Plan",icon: "🚀" },
  { key: "risk",      label: "Risiko",     icon: "⚠️"  },
];

function StepperNav({ current, onSelect }) {
  return (
    <div style={{
      display: "flex", overflowX: "auto", gap: 4,
      padding: "0 0 0.75rem",
      scrollbarWidth: "none",
    }}>
      {STEPS.map((s, i) => {
        const active = s.key === current;
        return (
          <button
            key={s.key}
            onClick={() => onSelect(s.key)}
            style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "7px 14px",
              borderRadius: 999,
              border: active ? "1.5px solid #4f46e5" : "1.5px solid #e5e7eb",
              background: active ? "#eef2ff" : "#fff",
              color: active ? "#4f46e5" : "#6b7280",
              fontWeight: active ? 700 : 500,
              fontSize: 13,
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s",
            }}
          >
            <span>{s.icon}</span>
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

// ─── Business Plan Display ────────────────────────────────────────────────────

function BusinessPlanView({ data }) {
  const [activeStep, setActiveStep] = useState("overview");

  const exec    = safeJSON(data.executiveSummary);
  const market  = safeJSON(data.marketAnalysis);
  const strategy = safeJSON(data.strategyPlan);
  const finance = safeJSON(data.financialPlan);
  const action  = safeJSON(data.actionPlan);
  const risk    = safeJSON(data.riskAnalysis);

  const scores = {
    market:  data.scoreMarket  ?? 0,
    skill:   data.scoreSkill   ?? 0,
    capital: data.scoreCapital ?? 0,
    overall: data.scoreOverall ?? 0,
  };

  // Fallback: try to parse from data.parsed if present
  const parsed = data.parsed || {};

  const resolvedExec     = exec?.idea     ? exec     : (parsed.executiveSummary ?? {});
  const resolvedMarket   = market?.target_segment ? market   : (parsed.marketAnalysis ?? {});
  const resolvedStrategy = strategy?.positioning ? strategy : (parsed.strategyPlan ?? {});
  const resolvedFinance  = finance?.initial_cost ? finance : (parsed.financialPlan ?? {});
  const resolvedAction   = action?.day30   ? action   : (parsed.actionPlan ?? {});
  const resolvedRisk     = risk?.risks     ? risk     : (parsed.riskAnalysis ?? {});
  const resolvedScores   = scores.overall ? scores : (parsed.scores ?? {});

  return (
    <div>
      {/* Score Cards */}
      <div style={{
        ...CARD_STYLE,
        background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
        border: "1.5px solid #c4b5fd",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.25rem", flexWrap: "wrap", gap: 12 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#3730a3", margin: 0 }}>
              {resolvedExec.tagline || data.industry}
            </h3>
            <p style={{ fontSize: 13, color: "#6d28d9", marginTop: 4, margin: "4px 0 0" }}>
              {data.industry} · {data.capital}
            </p>
          </div>
          <div style={{
            padding: "6px 16px",
            borderRadius: 999,
            background: scoreColor(resolvedScores.overall ?? 0).bg,
            border: `1px solid ${scoreColor(resolvedScores.overall ?? 0).border}`,
            color: scoreColor(resolvedScores.overall ?? 0).text,
            fontWeight: 700, fontSize: 14,
          }}>
            Skor {resolvedScores.overall ?? 0}/100
          </div>
        </div>

        <p style={{ fontSize: 14, color: "#4b5563", marginBottom: "1.5rem", lineHeight: 1.6 }}>
          {resolvedExec.idea}
        </p>

        <div style={{ display: "flex", justifyContent: "space-around", flexWrap: "wrap", gap: 16 }}>
          <ScoreRing score={resolvedScores.market  ?? 0} label="Potensi Pasar" />
          <ScoreRing score={resolvedScores.skill   ?? 0} label="Kesesuaian Skill" />
          <ScoreRing score={resolvedScores.capital ?? 0} label="Kecukupan Modal" />
        </div>

        <div style={{ display: "flex", gap: 16, marginTop: "1.25rem", justifyContent: "center", flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Level Risiko</div>
            <div style={{
              marginTop: 4, display: "inline-block",
              padding: "3px 14px", borderRadius: 999,
              ...riskColor(resolvedExec.risk_level),
              border: `1px solid ${riskColor(resolvedExec.risk_level).border}`,
              fontSize: 13, fontWeight: 700,
            }}>
              {resolvedExec.risk_level ?? "-"}
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Balik Modal</div>
            <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: "#1d4ed8" }}>
              {resolvedFinance.break_even_months ?? "-"} <span style={{ fontSize: 12, fontWeight: 500 }}>bulan</span>
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>ROI 12 Bulan</div>
            <div style={{ marginTop: 4, fontSize: 18, fontWeight: 800, color: "#059669" }}>
              {resolvedFinance.roi_12months ?? "-"}
            </div>
          </div>
        </div>
      </div>

      {/* Stepper tabs */}
      <StepperNav current={activeStep} onSelect={setActiveStep} />

      {/* Step Panels */}

      {activeStep === "overview" && (
        <div style={CARD_STYLE}>
          <SectionHeader icon="📋" title="Ringkasan Eksekutif" />
          <div style={{ fontSize: 14, color: "#374151", lineHeight: 1.7, marginBottom: "1.25rem" }}>
            {resolvedExec.potential}
          </div>
          <InfoRow label="Tagline" value={resolvedExec.tagline ?? "-"} />
          <InfoRow label="Level Risiko" value={resolvedExec.risk_level ?? "-"} />
          <InfoRow label="Industri" value={data.industry} />
          <InfoRow label="Modal" value={data.capital} />
          <InfoRow label="Keahlian" value={data.skills} />
        </div>
      )}

      {activeStep === "market" && (
        <div style={CARD_STYLE}>
          <SectionHeader icon="📊" title="Analisis Pasar" color="#0891b2" />
          <InfoRow label="Target Segmen" value={resolvedMarket.target_segment ?? "-"} />
          <InfoRow label="Ukuran Pasar" value={resolvedMarket.market_size ?? "-"} />
          <InfoRow label="Diferensiator" value={resolvedMarket.differentiator ?? "-"} />
          <div style={{ marginTop: "1.25rem" }}>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>KOMPETITOR</div>
            <div>
              {(resolvedMarket.competitors ?? []).map((c, i) => (
                <Pill key={i} text={c} color="#0891b2" />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeStep === "strategy" && (
        <div style={CARD_STYLE}>
          <SectionHeader icon="🎯" title="Rencana Strategi" color="#7c3aed" />
          <InfoRow label="Positioning" value={resolvedStrategy.positioning ?? "-"} />
          <InfoRow label="Strategi Harga" value={resolvedStrategy.pricing_strategy ?? "-"} />
          <InfoRow label="USP" value={resolvedStrategy.usp ?? "-"} />
          <div style={{ marginTop: "1.25rem" }}>
            <div style={{ fontSize: 12, color: "#6b7280", fontWeight: 600, marginBottom: 8 }}>CHANNEL MARKETING</div>
            <div>
              {(resolvedStrategy.marketing_channels ?? []).map((ch, i) => (
                <Pill key={i} text={ch} color="#7c3aed" />
              ))}
            </div>
          </div>
        </div>
      )}

      {activeStep === "finance" && (
        <div style={CARD_STYLE}>
          <SectionHeader icon="💰" title="Proyeksi Keuangan" color="#059669" />
          <div style={{
            display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
            gap: 12, marginBottom: "1.25rem",
          }}>
            {[
              { label: "Biaya Awal", value: resolvedFinance.initial_cost },
              { label: "Biaya Bulanan", value: resolvedFinance.monthly_cost },
              { label: "Pendapatan (Bln 3)", value: resolvedFinance.monthly_revenue },
              { label: "Balik Modal", value: `${resolvedFinance.break_even_months ?? "-"} bulan` },
              { label: "ROI 12 Bulan", value: resolvedFinance.roi_12months },
            ].map((item, i) => (
              <div key={i} style={{
                background: "#f0fdf4",
                borderRadius: 12,
                padding: "12px 14px",
                border: "1px solid #bbf7d0",
              }}>
                <div style={{ fontSize: 11, color: "#6b7280", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 15, fontWeight: 700, color: "#065f46", marginTop: 4 }}>
                  {item.value ?? "-"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeStep === "action" && (
        <div style={CARD_STYLE}>
          <SectionHeader icon="🚀" title="Action Plan" color="#dc2626" />
          {[
            { label: "30 Hari Pertama", items: resolvedAction.day30, color: "#dc2626", bg: "#fef2f2" },
            { label: "Hari 31–60", items: resolvedAction.day60, color: "#d97706", bg: "#fffbeb" },
            { label: "Hari 61–90", items: resolvedAction.day90, color: "#059669", bg: "#f0fdf4" },
          ].map((phase) => (
            <div key={phase.label} style={{ marginBottom: "1.25rem" }}>
              <div style={{
                display: "inline-block",
                padding: "3px 12px", borderRadius: 999,
                background: phase.bg, color: phase.color,
                fontSize: 12, fontWeight: 700, marginBottom: 10,
              }}>
                {phase.label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {(phase.items ?? []).map((item, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "flex-start", gap: 10,
                  }}>
                    <div style={{
                      width: 22, height: 22, borderRadius: 6,
                      background: phase.bg, border: `1.5px solid ${phase.color}30`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 11, fontWeight: 700, color: phase.color,
                      flexShrink: 0, marginTop: 1,
                    }}>
                      {i + 1}
                    </div>
                    <span style={{ fontSize: 14, color: "#374151", lineHeight: 1.5 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {activeStep === "risk" && (
        <div style={CARD_STYLE}>
          <SectionHeader icon="⚠️" title="Analisis Risiko" color="#d97706" />
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {(resolvedRisk.risks ?? []).map((r, i) => {
              const rc = riskColor(r.level);
              return (
                <div key={i} style={{
                  borderRadius: 12, border: `1px solid ${rc.border}`,
                  background: rc.bg, padding: "14px 16px",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>{r.title}</span>
                    <span style={{
                      fontSize: 11, fontWeight: 700, color: rc.text,
                      padding: "2px 10px", borderRadius: 999,
                      background: "#fff", border: `1px solid ${rc.border}`,
                    }}>
                      {r.level}
                    </span>
                  </div>
                  <p style={{ fontSize: 13, color: "#4b5563", margin: 0, lineHeight: 1.5 }}>
                    💡 {r.mitigation}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({ industry: "", capital: "", skills: "" });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Menganalisis bisnis...");
  const [history, setHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("generate"); // "generate" | "history"
  const resultRef = useRef(null);

  const LOADING_MSGS = [
    "Menganalisis potensi bisnis...",
    "Memetakan peluang pasar...",
    "Menyusun proyeksi keuangan...",
    "Merancang action plan...",
    "Hampir selesai...",
  ];

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") fetchHistory();
  }, [status]);

  useEffect(() => {
    if (!loading) return;
    let i = 0;
    const id = setInterval(() => {
      i = (i + 1) % LOADING_MSGS.length;
      setLoadingMsg(LOADING_MSGS[i]);
    }, 2500);
    return () => clearInterval(id);
  }, [loading]);

  const fetchHistory = async () => {
    const res = await fetch("/api/history");
    const data = await res.json();
    setHistory(Array.isArray(data) ? data : []);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    setLoadingMsg(LOADING_MSGS[0]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      setResult(data);
      fetchHistory();
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch {
      alert("Terjadi kesalahan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const loadFromHistory = (item) => {
    // Try to parse stored JSON result back to structured data
    let parsed = {};
    try { parsed = JSON.parse(item.result); } catch {}
    setResult({ ...item, parsed });
    setActiveTab("generate");
    setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  if (status === "loading") return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f9fafb" }}>
      <div style={{ fontSize: 14, color: "#6b7280" }}>Memuat...</div>
    </div>
  );

  return (
    <main style={{ minHeight: "100vh", background: "#f9fafb", fontFamily: "'Inter', -apple-system, sans-serif" }}>

      {/* Navbar */}
      <nav style={{
        background: "#4f46e5",
        padding: "0 1.5rem",
        height: 60,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        position: "sticky", top: 0, zIndex: 100,
        boxShadow: "0 2px 12px rgba(79,70,229,0.3)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: "rgba(255,255,255,0.2)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 16,
          }}>💼</div>
          <span style={{ color: "#fff", fontWeight: 700, fontSize: 15 }}>BizPlan AI</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ color: "rgba(255,255,255,0.75)", fontSize: 13 }}>{session?.user?.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            style={{
              background: "rgba(255,255,255,0.15)",
              color: "#fff", border: "1px solid rgba(255,255,255,0.3)",
              padding: "5px 14px", borderRadius: 8,
              fontSize: 13, fontWeight: 600, cursor: "pointer",
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div style={{ maxWidth: 720, margin: "0 auto", padding: "1.5rem 1rem 4rem" }}>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 4, marginBottom: "1.5rem", background: "#f3f4f6", borderRadius: 12, padding: 4 }}>
          {[
            { key: "generate", label: "Generate Plan" },
            { key: "history",  label: `History (${history.length})` },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                flex: 1, padding: "8px 0", borderRadius: 9,
                border: "none",
                background: activeTab === tab.key ? "#fff" : "transparent",
                color: activeTab === tab.key ? "#4f46e5" : "#6b7280",
                fontWeight: activeTab === tab.key ? 700 : 500,
                fontSize: 14, cursor: "pointer",
                boxShadow: activeTab === tab.key ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                transition: "all 0.2s",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Generate Tab */}
        {activeTab === "generate" && (
          <>
            {/* Form */}
            <div style={{ ...CARD_STYLE, marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "#3730a3", marginBottom: "1.25rem", margin: "0 0 1.25rem" }}>
                Buat Business Plan
              </h2>
              <form onSubmit={handleGenerate} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Industri / Jenis Bisnis
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: F&B, Tech Startup, Fashion Lokal, Jasa Fotografi"
                    required
                    value={form.industry}
                    onChange={(e) => setForm({ ...form, industry: e.target.value })}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 10,
                      border: "1.5px solid #e5e7eb", fontSize: 14, color: "#111827",
                      outline: "none", boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                    onFocus={e => e.target.style.borderColor = "#4f46e5"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Modal yang Dimiliki
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Rp 5.000.000"
                    required
                    value={form.capital}
                    onChange={(e) => setForm({ ...form, capital: e.target.value })}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 10,
                      border: "1.5px solid #e5e7eb", fontSize: 14, color: "#111827",
                      outline: "none", boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                    onFocus={e => e.target.style.borderColor = "#4f46e5"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: "#374151", display: "block", marginBottom: 6 }}>
                    Keahlian / Skill yang Dimiliki
                  </label>
                  <textarea
                    placeholder="Contoh: memasak, desain grafis, coding, public speaking"
                    required
                    rows={3}
                    value={form.skills}
                    onChange={(e) => setForm({ ...form, skills: e.target.value })}
                    style={{
                      width: "100%", padding: "10px 14px", borderRadius: 10,
                      border: "1.5px solid #e5e7eb", fontSize: 14, color: "#111827",
                      outline: "none", resize: "none", boxSizing: "border-box",
                      fontFamily: "inherit",
                    }}
                    onFocus={e => e.target.style.borderColor = "#4f46e5"}
                    onBlur={e => e.target.style.borderColor = "#e5e7eb"}
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  style={{
                    background: loading ? "#a5b4fc" : "#4f46e5",
                    color: "#fff", border: "none",
                    padding: "12px 0", borderRadius: 10,
                    fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer",
                    transition: "background 0.2s",
                  }}
                >
                  {loading ? "⏳ " + loadingMsg : "✨ Generate Business Plan"}
                </button>
              </form>
            </div>

            {/* Loading State */}
            {loading && (
              <div style={{
                ...CARD_STYLE,
                display: "flex", alignItems: "center", justifyContent: "center",
                flexDirection: "column", gap: 16, padding: "2.5rem",
                background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)",
                border: "1.5px solid #c4b5fd",
              }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 12,
                  background: "#4f46e5", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: 24,
                  animation: "pulse 2s infinite",
                }}>
                  🤖
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "#3730a3", marginBottom: 4 }}>
                    AI sedang menganalisis...
                  </div>
                  <div style={{ fontSize: 13, color: "#7c3aed" }}>{loadingMsg}</div>
                </div>
              </div>
            )}

            {/* Result */}
            {result && !loading && (
              <div ref={resultRef}>
                <div style={{
                  display: "flex", alignItems: "center", gap: 8,
                  marginBottom: "1rem",
                }}>
                  <div style={{ height: 2, flex: 1, background: "#e5e7eb" }} />
                  <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>HASIL ANALISIS</span>
                  <div style={{ height: 2, flex: 1, background: "#e5e7eb" }} />
                </div>
                <BusinessPlanView data={result} />
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <div>
            {history.length === 0 ? (
              <div style={{
                ...CARD_STYLE,
                textAlign: "center", padding: "3rem",
                color: "#9ca3af", fontSize: 14,
              }}>
                <div style={{ fontSize: 36, marginBottom: 12 }}>📂</div>
                Belum ada business plan yang dibuat.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {history.map((item) => {
                  const sc = scoreColor(item.scoreOverall ?? 0);
                  return (
                    <div
                      key={item.id}
                      onClick={() => loadFromHistory(item)}
                      style={{
                        ...CARD_STYLE,
                        cursor: "pointer",
                        display: "flex", alignItems: "center",
                        justifyContent: "space-between",
                        padding: "1rem 1.25rem",
                        marginBottom: 0,
                        transition: "box-shadow 0.2s, transform 0.1s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.boxShadow = "0 4px 16px rgba(79,70,229,0.12)";
                        e.currentTarget.style.transform = "translateY(-1px)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.boxShadow = "none";
                        e.currentTarget.style.transform = "none";
                      }}
                    >
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, color: "#111827", fontSize: 14 }}>{item.industry}</div>
                        <div style={{ fontSize: 12, color: "#6b7280", marginTop: 3 }}>
                          Modal: {item.capital} · {new Date(item.createdAt).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                        </div>
                      </div>
                      {item.scoreOverall != null && (
                        <div style={{
                          padding: "4px 12px", borderRadius: 999,
                          background: sc.bg, color: sc.text,
                          fontSize: 13, fontWeight: 700,
                          border: `1px solid ${sc.border}`,
                          marginLeft: 12, flexShrink: 0,
                        }}>
                          {item.scoreOverall}/100
                        </div>
                      )}
                      <div style={{ marginLeft: 12, color: "#9ca3af", fontSize: 16 }}>→</div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
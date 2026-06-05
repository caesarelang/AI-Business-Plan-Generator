"use client";
import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [form, setForm] = useState({ industry: "", capital: "", skills: "" });
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState([]);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") fetchHistory();
  }, [status]);

  const fetchHistory = async () => {
    const res = await fetch("/api/history");
    const data = await res.json();
    setHistory(data);
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult("");

    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();
    setLoading(false);
    setResult(data.result);
    fetchHistory();
  };

  if (status === "loading") return <p className="text-center mt-20">Loading...</p>;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <nav className="bg-indigo-600 text-white px-6 py-4 flex justify-between items-center">
        <h1 className="font-bold text-lg">AI Business Plan Generator</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm">{session?.user?.email}</span>
          <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="bg-white text-indigo-600 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto p-6 flex flex-col gap-8">
        {/* Form */}
        <div className="bg-white rounded-2xl shadow p-6">
          <h2 className="text-xl font-bold text-indigo-700 mb-4">Generate Business Plan</h2>
          <form onSubmit={handleGenerate} className="flex flex-col gap-4">
            <input
              type="text"
              placeholder="Industri (contoh: F&B, Tech, Fashion)"
              required
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              value={form.industry}
              onChange={(e) => setForm({ ...form, industry: e.target.value })}
            />
            <input
              type="text"
              placeholder="Modal yang dimiliki (contoh: Rp 5.000.000)"
              required
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent"
              value={form.capital}
              onChange={(e) => setForm({ ...form, capital: e.target.value })}
            />
            <textarea
              placeholder="Skill yang dimiliki (contoh: memasak, desain, coding)"
              required
              rows={3}
              className="border border-gray-300 rounded-lg px-4 py-2 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent resize-none"
              value={form.skills}
              onChange={(e) => setForm({ ...form, skills: e.target.value })}
            />
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white py-2 rounded-lg font-semibold hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? "Generating..." : "Generate Business Plan"}
            </button>
          </form>
        </div>

        {/* Result */}
        {result && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold text-indigo-700 mb-4">Hasil Business Plan</h2>
            <div className="prose prose-sm max-w-none text-gray-700">
              <ReactMarkdown
                components={{
                  h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-3 text-indigo-900" {...props} />,
                  h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-2 text-indigo-800" {...props} />,
                  h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2 text-indigo-700" {...props} />,
                  p: ({ node, ...props }) => <p className="mb-3 leading-relaxed" {...props} />,
                  ul: ({ node, ...props }) => <ul className="list-disc list-inside mb-3 space-y-1" {...props} />,
                  ol: ({ node, ...props }) => <ol className="list-decimal list-inside mb-3 space-y-1" {...props} />,
                  li: ({ node, ...props }) => <li className="mb-1" {...props} />,
                  blockquote: ({ node, ...props }) => <blockquote className="border-l-4 border-indigo-400 pl-4 py-2 my-3 italic bg-indigo-50" {...props} />,
                  table: ({ node, ...props }) => <table className="border-collapse border border-gray-300 w-full my-3" {...props} />,
                  td: ({ node, ...props }) => <td className="border border-gray-300 px-3 py-2" {...props} />,
                  th: ({ node, ...props }) => <th className="border border-gray-300 px-3 py-2 bg-gray-100 font-bold" {...props} />,
                  code: ({ node, inline, ...props }) => inline ? 
                    <code className="bg-gray-100 px-2 py-1 rounded text-red-600 font-mono text-sm" {...props} /> :
                    <code className="block bg-gray-900 text-gray-100 p-3 rounded-lg overflow-x-auto font-mono text-sm my-3" {...props} />,
                }}
              >
                {result}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold text-indigo-700 mb-4">History</h2>
            <div className="flex flex-col gap-4">
              {history.map((item) => (
                <div key={item.id} className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onClick={() => setResult(item.result)}>
                  <p className="font-semibold text-indigo-600">{item.industry}</p>
                  <p className="text-sm text-gray-500">Modal: {item.capital} · {new Date(item.createdAt).toLocaleDateString("id-ID")}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
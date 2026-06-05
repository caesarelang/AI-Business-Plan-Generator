import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-linier-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-indigo-900 mb-4">
          AI Business Plan Generator
        </h1>
        <p className="text-gray-800 text-lg mb-8">
          Buat business plan profesional dalam hitungan detik menggunakan kecerdasan buatan.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/register"
            className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
          >
            Mulai Gratis
          </Link>
          <Link
            href="/login"
            className="border border-indigo-600 text-indigo-600 px-6 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}
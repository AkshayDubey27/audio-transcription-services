import React, { useState, useEffect, useMemo } from "react";
import {
  postTranscription,
  getRecentTranscriptions,
  postAzureTranscription,
} from "../api";

interface Transcription {
  _id: string;
  audioUrl: string;
  transcription: string;
  language?: string;
  createdAt: string;
}

const TranscriptionForm: React.FC = () => {
  const [audioUrl, setAudioUrl] = useState("");
  const [transcriptions, setTranscriptions] = useState<Transcription[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
const [expanded, setExpanded] = useState<{ [key: string]: boolean }>({});

  // MANUAL RETRY SYSTEM
  const [retryCount, setRetryCount] = useState(0);
  const [isBlocked, setIsBlocked] = useState(false);
  const [blockTime, setBlockTime] = useState(180); // 3 min timer

  // NEW STATES
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // ---------------------------------
  // FETCH RECENT WITH RETRY (UNCHANGED)
  // ---------------------------------
  const fetchRecent = async (retries = 3, delay = 3000) => {
    try {
      const data = await getRecentTranscriptions();
      setTranscriptions(data);
    } catch (err) {
      if (retries > 0) {
        setTimeout(() => fetchRecent(retries - 1, delay), delay);
      } else {
        setError("Failed to load recent transcriptions after multiple attempts.");
      }
    }
  };

const toggleExpand = (id: string) => {
  setExpanded(prev => ({
    ...prev,
    [id]: !prev[id]
  }));
};

  useEffect(() => {
    fetchRecent();
  }, []);

  // ---------------------------------
  // FRONTEND VALIDATION
  // ---------------------------------
  const validateInput = () => {
    if (!audioUrl.trim()) {
      setError("Please enter an audio URL.");
      return false;
    }

    try {
      new URL(audioUrl);
    } catch {
      setError("Invalid URL format.");
      return false;
    }

    const allowed = [".mp3", ".wav", ".ogg", ".m4a"];
    if (!allowed.some(ext => audioUrl.toLowerCase().endsWith(ext))) {
      setError("Unsupported audio type. Allowed: mp3, wav, ogg, m4a");
      return false;
    }

    return true;
  };

  // ---------------------------------
  // MANUAL RETRY BLOCK TIMER
  // ---------------------------------
  useEffect(() => {
    if (!isBlocked) return;

    const timer = setInterval(() => {
      setBlockTime(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsBlocked(false);
          setRetryCount(0);
          return 180;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isBlocked]);

  // ---------------------------------
  // NORMAL TRANSCRIPTION WITH MANUAL RETRY
  // ---------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlocked) return;

    if (!validateInput()) return;

    setLoading(true);
    setProgress(0);
    const interval = setInterval(() =>
      setProgress((p) => Math.min(p + 10, 90)), 200);

    try {
      await postTranscription(audioUrl);
      setRetryCount(0); // reset on success
    } catch {
      setError("Transcription failed.");

      const newCount = retryCount + 1;
      setRetryCount(newCount);

      if (newCount >= 3) {
        setIsBlocked(true);
      }
    } finally {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setLoading(false), 300);
      setAudioUrl("");
      fetchRecent();
    }
  };

  // ---------------------------------
  // AZURE TRANSCRIPTION WITH MANUAL RETRY
  // ---------------------------------
  const handleAzureSubmit = async () => {
    if (isBlocked) return;
    if (!validateInput()) return;

    setLoading(true);
    setProgress(0);

    const interval = setInterval(() =>
      setProgress((p) => Math.min(p + 10, 90)), 200);

    try {
      await postAzureTranscription(audioUrl);
      setRetryCount(0);
    } catch {
      setError("Azure transcription failed.");

      const newCount = retryCount + 1;
      setRetryCount(newCount);

      if (newCount >= 3) {
        setIsBlocked(true);
      }
    } finally {
      clearInterval(interval);
      setProgress(100);
      setTimeout(() => setLoading(false), 300);
      setAudioUrl("");
      fetchRecent();
    }
  };

  // AUTO ERROR CLEAR
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  // ---------------------------------
  // SEARCH, SORT, PAGINATION (UNCHANGED)
  // ---------------------------------
  const filtered = useMemo(() => {
    return transcriptions.filter(
      (t) =>
        t.transcription.toLowerCase().includes(search.toLowerCase()) ||
        t.audioUrl.toLowerCase().includes(search.toLowerCase())
    );
  }, [transcriptions, search]);

  const sorted = useMemo(() => {
    const arr = [...filtered];

    switch (sort) {
      case "oldest":
        return arr.sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
      case "az":
        return arr.sort((a, b) => a.transcription.localeCompare(b.transcription));
      case "za":
        return arr.sort((a, b) => b.transcription.localeCompare(a.transcription));
      default:
        return arr.sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
    }
  }, [filtered, sort]);

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((page - 1) * pageSize, page * pageSize);

  const goToPage = (p: number) => {
    if (p >= 1 && p <= totalPages) setPage(p);
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center p-6">
      <h2 className="text-3xl font-bold mb-6 text-purple-700">🎤 Transcription App</h2>

      {isBlocked && (
        <p className="text-red-600 mb-4 font-semibold">
          ❌ Retry limit reached. Try again in  
          <b> {Math.floor(blockTime / 60)}:{("0" + (blockTime % 60)).slice(-2)}</b>
        </p>
      )}

      {error && (
        <div className="bg-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 w-full max-w-2xl">
          {error}
        </div>
      )}

      {/* ----------------- INPUT + BUTTONS ----------------- */}
      <form
        className="flex flex-col md:flex-row gap-4 mb-6 w-full max-w-2xl"
        onSubmit={handleSubmit}
      >
        <input
          type="text"
          placeholder="Enter audio URL"
          value={audioUrl}
          onChange={(e) => setAudioUrl(e.target.value)}
          className="flex-1 px-4 py-3 rounded-lg border border-gray-300"
        />

        <button
          type="submit"
          disabled={isBlocked}
          className="bg-purple-500 text-white px-6 py-3 rounded-lg disabled:opacity-50"
        >
          Transcribe
        </button>

        <button
          type="button"
          disabled={isBlocked}
          onClick={handleAzureSubmit}
          className="bg-blue-500 text-white px-6 py-3 rounded-lg disabled:opacity-50"
        >
          Azure Transcribe
        </button>
      </form>

      {/* ----------------- PROGRESS BAR ----------------- */}
      {loading && (
        <div className="w-full max-w-2xl mb-6">
          <div className="bg-gray-300 h-3 rounded-full">
            <div
              className="h-3 bg-purple-500 rounded-full"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <p className="text-center mt-2">Processing...</p>
        </div>
      )}

      {/* ----------------- SEARCH + SORT ----------------- */}
      <div className="flex flex-col md:flex-row justify-between w-full max-w-2xl mb-4 gap-4">
        <input
          type="text"
          placeholder="Search transcription or URL…"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 border rounded-lg flex-1"
        />

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="az">A → Z</option>
          <option value="za">Z → A</option>
        </select>
      </div>

      {/* ----------------- RECENT TRANSCRIPTIONS ----------------- */}
      <h3 className="text-xl font-semibold mb-4">Recent Transcriptions</h3>

      <div className="grid gap-4 w-full max-w-2xl">
        {paginated.map((t) => (
          <div key={t._id} className="bg-white rounded-xl shadow-md p-4">
            <p className="text-gray-500 text-sm">
              {new Date(t.createdAt).toLocaleString()}
            </p>
            <p className="font-medium">{t.audioUrl}</p>
            <div className="mt-2">
  <p className="whitespace-pre-wrap">
    {expanded[t._id]
      ? t.transcription
      : t.transcription.length > 150
        ? t.transcription.slice(0, 150) + "..."
        : t.transcription}
  </p>

  {/* Read More / Read Less button */}
  {t.transcription.length > 150 && (
    <button
      onClick={() => toggleExpand(t._id)}
      className="text-blue-600 underline text-sm mt-1"
    >
      {expanded[t._id] ? "Read less" : "Read more"}
    </button>
  )}
</div>

            <span className="inline-block mt-2 text-xs bg-purple-100 px-2 py-1 rounded-full">
              {t.language || "en-US"}
            </span>
          </div>
        ))}
      </div>

      {/* ----------------- PAGINATION ----------------- */}
      {totalPages > 1 && (
        <div className="flex items-center gap-2 mt-6">
          <button
            onClick={() => goToPage(page - 1)}
            className="px-3 py-1 bg-gray-300 rounded"
            disabled={page === 1}
          >
            Prev
          </button>

          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i + 1)}
              className={`px-3 py-1 rounded ${
                page === i + 1 ? "bg-purple-500 text-white" : "bg-gray-200"
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => goToPage(page + 1)}
            className="px-3 py-1 bg-gray-300 rounded"
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default TranscriptionForm;

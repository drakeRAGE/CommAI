import React, { useState, useRef } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function SpeakingPractice() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [sessionHistory, setSessionHistory] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [timer, setTimer] = useState(0);
  const recognitionRef = useRef(null);
  const timerRef = useRef(null);

  const fillerWords = ["uh", "um", "like", "you know", "actually", "basically", "literally"];

  const startRecording = () => {
    if (!("webkitSpeechRecognition" in window)) {
      alert("Speech recognition not supported in this browser.");
      return;
    }

    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        text += event.results[i][0].transcript;
      }
      setTranscript(text);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);

    // Start timer
    setTimer(0);
    timerRef.current = setInterval(() => {
      setTimer((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const newSuggestions = generateSuggestions(transcript, timer);
    setSuggestions(newSuggestions.feedback);

    setSessionHistory((prev) => [
      {
        text: transcript,
        duration: timer,
        feedback: newSuggestions.feedback,
        score: newSuggestions.score,
        fillerStats: newSuggestions.fillerStats,
      },
      ...prev,
    ]);

    setIsRecording(false);
  };

  const generateSuggestions = (text, duration) => {
    let feedback = [];
    let score = 10;

    // --- FILLER WORD DETECTION ---
    let fillerStats = {};
    fillerWords.forEach((word) => {
      const regex = new RegExp(`\\b${word}\\b`, "gi");
      const count = (text.match(regex) || []).length;
      if (count > 0) {
        fillerStats[word] = count;
        feedback.push(`⚠️ You used "${word}" ${count} time(s). Try reducing it.`);
        score -= count >= 3 ? 2 : 1;
      }
    });

    // --- SHORT SPEECH CHECK ---
    if (text.split(" ").length < 15) {
      feedback.push("🗣️ Try speaking in longer sentences with more details.");
      score -= 2;
    }

    // --- SENTENCE STRUCTURE CHECK ---
    if (!/[.?!]/.test(text)) {
      feedback.push("✍️ Work on finishing sentences with proper endings.");
      score -= 1;
    }

    // --- VOCABULARY TIP ---
    if (text.includes("good")) {
      feedback.push("💡 Instead of 'good', try 'excellent', 'fantastic', or 'wonderful'.");
    }

    // --- DURATION ENCOURAGEMENT ---
    if (duration < 30) {
      feedback.push("⏱️ Try to speak for at least 1 minute for better practice.");
      score -= 1;
    }

    if (feedback.length === 0) {
      feedback.push("✅ Great job! Fluent and clear.");
    }

    if (score < 0) score = 0;
    return { feedback, score, fillerStats };
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 flex justify-center items-center p-6">
      <div className="bg-white shadow-2xl rounded-2xl w-full max-w-4xl p-8">
        {/* Title */}
        <h1 className="text-3xl font-bold text-center text-indigo-600 mb-6">
          🎙️ COMM AI - AI Speaking Practice
        </h1>

        {/* Live Timer */}
        {isRecording && (
          <div className="text-center text-lg font-semibold text-red-500 mb-4">
            ⏱️ Recording... {timer}s
          </div>
        )}

        {/* Transcript Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">
            Live Transcript
          </h2>
          <div className="bg-gray-100 p-4 rounded-lg h-32 overflow-y-auto border border-gray-200">
            {transcript || (
              <span className="text-gray-400">Your speech will appear here...</span>
            )}
          </div>
        </div>

        {/* Recording Controls */}
        <div className="flex justify-center mb-6">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="px-6 py-3 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-full shadow-lg transition"
            >
              ▶️ Start Recording
            </button>
          ) : (
            <button
              onClick={stopRecording}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full shadow-lg transition"
            >
              ⏹️ Stop Recording
            </button>
          )}
        </div>

        {/* Suggestions Section */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">
            💡 Suggestions
          </h2>
          <ul className="list-disc pl-6 space-y-1">
            {suggestions.map((s, idx) => (
              <li key={idx} className="text-gray-800">
                {s}
              </li>
            ))}
          </ul>
        </div>

        {/* Session History */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2 text-gray-700">
            📜 Session History
          </h2>
          <div className="space-y-3 max-h-40 overflow-y-auto">
            {sessionHistory.length === 0 && (
              <p className="text-gray-400">No past sessions yet.</p>
            )}
            {sessionHistory.map((session, idx) => (
              <div
                key={idx}
                className="p-3 bg-gray-50 border rounded-lg shadow-sm"
              >
                <p className="font-medium text-gray-800">{session.text}</p>
                <p className="text-sm text-gray-600">⏱️ Duration: {session.duration}s</p>
                <p className="text-sm text-gray-600">⭐ Fluency Score: {session.score}/10</p>
                {session.fillerStats && Object.keys(session.fillerStats).length > 0 && (
                  <div className="mt-2 text-sm text-gray-700">
                    <strong>Filler Words:</strong>{" "}
                    {Object.entries(session.fillerStats).map(([word, count], i) => (
                      <span key={i} className="mr-2">
                        {word} ({count})
                      </span>
                    ))}
                  </div>
                )}
                <ul className="list-disc pl-5 text-sm text-gray-600 mt-1">
                  {session.feedback.map((f, i) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Chart Section */}
        {sessionHistory.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2 text-gray-700 text-center">
              📊 Fluency Progress
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={sessionHistory.map((s, i) => ({
                  id: sessionHistory.length - i,
                  score: s.score,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="id"
                  label={{ value: "Session", position: "insideBottom", offset: -5 }}
                />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#4f46e5"
                  strokeWidth={3}
                  dot={{ r: 5 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

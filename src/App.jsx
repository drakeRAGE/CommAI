import React, { useState, useRef } from "react";

export default function PracticeDemoPro() {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [history, setHistory] = useState([]);
  const recognitionRef = useRef(null);

  // Initialize Speech Recognition
  const initRecognition = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser does not support Speech Recognition.");
      return null;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = true;

    recognition.onresult = (event) => {
      let text = "";
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        text += event.results[i][0].transcript + " ";
      }
      setTranscript(text.trim());
    };

    recognition.onerror = (err) => {
      console.error("Recognition error:", err);
      setIsRecording(false);
    };

    return recognition;
  };

  // Start/Stop recording
  const toggleRecording = () => {
    if (!isRecording) {
      recognitionRef.current = initRecognition();
      if (recognitionRef.current) {
        recognitionRef.current.start();
        setIsRecording(true);
      }
    } else {
      recognitionRef.current.stop();
      setIsRecording(false);
    }
  };

  // Analyze transcript: filler words, vocabulary, fluency
  const analyzeTranscript = async () => {
    if (!transcript) return;

    let fillerWords = ["uh", "um", "like", "you know", "actually"];
    let fillerCount = 0;
    let words = transcript.split(/\s+/);

    words.forEach((w) => {
      if (fillerWords.includes(w.toLowerCase())) fillerCount++;
    });

    // Vocabulary suggestions (repeated words)
    let wordFrequency = {};
    words.forEach((w) => {
      let lw = w.toLowerCase();
      wordFrequency[lw] = (wordFrequency[lw] || 0) + 1;
    });

    let repeatedWords = Object.entries(wordFrequency)
      .filter(([w, count]) => count > 3 && w.length > 3)
      .map(([w]) => w);

    // Grammar check (LanguageTool API, optional)
    let grammarSuggestions = [];
    try {
      let res = await fetch("https://api.languagetool.org/v2/check", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          text: transcript,
          language: "en-US",
        }),
      });
      let data = await res.json();
      grammarSuggestions = data.matches.map((m) => ({
        error: transcript.substring(m.offset, m.offset + m.length),
        suggestion: m.replacements[0]?.value || "—",
        message: m.message,
      }));
    } catch (err) {
      console.log("Grammar API failed, skipping...");
    }

    // Fluency score (basic heuristic)
    let fluencyScore = 10;
    if (fillerCount > 5) fluencyScore -= 2;
    if (words.length < 10) fluencyScore -= 2;
    if (repeatedWords.length > 0) fluencyScore -= 1;
    if (fluencyScore < 0) fluencyScore = 0;

    // Tone detection (very basic)
    let tone =
      fillerCount > words.length * 0.1
        ? "Hesitant"
        : words.length > 15
          ? "Confident"
          : "Neutral";

    const report = {
      fillerCount,
      repeatedWords,
      grammarSuggestions,
      fluencyScore,
      tone,
    };

    setFeedback(report);

    // Save session in memory
    setHistory([
      ...history,
      {
        text: transcript,
        feedback: report,
        time: new Date().toLocaleTimeString(),
      },
    ]);

    setTranscript("");
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-xl">
      <h2 className="text-2xl font-bold mb-4">🎙 AI Practice Demo Pro</h2>

      {/* Recording Section */}
      <div className="mb-4">
        <button
          onClick={toggleRecording}
          className={`px-4 py-2 rounded-lg font-semibold ${isRecording ? "bg-red-500 text-white" : "bg-green-500 text-white"
            }`}
        >
          {isRecording ? "Stop Recording" : "Start Recording"}
        </button>
      </div>

      {/* Transcript */}
      <div className="mb-4">
        <h3 className="font-semibold">Transcript:</h3>
        <p className="p-2 border rounded bg-gray-50 min-h-[50px]">
          {transcript || "Speak something..."}
        </p>
      </div>

      {/* Analyze Button */}
      <div className="mb-4">
        <button
          onClick={analyzeTranscript}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          disabled={!transcript}
        >
          Analyze & Get Feedback
        </button>
      </div>

      {/* Feedback Section */}
      {feedback && (
        <div className="p-4 border rounded bg-yellow-50 mb-6">
          <h3 className="font-semibold text-lg">📊 Feedback Report</h3>
          <p>📝 Fluency Score: <strong>{feedback.fluencyScore}/10</strong></p>
          <p>🎤 Tone Detected: <strong>{feedback.tone}</strong></p>
          <p>⏳ Filler Words Used: <strong>{feedback.fillerCount}</strong></p>
          {feedback.repeatedWords.length > 0 && (
            <p>
              🔁 Repeated Words: {feedback.repeatedWords.join(", ")}
            </p>
          )}
          {feedback.grammarSuggestions.length > 0 && (
            <div className="mt-2">
              <h4 className="font-semibold">Grammar Suggestions:</h4>
              <ul className="list-disc pl-5">
                {feedback.grammarSuggestions.map((g, idx) => (
                  <li key={idx}>
                    ❌ <em>{g.error}</em> → ✅ {g.suggestion} ({g.message})
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* History Section */}
      <div>
        <h3 className="font-semibold mb-2">🕒 Session History:</h3>
        {history.length === 0 ? (
          <p className="text-gray-500">No past sessions yet.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((h, idx) => (
              <li key={idx} className="p-3 border rounded bg-gray-100 text-sm">
                <p className="font-medium">Session at {h.time}</p>
                <p><strong>Transcript:</strong> {h.text}</p>
                <p><strong>Score:</strong> {h.feedback.fluencyScore}/10</p>
                <p><strong>Tone:</strong> {h.feedback.tone}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

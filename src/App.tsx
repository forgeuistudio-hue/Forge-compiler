import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ForgeOrchestrator } from "./forge/orchestrator";
import { ForgeRenderer } from "./forge/renderer";
import { ForgeExporter, ForgeProjectFiles } from "./forge/exporter";
import { ForgeGraph } from "./forge/types";
import { ForgeTestRunner, TestResult } from "./forge/tests/runner";
import { GOLDEN_TEST_SUITE } from "./forge/tests/golden";
import { Sparkles, Send, Loader2, AlertCircle, Code, Download, FileCode, ChevronRight, Play, CheckCircle2, XCircle, Clipboard } from "lucide-react";
import JSZip from "jszip";

export default function App() {
  const [description, setDescription] = useState("");
  const [graph, setGraph] = useState<ForgeGraph | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"preview" | "code" | "dsl" | "tests">("preview");
  const [history, setHistory] = useState<{ role: "user" | "model", content: string }[]>([]);
  const [exportedFiles, setExportedFiles] = useState<ForgeProjectFiles | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  
  // Test State
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const orchestrator = new ForgeOrchestrator(process.env.GEMINI_API_KEY || "");
  const exporter = new ForgeExporter();
  const testRunner = new ForgeTestRunner(process.env.GEMINI_API_KEY || "");

  const handleGenerate = async () => {
    if (!description.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      const result = await orchestrator.generate(description, history);
      setGraph(result.graph);
      
      // Update history for next iteration
      setHistory(prev => [
        ...prev,
        { role: "user", content: description },
        { role: "model", content: JSON.stringify(result.graph) }
      ]);
      
      const files = exporter.export(result.graph);
      setExportedFiles(files);
      setSelectedFile(Object.keys(files)[0]);
      setDescription(""); // Clear for next iteration
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const runTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    try {
      const results = await testRunner.runSuite(GOLDEN_TEST_SUITE);
      setTestResults(results);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Test suite failed");
    } finally {
      setIsTesting(false);
    }
  };

  const downloadZip = async () => {
    if (!exportedFiles) return;
    const zip = new JSZip();
    Object.entries(exportedFiles).forEach(([path, content]) => {
      zip.file(path, content as string);
    });
    const blob = await zip.generateAsync({ type: "blob" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "forge-project.zip";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-500/30">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-xl font-bold tracking-tight">Forge <span className="text-blue-500">Design-to-Code</span></h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center bg-slate-800 rounded-lg p-1">
              <button 
                onClick={() => setActiveTab("preview")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "preview" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
              >
                Preview
              </button>
              <button 
                onClick={() => setActiveTab("code")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "code" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
              >
                Code
              </button>
              <button 
                onClick={() => setActiveTab("dsl")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "dsl" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
              >
                DSL
              </button>
              <button 
                onClick={() => setActiveTab("tests")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeTab === "tests" ? "bg-slate-700 text-white shadow-sm" : "text-slate-400 hover:text-slate-200"}`}
              >
                Tests
              </button>
            </div>
            {exportedFiles && (
              <button 
                onClick={downloadZip}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 transition-all text-sm font-bold shadow-lg shadow-blue-600/20"
              >
                <Download className="w-4 h-4" />
                Download ZIP
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Section */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-500" />
              Describe your UI
            </h2>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., A modern login card with a blue gradient background, a white card with rounded corners, and a primary button."
              className="w-full h-40 bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none placeholder:text-slate-600"
            />
            <button
              onClick={handleGenerate}
              disabled={isLoading || !description.trim()}
              className="w-full mt-4 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-500 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Generate UI
                </>
              )}
            </button>
          </div>

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex gap-3 text-red-400 text-sm"
            >
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </motion.div>
          )}

          <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-4">Capabilities</h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Deterministic Flexbox Layout
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Standalone Code Export (Vite + Tailwind)
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Golden Test Suite & Regression Runner
              </li>
              <li className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                Real-time Validation & Retry
              </li>
            </ul>
          </div>
        </div>

        {/* Preview Section */}
        <div className="lg:col-span-8">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl h-[600px] overflow-hidden flex flex-col shadow-2xl">
            <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/80 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-500/50" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/50" />
                  <div className="w-3 h-3 rounded-full bg-green-500/50" />
                </div>
                <span className="ml-4 text-xs font-medium text-slate-500 uppercase tracking-widest">
                  {activeTab === "preview" ? "Preview Engine" : activeTab === "code" ? "Source Code" : "Regression Suite"}
                </span>
              </div>
              {activeTab === "tests" && (
                <button 
                  onClick={runTests}
                  disabled={isTesting}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-md bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-xs font-bold transition-all"
                >
                  {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                  Run Golden Suite
                </button>
              )}
            </div>
            
            <div className="flex-1 relative overflow-hidden bg-slate-950">
              <AnimatePresence mode="wait">
                {activeTab === "dsl" ? (
                  <motion.div
                    key="dsl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full overflow-auto p-6 font-mono text-xs leading-relaxed text-slate-300"
                  >
                    <pre>{graph ? JSON.stringify(graph, null, 2) : "No DSL generated yet"}</pre>
                  </motion.div>
                ) : activeTab === "tests" ? (
                  <motion.div
                    key="tests"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="h-full overflow-y-auto p-6 space-y-4"
                  >
                    {testResults.length === 0 && !isTesting && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                        <Play className="w-12 h-12" />
                        <p className="text-sm">Run the Golden Suite to verify system stability</p>
                      </div>
                    )}
                    {isTesting && testResults.length === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                        <Loader2 className="w-12 h-12 animate-spin" />
                        <p className="text-sm">Executing pipeline for {GOLDEN_TEST_SUITE.length} test cases...</p>
                      </div>
                    )}
                    {testResults.map((result, idx) => (
                      <div key={idx} className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            {result.status === "pass" ? (
                              <CheckCircle2 className="w-5 h-5 text-green-500" />
                            ) : result.status === "fail" ? (
                              <XCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <AlertCircle className="w-5 h-5 text-yellow-500" />
                            )}
                            <h3 className="font-semibold text-sm">{result.name}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            {result.jsx && (
                              <button 
                                onClick={() => navigator.clipboard.writeText(result.jsx!)}
                                className="p-1.5 hover:bg-slate-800 rounded-md text-slate-400 transition-colors"
                                title="Copy JSX Snapshot"
                              >
                                <Clipboard className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                        {result.message && (
                          <p className={`text-xs ${result.status === "fail" ? "text-red-400" : "text-slate-400"}`}>
                            {result.message}
                          </p>
                        )}
                        {result.diffs && (
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 uppercase font-bold">Expected</span>
                              <pre className="text-[10px] bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto max-h-32">
                                {result.diffs.expected}
                              </pre>
                            </div>
                            <div className="space-y-1">
                              <span className="text-[10px] text-slate-500 uppercase font-bold">Actual</span>
                              <pre className="text-[10px] bg-slate-950 p-2 rounded border border-slate-800 overflow-x-auto max-h-32">
                                {result.diffs.actual}
                              </pre>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </motion.div>
                ) : graph ? (
                  activeTab === "code" && exportedFiles ? (
                    <motion.div
                      key="code"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex h-full"
                    >
                      {/* File Sidebar */}
                      <div className="w-64 border-r border-slate-800 bg-slate-900/30 overflow-y-auto">
                        {Object.keys(exportedFiles).map((path) => (
                          <button
                            key={path}
                            onClick={() => setSelectedFile(path)}
                            className={`w-full flex items-center gap-2 px-4 py-2.5 text-xs text-left transition-colors ${selectedFile === path ? "bg-blue-600/10 text-blue-400 border-r-2 border-blue-600" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"}`}
                          >
                            <FileCode className="w-4 h-4 shrink-0" />
                            <span className="truncate">{path}</span>
                          </button>
                        ))}
                      </div>
                      {/* Code Editor */}
                      <div className="flex-1 overflow-auto p-6 font-mono text-xs leading-relaxed text-slate-300">
                        <pre>
                          {selectedFile ? exportedFiles[selectedFile] : "Select a file to view code"}
                        </pre>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="ui"
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="h-full"
                    >
                      <ForgeRenderer graph={graph} />
                    </motion.div>
                  )
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                    <div className="w-16 h-16 rounded-full border-2 border-dashed border-slate-800 flex items-center justify-center">
                      <Code className="w-8 h-8" />
                    </div>
                    <p className="text-sm">Your generated UI will appear here</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}



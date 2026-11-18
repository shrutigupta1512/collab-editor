import { useEffect, useRef, useState } from "react";
import Editor from "@monaco-editor/react";

export default function App() {
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// start coding");
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8080");
    wsRef.current = ws;
    ws.onmessage = (e) => setCode(e.data);
    return () => ws.close();
  }, []);

  const handleChange = (value: string | undefined) => {
    const text = value ?? "";
    setCode(text);
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(text);
    }
  };

  return (
    <div>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="cpp">C++</option>
      </select>

      <Editor
        height="90vh"
        language={language}
        value={code}
        theme="vs-dark"
        onChange={handleChange}
      />
    </div>
  );
}
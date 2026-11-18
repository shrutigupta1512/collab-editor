import { useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

export default function App() {
  const [language, setLanguage] = useState("javascript");
  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);

  const handleMount: OnMount = (editor) => {
    bindingRef.current?.destroy();
    providerRef.current?.destroy();

    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider("ws://localhost:1234", "room-1", ydoc);
    const ytext = ydoc.getText("monaco");

    bindingRef.current = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );
    providerRef.current = provider;
  };

  return (
    <div>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="cpp">C++</option>
      </select>

      <Editor height="90vh" language={language} theme="vs-dark" onMount={handleMount} />
    </div>
  );
}
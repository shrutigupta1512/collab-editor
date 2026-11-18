import { useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

const COLORS = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4", "#008080"];

function cleanName(name: string) {
  return name.replace(/[^\w ]/g, "").slice(0, 20) || "Guest";
}

export default function App() {
  const [language, setLanguage] = useState("javascript");
  const [name, setName] = useState(() => "Guest" + Math.floor(100 + Math.random() * 900));
  const [color] = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)]);

  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const publishUser = (n: string) => {
    providerRef.current?.awareness.setLocalStateField("user", {
      name: cleanName(n),
      color,
    });
  };

  const handleMount: OnMount = (editor) => {
    bindingRef.current?.destroy();
    providerRef.current?.destroy();
    styleRef.current?.remove();

    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider("ws://localhost:1234", "room-1", ydoc);
    const ytext = ydoc.getText("monaco");
    providerRef.current = provider;
    publishUser(name);

    const styleEl = document.createElement("style");
    document.head.appendChild(styleEl);
    styleRef.current = styleEl;

    const renderCursors = () => {
      let css = "";
      provider.awareness.getStates().forEach((state, clientId) => {
        if (clientId === ydoc.clientID || !state.user) return;
        const c = /^#[0-9a-f]{6}$/i.test(state.user.color) ? state.user.color : "#888888";
        const n = cleanName(String(state.user.name));
        css += `
          .yRemoteSelection-${clientId} { background-color: ${c}55; }
          .yRemoteSelectionHead-${clientId} {
            position: absolute; border-left: 2px solid ${c};
            height: 100%; box-sizing: border-box;
          }
          .yRemoteSelectionHead-${clientId}::after {
            content: "${n}"; position: absolute; top: -1.3em; left: -2px;
            background: ${c}; color: #fff; font-size: 11px;
            padding: 0 4px; border-radius: 3px; white-space: nowrap;
          }`;
      });
      styleEl.textContent = css;
    };
    provider.awareness.on("change", renderCursors);

    bindingRef.current = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness
    );
  };

  return (
    <div>
      <select value={language} onChange={(e) => setLanguage(e.target.value)}>
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="cpp">C++</option>
      </select>
      <input
        value={name}
        maxLength={20}
        onChange={(e) => {
          setName(e.target.value);
          publishUser(e.target.value);
        }}
      />

      <Editor height="90vh" language={language} theme="vs-dark" onMount={handleMount} />
    </div>
  );
}
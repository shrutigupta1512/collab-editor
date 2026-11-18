import { useRef, useState } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { MonacoBinding } from "y-monaco";

const COLORS = ["#e6194b", "#3cb44b", "#4363d8", "#f58231", "#911eb4", "#008080"];
const ROOM_RE = /^[a-z0-9-]{3,40}$/i;

function cleanName(name: string) {
  return name.replace(/[^\w ]/g, "").slice(0, 20) || "Guest";
}

function getRoom(): string | null {
  const r = new URLSearchParams(window.location.search).get("room");
  return r && ROOM_RE.test(r) ? r : null;
}

function Landing() {
  const create = () => {
    const id = crypto.randomUUID().slice(0, 8);
    window.location.search = `?room=${id}`;
  };

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif", color: "#ddd" }}>
      <h1>Collab Editor</h1>
      <p>Start a room and share the link with a friend.</p>
      <button onClick={create}>Create room</button>
    </div>
  );
}

function Room({ room }: { room: string }) {
  const [language, setLanguage] = useState("javascript");
  const [name, setName] = useState(() => "Guest" + Math.floor(100 + Math.random() * 900));
  const [color] = useState(() => COLORS[Math.floor(Math.random() * COLORS.length)]);
  const [copied, setCopied] = useState(false);

  const providerRef = useRef<WebsocketProvider | null>(null);
  const bindingRef = useRef<MonacoBinding | null>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const publishUser = (n: string) => {
    providerRef.current?.awareness.setLocalStateField("user", {
      name: cleanName(n),
      color,
    });
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", window.location.href);
    }
  };

  const handleMount: OnMount = (editor) => {
    bindingRef.current?.destroy();
    providerRef.current?.destroy();
    styleRef.current?.remove();

    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider("ws://localhost:1234", room, ydoc);
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
      <button onClick={copyLink}>{copied ? "Copied!" : "Copy link"}</button>

      <Editor height="90vh" language={language} theme="vs-dark" onMount={handleMount} />
    </div>
  );
}

export default function App() {
  const room = getRoom();
  return room ? <Room room={room} /> : <Landing />;
}
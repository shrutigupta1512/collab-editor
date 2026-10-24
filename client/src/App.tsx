import { useState } from "react";
import Editor from "@monaco-editor/react";

export default function App() {
  const [language, setLanguage] = useState("javascript");

  return (
    <div>
      <select
        value={language}
        onChange={(e) => setLanguage(e.target.value)}
      >
        <option value="javascript">JavaScript</option>
        <option value="python">Python</option>
        <option value="cpp">C++</option>
      </select>

      <Editor
        height="90vh"
        language={language}
        defaultValue="// start coding"
        theme="vs-dark"
        onChange={(value) => console.log(value)}
      />
    </div>
  );
}
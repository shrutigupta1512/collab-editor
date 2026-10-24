import Editor from "@monaco-editor/react";

export default function App() {
  return (
    <Editor
      height="90vh"
      defaultLanguage="javascript"
      defaultValue="// start coding"
      theme="vs-dark"
      onChange={(value) => console.log(value)}
    />
  );
}
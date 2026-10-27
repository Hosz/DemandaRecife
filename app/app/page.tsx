"use client";

import { useState } from "react";
import { Dropzone } from "./components/Dropzone";
import { useToast } from "./components/ToastProvider";

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const { showToast } = useToast();

  function handleSend() {
    if (!file) return;
    showToast("success", `${file.name} pronto para enviar (teste)`);
  }

  return (
    <main className="mx-auto max-w-md p-4">
      <section className="panel">
        <p className="eyebrow">Teste de dropzone</p>
        <h1 className="section-title">Importar arquivo</h1>

        <div className="mt-5">
          <Dropzone file={file} onFileChange={setFile} />
        </div>

        <button
          className="primary-button mt-5"
          type="button"
          onClick={handleSend}
          disabled={!file}
        >
          Enviar arquivo
        </button>
      </section>
    </main>
  );
}
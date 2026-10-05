import { useEffect, useState } from "react";
export function PaymentPdfPreview({
  source,
  filename,
  zoom = 1,
}: {
  source: string;
  filename: string;
  zoom?: number;
}) {
  const [pages, setPages] = useState<string[]>([]);
  const [renderError, setRenderError] = useState("");

  useEffect(() => {
    let cancelled = false;
    let loadingTask: {
      destroy?: () => void | Promise<void>;
      promise: Promise<import("pdfjs-dist").PDFDocumentProxy>;
    } | null = null;

    async function renderPdf() {
      setPages([]);
      setRenderError("");
      try {
        const [{ GlobalWorkerOptions, getDocument }, response] =
          await Promise.all([
            import("pdfjs-dist"),
            fetch(source, { credentials: "omit" }),
          ]);
        if (!response.ok) {
          throw new Error("The secure PDF could not be loaded.");
        }
        GlobalWorkerOptions.workerSrc = new URL(
          "pdfjs-dist/build/pdf.worker.min.mjs",
          import.meta.url,
        ).toString();
        loadingTask = getDocument({
          data: new Uint8Array(await response.arrayBuffer()),
        });
        const pdf = await loadingTask.promise;
        const renderedPages: string[] = [];
        for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
          const page = await pdf.getPage(pageNumber);
          const initialViewport = page.getViewport({ scale: 1 });
          const scale = Math.min(1.5, 980 / initialViewport.width);
          const viewport = page.getViewport({ scale });
          const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
          const canvas = document.createElement("canvas");
          canvas.width = Math.ceil(viewport.width * pixelRatio);
          canvas.height = Math.ceil(viewport.height * pixelRatio);
          const context = canvas.getContext("2d");
          if (!context)
            throw new Error("The PDF preview canvas is unavailable.");
          await page.render({
            canvas,
            canvasContext: context,
            transform: [pixelRatio, 0, 0, pixelRatio, 0, 0],
            viewport,
          }).promise;
          renderedPages.push(canvas.toDataURL("image/png"));
        }
        if (!cancelled) setPages(renderedPages);
        // PDFDocumentProxy no longer guarantees a destroy method in current
        // pdf.js builds. Its loading task owns teardown instead.
        pdf.cleanup?.();
      } catch (error) {
        if (!cancelled) {
          setRenderError(
            error instanceof Error
              ? error.message
              : "This PDF could not be rendered for preview.",
          );
        }
      }
    }

    void renderPdf();
    return () => {
      cancelled = true;
      void Promise.resolve(loadingTask?.destroy?.()).catch(() => undefined);
    };
  }, [source]);

  if (renderError) {
    return <div role="alert">{renderError}</div>;
  }
  if (pages.length === 0) {
    return <p className="customer-helper">Rendering secure PDF preview…</p>;
  }
  return (
    <div
      className="payment-pdf-pages"
      style={{ width: `${zoom * 100}%`, margin: "0 auto" }}
    >
      {pages.map((page, index) => (
        <img
          alt={`${filename}, page ${index + 1}`}
          style={{
            display: "block",
            width: "100%",
            height: "auto",
            marginBottom: "1rem",
          }}
          key={page}
          src={page}
        />
      ))}
    </div>
  );
}

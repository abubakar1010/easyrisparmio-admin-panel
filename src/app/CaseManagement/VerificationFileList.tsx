import { useCallback, useState } from "react";
import { App, Button, Modal } from "antd";
import { FiDownload, FiEye, FiFileText } from "react-icons/fi";
import { LuDownload, LuScanLine } from "react-icons/lu";
import { useAppSelector } from "../../redux/hooks";
import { server_url } from "../../config";
import type { IBillFile } from "../../redux/features/Bills/billApi";

interface VerificationFileListProps {
  billId: string;
  files: IBillFile[];
}

type PreviewType = "pdf" | "image" | "other";

const formatSize = (bytes: number | null): string | null => {
  if (bytes == null) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const fileLabel = (f: IBillFile) => f.originalName || f.fileUrl.split("/").pop() || "Document";

/**
 * Documents the customer uploaded in response to a verification request.
 *
 * The files are streamed through the authenticated `bills/:id/files/:fileId`
 * endpoint rather than linked directly at the static `/uploads` path, so they
 * open reliably and are not exposed without a token.
 */
export default function VerificationFileList({ billId, files }: VerificationFileListProps) {
  const { message } = App.useApp();
  const token = useAppSelector((state) => state.auth.token);

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewType, setPreviewType] = useState<PreviewType>("other");
  const [previewName, setPreviewName] = useState<string>("Document");
  const [previewFile, setPreviewFile] = useState<IBillFile | null>(null);
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const fetchBlob = useCallback(
    async (file: IBillFile) => {
      const res = await fetch(`${server_url}bills/${billId}/files/${file.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("Failed to fetch file");
      return res.blob();
    },
    [billId, token],
  );

  const detectType = (blob: Blob, file: IBillFile): PreviewType => {
    const mime = (blob.type || file.mimeType || "").toLowerCase();
    if (mime === "application/pdf") return "pdf";
    if (mime.startsWith("image/")) return "image";
    if (file.fileUrl.toLowerCase().endsWith(".pdf")) return "pdf";
    if (/\.(jpg|jpeg|png|webp|heic)$/i.test(file.fileUrl)) return "image";
    return "other";
  };

  const handleView = async (file: IBillFile) => {
    setLoadingId(file.id);
    try {
      const blob = await fetchBlob(file);
      setPreviewType(detectType(blob, file));
      setPreviewUrl(URL.createObjectURL(blob));
      setPreviewName(fileLabel(file));
      setPreviewFile(file);
      setPreviewOpen(true);
    } catch {
      message.error("Failed to load document");
    } finally {
      setLoadingId(null);
    }
  };

  const handleDownload = async (file: IBillFile) => {
    try {
      const blob = await fetchBlob(file);
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objUrl;
      a.download = fileLabel(file);
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objUrl);
    } catch {
      message.error("Failed to download document");
    }
  };

  const handleClosePreview = () => {
    setPreviewOpen(false);
    setPreviewFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  };

  if (files.length === 0) return null;

  return (
    <>
      <div className="space-y-1.5">
        {files.map((f) => {
          const size = formatSize(f.fileSize);
          const isImage = f.mimeType?.startsWith("image/");
          return (
            <div
              key={f.id}
              className="flex items-center justify-between gap-2 bg-white rounded-lg border border-blue-100 px-3 py-2"
            >
              <div className="flex items-center gap-2 min-w-0">
                {isImage ? (
                  <LuScanLine className="h-4 w-4 text-indigo-500 shrink-0" />
                ) : (
                  <FiFileText className="h-4 w-4 text-red-500 shrink-0" />
                )}
                <span className="text-sm text-slate-700 truncate">{fileLabel(f)}</span>
                {size && <span className="text-xs text-slate-400 shrink-0">{size}</span>}
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  type="button"
                  onClick={() => handleView(f)}
                  disabled={loadingId === f.id}
                  className="inline-flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800 transition-colors disabled:opacity-50"
                >
                  <FiEye className="h-3 w-3" />
                  {loadingId === f.id ? "..." : "View"}
                </button>
                <button
                  type="button"
                  onClick={() => handleDownload(f)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-800 transition-colors"
                >
                  <LuDownload className="h-3 w-3" />
                  Download
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal
        open={previewOpen}
        onCancel={handleClosePreview}
        footer={
          <div className="flex justify-end gap-2">
            <Button onClick={handleClosePreview}>Close</Button>
            {previewFile && (
              <Button
                type="primary"
                icon={<FiDownload className="h-3.5 w-3.5" />}
                onClick={() => handleDownload(previewFile)}
                className="bg-emerald-500! hover:bg-emerald-600! border-0!"
              >
                Download
              </Button>
            )}
          </div>
        }
        title={
          <span className="flex items-center gap-2">
            <FiFileText className="h-4 w-4 text-indigo-500" />
            {previewName}
          </span>
        }
        width={900}
        centered
        destroyOnClose
      >
        {previewUrl && (
          <div
            className="flex items-center justify-center bg-slate-50 rounded-lg overflow-hidden"
            style={{ minHeight: 500 }}
          >
            {previewType === "pdf" ? (
              <iframe
                src={previewUrl}
                title="Document Preview"
                className="w-full border-0 rounded-lg"
                style={{ height: 600 }}
              />
            ) : previewType === "image" ? (
              <img src={previewUrl} alt={previewName} className="max-w-full max-h-[600px] object-contain" />
            ) : (
              <div className="flex flex-col items-center gap-3 py-12">
                <FiFileText className="h-12 w-12 text-slate-300" />
                <p className="text-sm text-slate-500">
                  Preview not available for this file type. Please download the file to view it.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>
    </>
  );
}

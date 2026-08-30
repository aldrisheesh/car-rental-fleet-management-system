export const MAX_REQUIREMENT_FILE_BYTES = 10 * 1024 * 1024;

const SIGNATURES: Record<string, (bytes: Uint8Array) => boolean> = {
  "image/jpeg": (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/png": (b) => b.length >= 8 && [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => b[i] === v),
  "application/pdf": (b) => b.length >= 5 && new TextDecoder().decode(b.subarray(0, 5)) === "%PDF-",
};
const EXTENSIONS: Record<string, string[]> = { "image/jpeg": ["jpg", "jpeg"], "image/png": ["png"], "application/pdf": ["pdf"] };

export async function validateRequirementFile(file: File): Promise<string | null> {
  if (!file || file.size === 0) return "A file is required.";
  if (file.size > MAX_REQUIREMENT_FILE_BYTES) return "File exceeds the 10 MiB limit.";
  const extension = file.name.toLowerCase().split(".").pop() || "";
  if (!EXTENSIONS[file.type]?.includes(extension) || !SIGNATURES[file.type]) return "Unsupported file format.";
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  if (!SIGNATURES[file.type](bytes)) return "File content does not match its declared format.";
  return null;
}

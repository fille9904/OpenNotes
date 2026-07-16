import OpenAI, { toFile } from "openai";
import { drive_v3, google } from "googleapis";

const required = ["OPENAI_API_KEY", "OPENAI_VECTOR_STORE_ID", "GOOGLE_DRIVE_FOLDER_ID", "GOOGLE_SERVICE_ACCOUNT_JSON"] as const;
for (const name of required) if (!process.env[name]) throw new Error(`Missing required secret: ${name}`);
const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!) as { client_email: string; private_key: string; project_id: string };
const auth = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/drive.readonly"] });
const drive = google.drive({ version: "v3", auth });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const vectorStoreId = process.env.OPENAI_VECTOR_STORE_ID!;
const excluded = new Set((process.env.DRIVE_EXCLUDED_FOLDERS || "Inlämningar,-private").split(",").map((value) => value.trim().toLowerCase()).filter(Boolean));
type DrivePdf = drive_v3.Schema$File & { id: string; name: string; modifiedTime: string; path: string };

async function listChildren(folderId: string): Promise<drive_v3.Schema$File[]> {
  const files: drive_v3.Schema$File[] = []; let pageToken: string | undefined;
  do { const result = await drive.files.list({ q: `'${folderId}' in parents and trashed = false`, fields: "nextPageToken,files(id,name,mimeType,modifiedTime,size)", pageSize: 1000, pageToken }); files.push(...(result.data.files || [])); pageToken = result.data.nextPageToken || undefined; } while (pageToken);
  return files;
}
async function walk(folderId: string, path: string[] = []): Promise<DrivePdf[]> {
  const documents: DrivePdf[] = [];
  for (const item of await listChildren(folderId)) {
    if (!item.id || !item.name) continue;
    if (item.mimeType === "application/vnd.google-apps.folder") { if (!excluded.has(item.name.toLowerCase())) documents.push(...await walk(item.id, [...path, item.name])); }
    else if (item.mimeType === "application/pdf" && item.modifiedTime) documents.push({ ...item, id: item.id, name: item.name, modifiedTime: item.modifiedTime, path: [...path, item.name].join("/") });
  }
  return documents;
}

async function main() {
  const driveFiles = await walk(process.env.GOOGLE_DRIVE_FOLDER_ID!); const vectorFiles = [];
  for await (const item of openai.vectorStores.files.list(vectorStoreId, { limit: 100 })) vectorFiles.push(item);
  const byDriveId = new Map(vectorFiles.filter((file) => file.attributes?.source === "goodnotes_drive").map((file) => [String(file.attributes?.drive_file_id), file]));
  let uploaded = 0, unchanged = 0, removed = 0;
  async function syncItem(item: DrivePdf) {
    const existing = byDriveId.get(item.id);
    if (existing?.attributes?.drive_modified_time === item.modifiedTime) { unchanged++; byDriveId.delete(item.id); return; }
    if (existing) { await openai.vectorStores.files.delete(existing.id, { vector_store_id: vectorStoreId }); await openai.files.delete(existing.id); }
    const download = await drive.files.get({ fileId: item.id, alt: "media" }, { responseType: "arraybuffer" });
    const uploadedFile = await openai.files.create({ file: await toFile(Buffer.from(download.data as ArrayBuffer), item.name), purpose: "assistants" });
    const course = item.path.split("/").find((part) => /^[A-ZÅÄÖ]{2,4}\d{3,5}$/i.test(part)) || "Other";
    const indexed = await openai.vectorStores.files.createAndPoll(vectorStoreId, { file_id: uploadedFile.id, attributes: { source: "goodnotes_drive", drive_file_id: item.id, drive_modified_time: item.modifiedTime, course, drive_path: item.path.slice(0, 512) } });
    if (indexed.status !== "completed") throw new Error(`Indexing failed for ${item.path}: ${indexed.last_error?.message || indexed.status}`);
    uploaded++; byDriveId.delete(item.id);
    console.log(`Indexed ${uploaded + unchanged}/${driveFiles.length}: ${item.path}`);
  }
  const concurrency = 4;
  for (let index = 0; index < driveFiles.length; index += concurrency) {
    await Promise.all(driveFiles.slice(index, index + concurrency).map(syncItem));
  }
  for (const stale of byDriveId.values()) { await openai.vectorStores.files.delete(stale.id, { vector_store_id: vectorStoreId }); await openai.files.delete(stale.id); removed++; }
  console.log(`Drive sync complete: ${uploaded} indexed, ${unchanged} unchanged, ${removed} removed.`);
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

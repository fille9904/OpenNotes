import "server-only";
import { drive_v3, google } from "googleapis";
import type { Course } from "@/lib/courses";

const folderMimeType = "application/vnd.google-apps.folder";
const excludedFolders = new Set((process.env.DRIVE_EXCLUDED_FOLDERS || "Inlämningar,-private").split(",").map((name) => name.trim().toLowerCase()).filter(Boolean));

export type CourseNote = { id: string; name: string; path: string; modifiedTime: string; size: number | null; url: string };

function createDriveClient() {
  const rawCredentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!rawCredentials) return null;
  const credentials: unknown = JSON.parse(rawCredentials);
  if (!credentials || typeof credentials !== "object") throw new Error("Invalid Google service-account credentials.");
  const auth = new google.auth.GoogleAuth({ credentials, scopes: ["https://www.googleapis.com/auth/drive.readonly"] });
  return google.drive({ version: "v3", auth });
}

async function listChildren(drive: drive_v3.Drive, folderId: string) {
  const files: drive_v3.Schema$File[] = [];
  let pageToken: string | undefined;
  do {
    const response = await drive.files.list({ q: `'${folderId}' in parents and trashed = false`, fields: "nextPageToken,files(id,name,mimeType,modifiedTime,size)", pageSize: 1000, pageToken });
    files.push(...(response.data.files || []));
    pageToken = response.data.nextPageToken || undefined;
  } while (pageToken);
  return files;
}

async function walk(drive: drive_v3.Drive, folderId: string, path: string[] = []): Promise<CourseNote[]> {
  const notes: CourseNote[] = [];
  for (const item of await listChildren(drive, folderId)) {
    if (!item.id || !item.name) continue;
    if (item.mimeType === folderMimeType) {
      if (!excludedFolders.has(item.name.toLowerCase())) notes.push(...await walk(drive, item.id, [...path, item.name]));
    } else if (item.mimeType === "application/pdf" && item.modifiedTime) {
      notes.push({ id: item.id, name: item.name, path: [...path, item.name].join(" / "), modifiedTime: item.modifiedTime, size: item.size ? Number(item.size) : null, url: `https://drive.google.com/file/d/${item.id}/view` });
    }
  }
  return notes;
}

export async function listCourseNotes(course: Course) {
  const drive = createDriveClient();
  if (!drive) return { configured: false as const, notes: [] };
  const notes = await walk(drive, course.driveFolderId);
  notes.sort((a, b) => a.path.localeCompare(b.path, "sv"));
  return { configured: true as const, notes };
}

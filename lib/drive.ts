import "server-only";
import { drive_v3, google } from "googleapis";
import type { Course } from "@/lib/courses";

const folderMimeType = "application/vnd.google-apps.folder";
const defaultRootFolderId = "1NbDwLmoYjPtEZQNQbU93IZDOsTcUYGq8";
const excludedFolders = new Set((process.env.DRIVE_EXCLUDED_FOLDERS || "Inlämningar,-private").split(",").map((name) => name.trim().toLowerCase()).filter(Boolean));

export type CourseNote = { id: string; name: string; path: string; modifiedTime: string; size: number | null; url: string };
export type CourseFolder = { id: string; name: string; path: string; folders: CourseFolder[]; notes: CourseNote[] };

function byName(a: { name: string }, b: { name: string }) {
  return a.name.localeCompare(b.name, "sv", { numeric: true, sensitivity: "base" });
}

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

function courseCode(folderName: string) {
  return folderName.match(/[A-ZÅÄÖ]{2,4}\d{3,5}/i)?.[0].toUpperCase() || folderName;
}

export async function listDriveCourses() {
  const drive = createDriveClient();
  if (!drive) return { configured: false as const, courses: [] };

  const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID || defaultRootFolderId;
  const yearFolders = (await listChildren(drive, rootFolderId)).filter((item) => item.id && item.mimeType === folderMimeType);
  const courses: Course[] = [];

  for (const yearFolder of yearFolders) {
    const year = Number(yearFolder.name?.match(/\d+/)?.[0]);
    if (!Number.isInteger(year) || year < 1 || year > 20 || !yearFolder.id) continue;
    for (const folder of await listChildren(drive, yearFolder.id)) {
      if (!folder.id || !folder.name || folder.mimeType !== folderMimeType || excludedFolders.has(folder.name.toLowerCase())) continue;
      courses.push({ code: courseCode(folder.name), name: folder.name, year, driveFolderId: folder.id });
    }
  }

  courses.sort((a, b) => a.year - b.year || a.name.localeCompare(b.name, "sv"));
  return { configured: true as const, courses };
}

export async function getDriveCourse(folderId: string) {
  if (!/^[A-Za-z0-9_-]{10,200}$/.test(folderId)) return null;
  const library = await listDriveCourses();
  return library.courses.find((course) => course.driveFolderId === folderId) || null;
}

async function readFolder(drive: drive_v3.Drive, folderId: string, name: string, path: string[] = []): Promise<CourseFolder> {
  const children = await listChildren(drive, folderId);
  const folderItems = children.filter((item) => item.id && item.name && item.mimeType === folderMimeType && !excludedFolders.has(item.name.toLowerCase()));
  const folders = await Promise.all(folderItems.map((item) => readFolder(drive, item.id!, item.name!, [...path, item.name!])));
  const notes = children
    .filter((item) => item.id && item.name && item.mimeType === "application/pdf" && item.modifiedTime)
    .map((item) => ({
      id: item.id!,
      name: item.name!,
      path: [...path, item.name!].join(" / "),
      modifiedTime: item.modifiedTime!,
      size: item.size ? Number(item.size) : null,
      url: `https://drive.google.com/file/d/${item.id}/view`,
    }))
    .sort(byName);

  folders.sort(byName);
  return { id: folderId, name, path: path.join(" / "), folders, notes };
}

function flattenFolder(folder: CourseFolder): CourseNote[] {
  return [...folder.notes, ...folder.folders.flatMap(flattenFolder)];
}

export async function listCourseNotes(course: Course) {
  const drive = createDriveClient();
  if (!drive) return { configured: false as const, notes: [], folders: [], rootNotes: [] };
  const root = await readFolder(drive, course.driveFolderId, course.name);
  const notes = flattenFolder(root);
  return { configured: true as const, notes, folders: root.folders, rootNotes: root.notes };
}

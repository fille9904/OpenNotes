# AGENTS.md

## Project

This project is a private study platform for automatically importing and organizing Goodnotes PDF backups from Google Drive.

## Main workflow

1. Goodnotes automatically exports notebooks as PDFs to Google Drive.
2. The application detects new or changed PDF files.
3. The application imports file metadata.
4. Notes are grouped by course.
5. Users can open and search their notes through the website.

## Technology requirements

Use:

* Next.js with the App Router
* TypeScript
* Tailwind CSS
* Supabase for authentication and database storage
* Google Drive API for note synchronization
* Vercel for deployment

## Coding rules

* Use TypeScript.
* Do not use `any` unless unavoidable.
* Keep components small and reusable.
* Use server-side code for secrets and external API credentials.
* Validate all external input.
* Never expose Google, Supabase or OpenAI secrets to the browser.
* Add clear error messages.
* Keep the application usable on mobile and desktop.
* Run linting and type checking after meaningful changes.

## Privacy rules

* Never commit `.env.local`.
* Never commit personal PDF notes.
* Never commit OAuth client secrets.
* Store only file metadata and approved processed content in the database.
* Users must only be able to access their own notes.

## Initial milestones

1. Create the Next.js application.
2. Add a basic landing page.
3. Add Supabase authentication.
4. Create the courses and notes database schema.
5. Add a course dashboard.
6. Add Google OAuth.
7. Read PDFs from a selected Google Drive folder.
8. Import note metadata.
9. Add a PDF viewer.
10. Add automatic synchronization.

## First version database entities

### profiles

* id
* display_name
* created_at

### courses

* id
* user_id
* name
* course_code
* created_at

### notes

* id
* user_id
* course_id
* google_drive_file_id
* title
* file_name
* mime_type
* modified_at
* imported_at

### sync_connections

* id
* user_id
* provider
* folder_id
* last_synced_at

## Current priority

Build a secure minimal version before adding OCR, summaries, flashcards or AI chat.

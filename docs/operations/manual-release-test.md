# Manual Release Test

Run this checklist before treating a build as release-ready.

## Chrome Or Edge Folder Output

- Start the app with `npm run dev`.
- Import a FLAC named `Artist - Song.flac` with text metadata and artwork.
- Choose an output folder.
- Create and start the queue.
- Confirm output is `Artist - Song.aiff`.
- Confirm the queue completes.
- Export the JSON report.
- Confirm the report contains filenames/statuses and no audio data.

## Rekordbox Verification

- Import the generated AIFF into Rekordbox.
- Confirm title, artist, album, genre, and year are parsed where present in the source.
- Confirm artwork is visible.
- Confirm the file analyzes and plays.

## Browser Fallback

- Test in a browser without File System Access API support.
- Confirm the app reports download fallback mode.
- Convert a short file.
- Confirm the browser downloads the converted output.

## Queue Recovery

- Start a conversion and cancel it.
- Confirm the queue surfaces cancellation/failure clearly.
- Retry or reset the queue.
- Confirm a subsequent conversion still works.

## Large Batch Sanity

- Import at least 100 files.
- Confirm filename previews and queue planning remain responsive.
- Confirm only the active conversion reads file bytes.

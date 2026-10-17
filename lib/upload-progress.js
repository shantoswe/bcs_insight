"use client";

// PUT a File/Blob directly to a presigned Supabase upload URL with progress.
// fetch() drops binary blob bodies on some iOS Safari versions, so we use XHR.
export function uploadDirectWithProgress(presignedUrl, body, contentType, onProgress) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable) onProgress?.(Math.round((e.loaded / e.total) * 100), "sending");
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress?.(100, "done");
        setTimeout(resolve, 300);
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };
    xhr.onerror = () => reject(new Error("Network error during upload"));
    xhr.open("PUT", presignedUrl);
    xhr.setRequestHeader("Content-Type", contentType);
    // Supabase signed upload URLs accept the object via PUT with this header.
    xhr.setRequestHeader("x-upsert", "true");
    xhr.send(body);
  });
}

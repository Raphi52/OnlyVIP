const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const mediaDir = path.join(process.cwd(), "public/uploads/media");

function generateThumbnail(videoPath, thumbnailPath) {
  return new Promise((resolve) => {
    const args = [
      "-i", videoPath,
      "-ss", "00:00:01",
      "-vframes", "1",
      "-vf", "scale=640:-1",
      "-y",
      thumbnailPath,
    ];

    const proc = spawn("ffmpeg", args);

    proc.stderr.on("data", (data) => {
      // Silent - too verbose
    });

    proc.on("close", (code) => {
      resolve(code === 0);
    });

    proc.on("error", (err) => {
      console.error("Error:", err.message);
      resolve(false);
    });
  });
}

async function main() {
  console.log("Generating video thumbnails...\n");

  const files = fs.readdirSync(mediaDir);
  const videos = files.filter(f => f.endsWith(".mp4"));

  console.log("Found " + videos.length + " videos\n");

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const video of videos) {
    const thumbName = video.replace(".mp4", "_thumb.jpg");
    const videoPath = path.join(mediaDir, video);
    const thumbPath = path.join(mediaDir, thumbName);

    // Check if thumbnail already exists
    if (fs.existsSync(thumbPath)) {
      skipped++;
      continue;
    }

    process.stdout.write("Generating: " + video + "... ");

    const success = await generateThumbnail(videoPath, thumbPath);

    if (success && fs.existsSync(thumbPath)) {
      console.log("OK");
      created++;
    } else {
      console.log("FAILED");
      failed++;
    }
  }

  console.log("\n--- Summary ---");
  console.log("Created: " + created);
  console.log("Skipped (already exist): " + skipped);
  console.log("Failed: " + failed);
}

main().catch(console.error);

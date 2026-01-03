import { PrismaClient } from "@prisma/client";
import * as fs from "fs";
import * as path from "path";

const prisma = new PrismaClient();

interface MediaConfig {
  creatorSlug: string;
  sourceFolder: string;
}

const mediaConfigs: MediaConfig[] = [
  { creatorSlug: "esmeralda", sourceFolder: "juliethofl" },
  { creatorSlug: "bold-kira", sourceFolder: "spirite_moon" },
];

// Map source folder to file prefixes (we'll read from uploaded media folder)
const sourceFilePrefixes: Record<string, string[]> = {
  juliethofl: [],
  spirite_moon: [],
};

async function seedMedia() {
  console.log("🎬 Starting media seed...\n");

  const mediaDir = path.join(process.cwd(), "public/uploads/media");

  // Read juliethofl files
  const juliethoflFiles = fs.readdirSync("D:/Source/juliethofl").filter(f =>
    f.endsWith(".jpg") || f.endsWith(".mp4") || f.endsWith(".png")
  );

  // Read spirite_moon files
  const spiriteMoonFiles = fs.readdirSync("D:/Source/spirite_moon").filter(f =>
    f.endsWith(".jpg") || f.endsWith(".mp4") || f.endsWith(".png")
  );

  console.log(`Found ${juliethoflFiles.length} files for esmeralda`);
  console.log(`Found ${spiriteMoonFiles.length} files for bold-kira\n`);

  // Seed esmeralda media
  await seedCreatorMedia("esmeralda", juliethoflFiles);

  // Seed bold-kira media
  await seedCreatorMedia("bold-kira", spiriteMoonFiles);

  console.log("\n✅ Media seed complete!");
}

async function seedCreatorMedia(creatorSlug: string, files: string[]) {
  console.log(`\n📸 Seeding media for ${creatorSlug}...`);

  // Check if creator exists
  const creator = await prisma.creator.findUnique({
    where: { slug: creatorSlug },
  });

  if (!creator) {
    console.log(`❌ Creator ${creatorSlug} not found, skipping...`);
    return;
  }

  // Group files by post (same prefix before _1, _2, etc.)
  const posts = new Map<string, string[]>();

  for (const file of files) {
    // Extract post ID (everything before _1.jpg, _2.jpg, etc.)
    const match = file.match(/^(.+?)_\d+\.(jpg|mp4|png)$/);
    if (match) {
      const postId = match[1];
      if (!posts.has(postId)) {
        posts.set(postId, []);
      }
      posts.get(postId)!.push(file);
    }
  }

  console.log(`Found ${posts.size} posts for ${creatorSlug}`);

  let created = 0;
  let skipped = 0;

  for (const [postId, postFiles] of posts) {
    // Sort files by number
    postFiles.sort((a, b) => {
      const numA = parseInt(a.match(/_(\d+)\./)?.[1] || "0");
      const numB = parseInt(b.match(/_(\d+)\./)?.[1] || "0");
      return numA - numB;
    });

    // First file is the main one
    const mainFile = postFiles[0];
    const isVideo = mainFile.endsWith(".mp4");
    const type = isVideo ? "VIDEO" : "IMAGE";
    const url = `/uploads/media/${mainFile}`;

    // Check if already exists
    const existing = await prisma.media.findFirst({
      where: { url, creatorSlug },
    });

    if (existing) {
      skipped++;
      continue;
    }

    // Create media entry
    await prisma.media.create({
      data: {
        creatorSlug,
        type,
        url,
        thumbnailUrl: isVideo ? `/uploads/media/${mainFile.replace(".mp4", "_thumb.jpg")}` : url,
        title: `Post ${postId}`,
        description: "",
        isPublic: Math.random() > 0.3, // 70% public, 30% premium
        isPremium: Math.random() > 0.7,
        price: Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 5 : null,
        viewCount: Math.floor(Math.random() * 500),
        likeCount: Math.floor(Math.random() * 100),
      },
    });
    created++;
  }

  console.log(`✅ ${creatorSlug}: Created ${created} media, skipped ${skipped} existing`);
}

seedMedia()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

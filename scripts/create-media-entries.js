/**
 * Create Media Entries Script
 *
 * This script creates database entries for files already in public/uploads/media
 * It identifies files from brendatrindadee_ source by their original filenames
 *
 * Run inside Docker: node scripts/create-media-entries.js
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const prisma = new PrismaClient();

const UPLOADS_DIR = '/app/public/uploads/media';
const CREATOR_SLUG = 'brendatrindadee';

// File patterns from brendatrindadee_ source (numeric IDs)
const SOURCE_PATTERN = /^(\d{16,20})_(\d+)\.(jpg|jpeg|png|mp4|mov)$/i;

// Photo extensions
const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
// Video extensions
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];

function getFileType(ext) {
  const extLower = ext.toLowerCase();
  if (PHOTO_EXTENSIONS.includes(extLower)) return 'PHOTO';
  if (VIDEO_EXTENSIONS.includes(extLower)) return 'VIDEO';
  return null;
}

function generateDescription(type) {
  const descriptions = {
    PHOTO: [
      "Exclusive content just for you 💕",
      "Something special I wanted to share 😘",
      "Hope you enjoy this exclusive shot 📸",
      "Just for my special subscribers ❤️",
    ],
    VIDEO: [
      "Exclusive video content just for you 💕",
      "Something special I recorded for you 😘",
      "Private video for my subscribers 🎬",
    ],
  };
  const arr = descriptions[type] || descriptions.PHOTO;
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🚀 Creating media entries...');
  console.log(`📁 Scanning: ${UPLOADS_DIR}`);

  if (!fs.existsSync(UPLOADS_DIR)) {
    console.error(`❌ Directory not found: ${UPLOADS_DIR}`);
    process.exit(1);
  }

  // Get existing media slugs to avoid duplicates
  const existingMedia = await prisma.mediaContent.findMany({
    where: { creatorSlug: CREATOR_SLUG },
    select: { contentUrl: true },
  });
  const existingUrls = new Set(existingMedia.map(m => m.contentUrl));
  console.log(`📊 Found ${existingUrls.size} existing entries for ${CREATOR_SLUG}`);

  // Get all files
  const files = fs.readdirSync(UPLOADS_DIR);
  console.log(`📊 Found ${files.length} files in uploads`);

  // Filter files from source
  const sourceFiles = files.filter(f => SOURCE_PATTERN.test(f));
  console.log(`📊 Found ${sourceFiles.length} files from brendatrindadee_ source`);

  let photoCount = 0;
  let videoCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const file of sourceFiles) {
    try {
      const ext = path.extname(file);
      const type = getFileType(ext);

      if (!type) {
        skipCount++;
        continue;
      }

      const contentUrl = `/uploads/media/${file}`;

      // Skip if already exists
      if (existingUrls.has(contentUrl)) {
        skipCount++;
        continue;
      }

      const filePath = path.join(UPLOADS_DIR, file);
      const stats = fs.statSync(filePath);

      const index = type === 'PHOTO' ? photoCount + 1 : videoCount + 1;
      const title = type === 'PHOTO'
        ? `Exclusive Photo #${String(index).padStart(3, '0')}`
        : `Private Video #${String(index).padStart(3, '0')}`;

      const hash = crypto.randomBytes(4).toString('hex');
      const slugPrefix = type === 'PHOTO' ? 'brenda-photo' : 'brenda-video';
      const slug = `${slugPrefix}-${String(index).padStart(4, '0')}-${hash}`;

      await prisma.mediaContent.create({
        data: {
          title,
          slug,
          description: generateDescription(type),
          creatorSlug: CREATOR_SLUG,
          type,
          accessTier: type === 'PHOTO' ? 'FREE' : 'BASIC',
          isPurchaseable: false,
          isPublished: true,
          showInGallery: false,
          publishedAt: new Date(),
          thumbnailUrl: contentUrl,
          previewUrl: contentUrl,
          contentUrl,
          fileSize: stats.size,
          mimeType: type === 'PHOTO' ? `image/${ext.slice(1)}` : `video/${ext.slice(1)}`,
        },
      });

      if (type === 'PHOTO') {
        photoCount++;
        if (photoCount % 50 === 0) {
          console.log(`  📷 Created ${photoCount} photo entries...`);
        }
      } else {
        videoCount++;
        if (videoCount % 20 === 0) {
          console.log(`  🎬 Created ${videoCount} video entries...`);
        }
      }
    } catch (error) {
      console.error(`  ❌ Error with ${file}:`, error.message);
      errorCount++;
    }
  }

  // Summary
  console.log('\n📊 Summary:');
  console.log(`  ✅ Photos created: ${photoCount}`);
  console.log(`  ✅ Videos created: ${videoCount}`);
  console.log(`  ⏭️ Skipped: ${skipCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);

  // Update creator stats
  if (photoCount > 0 || videoCount > 0) {
    try {
      await prisma.creator.upsert({
        where: { slug: CREATOR_SLUG },
        update: {
          photoCount: { increment: photoCount },
          videoCount: { increment: videoCount },
        },
        create: {
          slug: CREATOR_SLUG,
          name: 'Brenda Trindade',
          displayName: 'Brenda Trindade',
          photoCount,
          videoCount,
        },
      });
      console.log('✅ Updated creator stats');
    } catch (error) {
      console.error('⚠️ Could not update creator stats:', error.message);
    }
  }

  console.log('\n🎉 Done!');
  console.log('💡 All media are hidden from gallery by default.');
  console.log('   Go to Creator Dashboard > Media to enable gallery visibility.');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

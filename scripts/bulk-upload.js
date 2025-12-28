/**
 * Bulk Upload Script for OnlyVIP
 *
 * Usage: node scripts/bulk-upload.js
 *
 * This script:
 * 1. Scans D:\Source\brendatrindadee_ folder
 * 2. Copies files to public/uploads/media/
 * 3. Creates MediaContent entries in the database
 *
 * Photos → FREE tier, showInGallery: false
 * Videos → BASIC tier, showInGallery: false
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

// Configuration
const SOURCE_DIR = 'D:\\Source\\brendatrindadee_';
const DEST_DIR = path.join(__dirname, '..', 'public', 'uploads', 'media');
const CREATOR_SLUG = 'brendatrindadee';

// Photo extensions
const PHOTO_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
// Video extensions
const VIDEO_EXTENSIONS = ['.mp4', '.mov', '.avi', '.webm', '.mkv'];

// Generate unique slug
function generateSlug(prefix, index) {
  const hash = crypto.randomBytes(4).toString('hex');
  return `${prefix}-${String(index).padStart(4, '0')}-${hash}`;
}

// Get file type based on extension
function getFileType(ext) {
  const extLower = ext.toLowerCase();
  if (PHOTO_EXTENSIONS.includes(extLower)) return 'PHOTO';
  if (VIDEO_EXTENSIONS.includes(extLower)) return 'VIDEO';
  return null;
}

// Generate title based on filename and type
function generateTitle(filename, type, index) {
  // Try to extract meaningful info from filename
  const baseName = path.basename(filename, path.extname(filename));

  if (type === 'PHOTO') {
    return `Exclusive Photo #${String(index).padStart(3, '0')}`;
  } else {
    return `Private Video #${String(index).padStart(3, '0')}`;
  }
}

// Generate description
function generateDescription(type) {
  const descriptions = {
    PHOTO: [
      "Exclusive content just for you 💕",
      "Something special I wanted to share 😘",
      "Hope you enjoy this exclusive shot 📸",
      "Just for my special subscribers ❤️",
      "A little treat for you 🎁",
    ],
    VIDEO: [
      "Exclusive video content just for you 💕",
      "Something special I recorded for you 😘",
      "Private video for my subscribers 🎬",
      "A special video treat ❤️",
      "Enjoy this exclusive clip 🎥",
    ],
  };

  const arr = descriptions[type] || descriptions.PHOTO;
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🚀 Starting bulk upload...');
  console.log(`📁 Source: ${SOURCE_DIR}`);
  console.log(`📁 Destination: ${DEST_DIR}`);

  // Ensure destination directory exists
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
    console.log('✅ Created destination directory');
  }

  // Check if source directory exists
  if (!fs.existsSync(SOURCE_DIR)) {
    console.error(`❌ Source directory not found: ${SOURCE_DIR}`);
    process.exit(1);
  }

  // Get all files from source
  const files = fs.readdirSync(SOURCE_DIR);
  console.log(`📊 Found ${files.length} files in source directory`);

  // Separate photos and videos
  const photos = [];
  const videos = [];

  for (const file of files) {
    const ext = path.extname(file).toLowerCase();
    const type = getFileType(ext);

    if (type === 'PHOTO') {
      photos.push(file);
    } else if (type === 'VIDEO') {
      videos.push(file);
    }
  }

  console.log(`📷 Photos: ${photos.length}`);
  console.log(`🎬 Videos: ${videos.length}`);

  let photoCount = 0;
  let videoCount = 0;
  let errorCount = 0;

  // Process photos
  console.log('\n📷 Processing photos...');
  for (let i = 0; i < photos.length; i++) {
    const file = photos[i];
    try {
      const ext = path.extname(file);
      const hash = crypto.randomBytes(16).toString('hex');
      const newFilename = `${hash}${ext}`;

      const sourcePath = path.join(SOURCE_DIR, file);
      const destPath = path.join(DEST_DIR, newFilename);

      // Copy file
      fs.copyFileSync(sourcePath, destPath);

      // Get file stats
      const stats = fs.statSync(destPath);

      // Create database entry
      const title = generateTitle(file, 'PHOTO', photoCount + 1);
      const slug = generateSlug('brenda-photo', photoCount + 1);

      await prisma.mediaContent.create({
        data: {
          title,
          slug,
          description: generateDescription('PHOTO'),
          creatorSlug: CREATOR_SLUG,
          type: 'PHOTO',
          accessTier: 'FREE',
          isPurchaseable: false,
          isPublished: true,
          showInGallery: false,
          publishedAt: new Date(),
          thumbnailUrl: `/uploads/media/${newFilename}`,
          previewUrl: `/uploads/media/${newFilename}`,
          contentUrl: `/uploads/media/${newFilename}`,
          fileSize: stats.size,
          mimeType: `image/${ext.slice(1)}`,
        },
      });

      photoCount++;

      if (photoCount % 50 === 0) {
        console.log(`  ✅ Processed ${photoCount}/${photos.length} photos...`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error.message);
      errorCount++;
    }
  }
  console.log(`✅ Completed ${photoCount} photos`);

  // Process videos
  console.log('\n🎬 Processing videos...');
  for (let i = 0; i < videos.length; i++) {
    const file = videos[i];
    try {
      const ext = path.extname(file);
      const hash = crypto.randomBytes(16).toString('hex');
      const newFilename = `${hash}${ext}`;

      const sourcePath = path.join(SOURCE_DIR, file);
      const destPath = path.join(DEST_DIR, newFilename);

      // Copy file
      fs.copyFileSync(sourcePath, destPath);

      // Get file stats
      const stats = fs.statSync(destPath);

      // Create database entry
      const title = generateTitle(file, 'VIDEO', videoCount + 1);
      const slug = generateSlug('brenda-video', videoCount + 1);

      await prisma.mediaContent.create({
        data: {
          title,
          slug,
          description: generateDescription('VIDEO'),
          creatorSlug: CREATOR_SLUG,
          type: 'VIDEO',
          accessTier: 'BASIC',
          isPurchaseable: false,
          isPublished: true,
          showInGallery: false,
          publishedAt: new Date(),
          thumbnailUrl: `/uploads/media/${newFilename}`,
          previewUrl: `/uploads/media/${newFilename}`,
          contentUrl: `/uploads/media/${newFilename}`,
          fileSize: stats.size,
          mimeType: `video/${ext.slice(1)}`,
        },
      });

      videoCount++;

      if (videoCount % 20 === 0) {
        console.log(`  ✅ Processed ${videoCount}/${videos.length} videos...`);
      }
    } catch (error) {
      console.error(`  ❌ Error processing ${file}:`, error.message);
      errorCount++;
    }
  }
  console.log(`✅ Completed ${videoCount} videos`);

  // Summary
  console.log('\n📊 Summary:');
  console.log(`  ✅ Photos uploaded: ${photoCount}`);
  console.log(`  ✅ Videos uploaded: ${videoCount}`);
  console.log(`  ❌ Errors: ${errorCount}`);
  console.log(`  📁 Total: ${photoCount + videoCount} files`);

  // Update creator stats
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

  console.log('\n🎉 Bulk upload completed!');
  console.log('💡 Remember: All media are hidden from gallery by default.');
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

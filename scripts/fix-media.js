/**
 * Fix Media Script
 *
 * 1. Generate thumbnails for videos using ffmpeg
 * 2. Get video durations using ffprobe
 * 3. Update descriptions with AI keywords
 *
 * Run inside Docker: node /app/scripts/fix-media.js
 */

const { PrismaClient } = require('@prisma/client');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// AI keyword categories for descriptions
const KEYWORD_DESCRIPTIONS = {
  sexy: [
    "Something hot just for you 🔥",
    "Getting a little naughty tonight 😈",
    "Exclusive spicy content 💋",
    "Just for your eyes only 👀",
    "Uncensored and wild 🔥",
  ],
  fitness: [
    "Post-workout glow 💪",
    "Getting fit and looking good 🏋️",
    "Sweaty gym session 💦",
    "Yoga vibes today 🧘",
    "Training hard for you 💪",
  ],
  lingerie: [
    "New lingerie, what do you think? 💕",
    "Lace and silk tonight 🖤",
    "Feeling sexy in this set 😘",
    "Just got this cute underwear 💋",
    "Bedroom vibes 🛏️",
  ],
  beach: [
    "Beach day vibes 🏖️",
    "Bikini weather ☀️",
    "Pool time! 💦",
    "Vacation mode on 🌴",
    "Sun-kissed and happy ☀️",
  ],
  casual: [
    "Just a cute selfie for you 📸",
    "Morning vibes ☀️",
    "Cozy night in 🌙",
    "Just chilling at home 😊",
    "Daily life moment 💕",
  ],
  shower: [
    "Fresh out of the shower 💦",
    "Getting clean and steamy 🚿",
    "Bath time relaxation 🛁",
    "Wet and wild 💦",
    "Shower thoughts 🚿",
  ],
  mirror: [
    "Mirror selfie for you 📸",
    "Quick mirror pic 😘",
    "Checking myself out 👀",
    "New outfit, thoughts? 💕",
    "Mirror moment 📸",
  ],
  boobs: [
    "Showing off a little 😏",
    "Feeling confident today 💕",
    "Just for my VIPs 👀",
    "Topless vibes 🔥",
    "Can't contain them 😈",
  ],
  ass: [
    "Booty check 🍑",
    "From behind 👀",
    "Peach vibes 🍑",
    "Back view for you 😏",
    "Booty appreciation 🍑",
  ],
  video: [
    "Something special for you 🎬",
    "Watch me 👀",
    "Exclusive video content 🔥",
    "Moving pictures 🎥",
    "Action time 💋",
  ],
  exclusive: [
    "VIP exclusive content 👑",
    "Just for my special ones 💎",
    "Premium content alert 🔥",
    "Rare and exclusive 💕",
    "Special treat for you 🎁",
  ],
};

// Get random description with keywords
function getKeywordDescription(type, index) {
  // Mix different categories based on index for variety
  const categories = Object.keys(KEYWORD_DESCRIPTIONS);

  if (type === 'VIDEO') {
    // Videos get video + random category
    const randomCat = categories[index % (categories.length - 1)];
    const videoDescs = KEYWORD_DESCRIPTIONS.video;
    const catDescs = KEYWORD_DESCRIPTIONS[randomCat] || KEYWORD_DESCRIPTIONS.sexy;
    const allDescs = [...videoDescs, ...catDescs];
    return allDescs[index % allDescs.length];
  } else {
    // Photos get random category based on index
    const catIndex = index % categories.length;
    const category = categories[catIndex];
    const descs = KEYWORD_DESCRIPTIONS[category];
    return descs[index % descs.length];
  }
}

// Generate video thumbnail using ffmpeg
function generateVideoThumbnail(videoPath, thumbnailPath) {
  return new Promise((resolve) => {
    const args = [
      '-i', videoPath,
      '-ss', '00:00:01',
      '-vframes', '1',
      '-vf', 'scale=640:-1',
      '-y',
      thumbnailPath,
    ];

    const proc = spawn('ffmpeg', args);

    proc.stderr.on('data', (data) => {
      // ffmpeg outputs to stderr
    });

    proc.on('close', (code) => {
      resolve(code === 0);
    });

    proc.on('error', (err) => {
      console.error('ffmpeg error:', err.message);
      resolve(false);
    });
  });
}

// Get video duration using ffprobe
function getVideoDuration(videoPath) {
  return new Promise((resolve) => {
    const args = [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      videoPath,
    ];

    const proc = spawn('ffprobe', args);
    let output = '';

    proc.stdout.on('data', (data) => {
      output += data.toString();
    });

    proc.on('close', () => {
      const duration = parseFloat(output.trim());
      resolve(isNaN(duration) ? 0 : Math.round(duration));
    });

    proc.on('error', (err) => {
      console.error('ffprobe error:', err.message);
      resolve(0);
    });
  });
}

async function main() {
  console.log('🚀 Starting media fix...\n');

  // Get all media that needs fixing
  const media = await prisma.mediaContent.findMany({
    where: { creatorSlug: 'miacosta' },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`📊 Found ${media.length} media items to process\n`);

  let thumbnailsGenerated = 0;
  let durationsUpdated = 0;
  let descriptionsUpdated = 0;
  let errors = 0;

  for (let i = 0; i < media.length; i++) {
    const item = media[i];
    const updates = {};
    let needsUpdate = false;

    // 1. Update description with keywords
    const newDescription = getKeywordDescription(item.type, i);
    if (item.description !== newDescription) {
      updates.description = newDescription;
      needsUpdate = true;
      descriptionsUpdated++;
    }

    // 2. For videos, generate thumbnail and get duration
    if (item.type === 'VIDEO') {
      const videoFilename = item.contentUrl.split('/').pop();
      const videoPath = `/app/public/uploads/media/${videoFilename}`;

      // Check if video file exists
      if (fs.existsSync(videoPath)) {
        // Check if thumbnail needs to be generated
        const needsThumbnail = !item.thumbnailUrl ||
          item.thumbnailUrl === item.contentUrl ||
          !item.thumbnailUrl.includes('_thumb');

        if (needsThumbnail) {
          const thumbFilename = videoFilename.replace(/\.[^.]+$/, '_thumb.jpg');
          const thumbPath = `/app/public/uploads/media/${thumbFilename}`;

          const success = await generateVideoThumbnail(videoPath, thumbPath);
          if (success) {
            updates.thumbnailUrl = `/uploads/media/${thumbFilename}`;
            updates.previewUrl = `/uploads/media/${thumbFilename}`;
            thumbnailsGenerated++;
            needsUpdate = true;
          } else {
            console.log(`  ⚠️ Failed to generate thumbnail for ${videoFilename}`);
            errors++;
          }
        }

        // Get duration if not set
        if (!item.duration || item.duration === 0) {
          const duration = await getVideoDuration(videoPath);
          if (duration > 0) {
            updates.duration = duration;
            durationsUpdated++;
            needsUpdate = true;
          }
        }
      } else {
        console.log(`  ⚠️ Video file not found: ${videoPath}`);
        errors++;
      }
    }

    // 3. Apply updates
    if (needsUpdate) {
      try {
        await prisma.mediaContent.update({
          where: { id: item.id },
          data: updates,
        });
      } catch (error) {
        console.error(`  ❌ Failed to update ${item.id}:`, error.message);
        errors++;
      }
    }

    // Progress update
    if ((i + 1) % 50 === 0) {
      console.log(`  ✅ Processed ${i + 1}/${media.length} items...`);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`  ✅ Thumbnails generated: ${thumbnailsGenerated}`);
  console.log(`  ✅ Durations updated: ${durationsUpdated}`);
  console.log(`  ✅ Descriptions updated: ${descriptionsUpdated}`);
  console.log(`  ❌ Errors: ${errors}`);
  console.log('\n🎉 Done!');
}

main()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

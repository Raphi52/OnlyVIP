declare module "ffmpeg-static" {
  const ffmpegPath: string;
  export = ffmpegPath;
}

declare module "ffprobe-static" {
  export const path: string;
}

import * as FileSystem from "expo-file-system";
import { Image } from "react-native-compressor";

// --- Compress Image ---
const compressImage = async (uri) => {
  try {
    const compressedUri = await Image.compress(uri, {
      compressionMethod: "auto", // 'manual' if you want quality settings
    });

    if (!compressedUri || typeof compressedUri !== "string") {
      console.warn("Image compression failed, using original URI");
      const originalFileInfo = await FileSystem.getInfoAsync(uri);
      return {
        uri,
        type: "image",
        name: `image_${Date.now()}.jpg`,
        size: originalFileInfo.size || 0,
      };
    }

    const fileInfo = await FileSystem.getInfoAsync(compressedUri);
    return {
      uri: compressedUri,
      type: "image",
      name: `image_${Date.now()}.jpg`,
      size: fileInfo.size || 0,
    };
  } catch (error) {
    console.error("Image compression error:", error);
    const fallbackInfo = await FileSystem.getInfoAsync(uri);
    return {
      uri,
      type: "image",
      name: `image_${Date.now()}.jpg`,
      size: fallbackInfo.size || 0,
    };
  }
};

// --- Compress Video ---
// const compressVideo = async (uri) => {
//   try {
//     const compressedUri = await Video.compress(
//       uri,
//       {
//         compressionMethod: "auto",
//         maxDuration: 15, // in seconds
//       },
//       (progress) => {
//       }
//     );

//     if (!compressedUri || typeof compressedUri !== "string") {
//       console.warn("Video compression failed, using original URI");
//       const originalFileInfo = await FileSystem.getInfoAsync(uri);
//       return {
//         uri,
//         type: "video",
//         name: `video_${Date.now()}.mp4`,
//         size: originalFileInfo.size || 0,
//       };
//     }

//     const fileInfo = await FileSystem.getInfoAsync(compressedUri);
//     return {
//       uri: compressedUri,
//       type: "video",
//       name: `video_${Date.now()}.mp4`,
//       size: fileInfo.size || 0,
//     };
//   } catch (error) {
//     console.error("Video compression error:", error);
//     const fallbackInfo = await FileSystem.getInfoAsync(uri);
//     return {
//       uri,
//       type: "video",
//       name: `video_${Date.now()}.mp4`,
//       size: fallbackInfo.size || 0,
//     };
//   }
// };

export { compressImage };

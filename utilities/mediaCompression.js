// // utils/mediaCompression.ts
// import * as FileSystem from "expo-file-system";
// import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

// export async function compressImage(uri, number = 0.7) {
//   try {
//     const manipResult = await manipulateAsync(
//       uri,
//       [{ resize: { width: 1024 } }],
//       {
//         compress: quality,
//         format: SaveFormat.JPEG,
//         base64: false,
//       }
//     );

//     const fileInfo = await FileSystem.getInfoAsync(manipResult.uri);

//     return {
//       uri: manipResult.uri,
//       type: "image",
//       name: `image_${Date.now()}.jpg`,
//       size: fileInfo.size || 0,
//     };
//   } catch (error) {
//     console.error("Image compression error:", error);
//     throw error;
//   }
// }

// export async function compressVideo(uri) {
//   try {
//     const fileInfo = await FileSystem.getInfoAsync(uri);

//     return {
//       uri,
//       type: "video",
//       name: `video_${Date.now()}.mp4`,
//       size: fileInfo.size || 0,
//     };
//   } catch (error) {
//     console.error("Video compression error:", error);
//     throw error;
//   }
// }

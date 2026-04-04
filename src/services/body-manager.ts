import localforage from "localforage";
import * as poseDetection from "@tensorflow-models/pose-detection";
import "@tensorflow/tfjs-core";
import "@tensorflow/tfjs-backend-webgl";
import type { PoseType, BodyPhoto } from "../shared/types";

const bodyStore = localforage.createInstance({
  name: "mirra",
  storeName: "body_photos",
});

let detector: poseDetection.PoseDetector | null = null;

async function getDetector(): Promise<poseDetection.PoseDetector> {
  if (!detector) {
    detector = await poseDetection.createDetector(
      poseDetection.SupportedModels.MoveNet,
      {
        modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING,
      }
    );
  }
  return detector;
}

type PoseResult = {
  pose: PoseType;
  confidence: number;
  keypoints: Array<{ x: number; y: number; score: number; name: string }>;
};

async function detectPose(imageBase64: string): Promise<PoseResult> {
  const det = await getDetector();

  const blob = await fetch(imageBase64).then((r) => r.blob());
  const bitmap = await createImageBitmap(blob);
  const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
  const ctx = canvas.getContext("2d")!;
  ctx.drawImage(bitmap, 0, 0);
  const imageData = ctx.getImageData(0, 0, bitmap.width, bitmap.height);

  const poses = await det.estimatePoses(imageData);

  if (!poses.length || !poses[0].keypoints) {
    return { pose: "front", confidence: 0, keypoints: [] };
  }

  const keypoints = poses[0].keypoints.map((kp) => ({
    x: kp.x,
    y: kp.y,
    score: kp.score ?? 0,
    name: kp.name ?? "",
  }));

  const pose = classifyPose(keypoints);
  const avgScore = keypoints.reduce((sum, kp) => sum + kp.score, 0) / keypoints.length;

  return { pose, confidence: avgScore, keypoints };
}

function classifyPose(keypoints: Array<{ x: number; y: number; score: number; name: string }>): PoseType {
  const find = (name: string) => keypoints.find((kp) => kp.name === name);

  const leftShoulder = find("left_shoulder");
  const rightShoulder = find("right_shoulder");
  const leftHip = find("left_hip");
  const rightHip = find("right_hip");
  const nose = find("nose");

  const threshold = 0.3;

  const leftShoulderVisible = (leftShoulder?.score ?? 0) > threshold;
  const rightShoulderVisible = (rightShoulder?.score ?? 0) > threshold;
  const leftHipVisible = (leftHip?.score ?? 0) > threshold;
  const rightHipVisible = (rightHip?.score ?? 0) > threshold;
  const noseVisible = (nose?.score ?? 0) > threshold;

  if (leftShoulderVisible && rightShoulderVisible && leftHipVisible && rightHipVisible) {
    if (noseVisible) {
      return "front";
    }
    return "back";
  }

  if ((leftShoulderVisible && !rightShoulderVisible) || (!leftShoulderVisible && rightShoulderVisible)) {
    return "side";
  }

  return "front";
}

export async function saveBodyPhoto(
  imageBase64: string,
  manualPose?: PoseType
): Promise<{ pose: PoseType; detectedPose?: PoseType }> {
  let pose: PoseType;
  let detectedPose: PoseType | undefined;
  let keypoints: BodyPhoto["keypoints"] = [];

  if (manualPose) {
    pose = manualPose;
    try {
      const result = await detectPose(imageBase64);
      keypoints = result.keypoints;
      detectedPose = result.pose;
    } catch {
      // Pose detection failed, save without keypoints
    }
  } else {
    try {
      const result = await detectPose(imageBase64);
      pose = result.pose;
      detectedPose = result.pose;
      keypoints = result.keypoints;
    } catch {
      pose = "front";
    }
  }

  const photo: BodyPhoto = {
    image: imageBase64,
    pose,
    keypoints,
    timestamp: Date.now(),
  };

  await bodyStore.setItem(`body_${pose}`, photo);
  return { pose, detectedPose };
}

export async function getBodyPhoto(pose: PoseType): Promise<BodyPhoto | null> {
  return bodyStore.getItem<BodyPhoto>(`body_${pose}`);
}

export async function getBestPhotoForCategory(category?: string): Promise<BodyPhoto | null> {
  const front = await getBodyPhoto("front");
  if (front) return front;

  const side = await getBodyPhoto("side");
  if (side) return side;

  const back = await getBodyPhoto("back");
  return back;
}

export async function getAllPhotos(): Promise<Record<PoseType, BodyPhoto | null>> {
  const [front, side, back] = await Promise.all([
    getBodyPhoto("front"),
    getBodyPhoto("side"),
    getBodyPhoto("back"),
  ]);
  return { front, side, back };
}

export async function deleteBodyPhoto(pose: PoseType): Promise<void> {
  await bodyStore.removeItem(`body_${pose}`);
}

export async function getStoredPoses(): Promise<PoseType[]> {
  const photos = await getAllPhotos();
  return (Object.entries(photos) as [PoseType, BodyPhoto | null][])
    .filter(([, photo]) => photo !== null)
    .map(([pose]) => pose);
}

export async function migrateFromChromeStorage(): Promise<void> {
  const result = await chrome.storage.local.get("personImage");
  const personImage = result.personImage as string | undefined;

  if (personImage) {
    await saveBodyPhoto(personImage, "front");
    await chrome.storage.local.remove("personImage");
  }
}

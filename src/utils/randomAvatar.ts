import { IMAGE_ASSETS_URL } from "@/services/const";

export default function randomAvatar() {
  const avatarPath = [
    `${IMAGE_ASSETS_URL}/images/agent-male-a.webp`,
    `${IMAGE_ASSETS_URL}/images/agent-male-b.webp`,
    `${IMAGE_ASSETS_URL}/images/agent-female-a.webp`,
    `${IMAGE_ASSETS_URL}/images/agent-female-b.webp`,
  ]
  return avatarPath[Math.floor(Math.random() * avatarPath.length)];
}
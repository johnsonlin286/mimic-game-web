export default function randomAvatar() {
  const avatarPath = [
    "/images/agent-male-a.webp",
    "/images/agent-male-b.webp",
    "/images/agent-female-a.webp",
    "/images/agent-female-b.webp",
  ]
  return avatarPath[Math.floor(Math.random() * avatarPath.length)];
}
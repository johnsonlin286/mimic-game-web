export default function randomAvatar() {
  const avatarPath = [
    "/images/agent-male.webp",
    "/images/agent-female.webp",
    // "/images/agent-octopus.webp",
    // "/images/agent-jellyfish.webp",
  ]
  return avatarPath[Math.floor(Math.random() * avatarPath.length)];
}
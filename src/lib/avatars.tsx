import { Rocket, Star, Flame, Trophy, Zap, Crown, Cat, Rabbit, Dog, Bird, type LucideIcon } from "lucide-react";

// Dětské avatary (bez emoji — jen lucide ikony + barva). Klíč se ukládá do deti.avatar.
export type AvatarDef = { key: string; Icon: LucideIcon; color: string };

export const AVATARS: AvatarDef[] = [
  { key: "rocket", Icon: Rocket, color: "#4a5b86" },
  { key: "star", Icon: Star, color: "#bf9a47" },
  { key: "flame", Icon: Flame, color: "#d9534f" },
  { key: "trophy", Icon: Trophy, color: "#2e7d4f" },
  { key: "zap", Icon: Zap, color: "#7a5bc0" },
  { key: "crown", Icon: Crown, color: "#c8a24c" },
  { key: "cat", Icon: Cat, color: "#2f8f86" },
  { key: "rabbit", Icon: Rabbit, color: "#a65b6b" },
  { key: "dog", Icon: Dog, color: "#5a6470" },
  { key: "bird", Icon: Bird, color: "#2f6fb0" },
];

export const avatarByKey = (key: string | null | undefined): AvatarDef =>
  AVATARS.find((a) => a.key === key) ?? AVATARS[0];

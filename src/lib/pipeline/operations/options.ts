import type { RotationAngle } from "@/lib/pdf/rotate";
import type { WatermarkPosition } from "@/lib/pdf/watermark";
import type { PageNumberFormat, PageNumberPosition } from "@/lib/pdf/pageNumbers";

export type CompressOptions = Record<string, never>; // no options in v1
export interface RotateOptions { angle: RotationAngle; scope: "all" | "odd" | "even" }
export interface WatermarkOptions { text: string; opacity: number; position: WatermarkPosition }
export interface PageNumbersOptions { format: PageNumberFormat; position: PageNumberPosition; startNumber: number }
export interface MetadataOptions { title: string; author: string; subject: string; keywords: string }
export interface PasswordOptions { password: string }

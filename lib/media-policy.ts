import { z } from "zod";
export const MAX_MEDIA_BYTES = 50 * 1024 * 1024;
export const MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif", "video/mp4", "video/webm", "video/quicktime", "application/pdf"] as const;
export const PHASES = ["general", "deployment", "t1", "t2", "t3", "t4", "t5", "army", "score"] as const;
export const mediaInput = z.object({name:z.string().trim().min(1).max(200),mimeType:z.enum(MEDIA_TYPES),size:z.number().int().positive().max(MAX_MEDIA_BYTES),gameId:z.string().min(1).max(100).nullable().optional(),phase:z.enum(PHASES).default("general")});
export const mediaEdit = z.object({caption:z.string().trim().max(1000).optional(),gameId:z.string().min(1).max(100).nullable().optional(),phase:z.enum(PHASES).optional()}).strict();
export function extensionFor(mime:string) { return ({"image/jpeg":"jpg","image/png":"png","image/webp":"webp","image/avif":"avif","video/mp4":"mp4","video/webm":"webm","video/quicktime":"mov","application/pdf":"pdf"} as Record<string,string>)[mime]; }

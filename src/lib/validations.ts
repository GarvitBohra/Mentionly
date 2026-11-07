import { z } from "zod";

const websiteSchema = z
  .string()
  .trim()
  .max(2048, "Website URL is too long")
  .transform((value) => {
    if (!value) return "https://mentionly.ai";
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
  })
  .refine((value) => {
    try {
      const url = new URL(value);
      return url.protocol === "http:" || url.protocol === "https:";
    } catch {
      return false;
    }
  }, "Enter a valid http(s) website URL");

export const brandSchema = z.object({
  name: z.string().trim().min(1, "Brand name is required").max(100),
  website: websiteSchema.optional().default("https://mentionly.ai"),
  industry: z.string().trim().max(100).optional().default("Technology"),
  country: z.string().trim().max(100).optional().default("Global"),
  language: z.string().trim().max(100).optional().default("English"),
  description: z.string().max(1000).optional().default(""),
  competitors: z
    .array(z.string())
    .optional()
    .default([])
    .transform((arr) => arr.map((c) => c.trim()).filter((c) => c.length > 0)),
});

export const promptGenerationSchema = z.object({
  brand_name: z.string().min(1),
  website: websiteSchema,
  industry: z.string().min(1).default("Technology"),
  description: z.string().optional().default(""),
  competitors: z.array(z.string()).optional().default([]),
  count: z.number().int().min(1).max(20).default(6),
});

export const promptCreateSchema = z.object({
  brand_id: z.string().min(1),
  query_text: z.string().trim().min(1, "Prompt query is required").max(1000, "Prompt query is too long"),
  category: z.enum([
    "Discovery",
    "Recommendation",
    "Comparison",
    "Purchase Intent",
    "Problem Solving",
  ]).default("Discovery"),
});

export const monitoringRunSchema = z.object({
  brand_id: z.string().min(1),
  prompt_ids: z.array(z.string().min(1)).min(1, "Select at least 1 prompt to run"),
});

export const recommendationGenerateSchema = z.object({
  brand_id: z.string().min(1),
});

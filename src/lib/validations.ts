import { z } from "zod";

export const brandSchema = z.object({
  name: z.string().min(1, "Brand name is required").max(100),
  website: z.string().min(1).transform((v) => (v.startsWith("http://") || v.startsWith("https://") ? v : `https://${v}`)),
  industry: z.string().min(1, "Industry is required").default("Technology"),
  country: z.string().default("Global"),
  language: z.string().default("English"),
  description: z.string().max(1000).optional().default(""),
  competitors: z.array(z.string().min(1)).default([]),
});

export const promptGenerationSchema = z.object({
  brand_name: z.string().min(1),
  website: z.string().transform((v) => (v.startsWith("http://") || v.startsWith("https://") ? v : `https://${v}`)),
  industry: z.string().min(1).default("Technology"),
  description: z.string().optional().default(""),
  competitors: z.array(z.string()).optional().default([]),
  count: z.number().int().min(1).max(20).default(6),
});

export const promptCreateSchema = z.object({
  brand_id: z.string().min(1),
  query_text: z.string().min(1, "Prompt query is required"),
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

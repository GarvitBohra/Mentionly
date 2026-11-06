import { z } from "zod";

export const brandSchema = z.object({
  name: z.string().min(2, "Brand name must be at least 2 characters").max(100),
  website: z.string().url("Must be a valid URL (e.g. https://example.com)"),
  industry: z.string().min(2, "Industry is required").max(100),
  country: z.string().min(2, "Country is required").default("Global"),
  language: z.string().min(2, "Language is required").default("English"),
  description: z.string().max(1000).optional().default(""),
  competitors: z.array(z.string().min(1)).min(1, "Add at least 1 competitor").max(10),
});

export const promptGenerationSchema = z.object({
  brand_name: z.string().min(1),
  website: z.string().url(),
  industry: z.string().min(1),
  description: z.string().optional().default(""),
  competitors: z.array(z.string()).optional().default([]),
  count: z.number().int().min(3).max(15).default(6),
});

export const promptCreateSchema = z.object({
  brand_id: z.string().uuid(),
  query_text: z.string().min(5, "Prompt query must be at least 5 characters"),
  category: z.enum([
    "Discovery",
    "Recommendation",
    "Comparison",
    "Purchase Intent",
    "Problem Solving",
  ]),
});

export const monitoringRunSchema = z.object({
  brand_id: z.string().uuid(),
  prompt_ids: z.array(z.string().uuid()).min(1, "Select at least 1 prompt to run"),
});

export const recommendationGenerateSchema = z.object({
  brand_id: z.string().uuid(),
});


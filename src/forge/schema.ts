import { z } from "zod";

/**
 * Forge DSL v1 - Zod Schema
 * Used for Layer 1 (Schema) validation.
 */

const LayoutSchema = z.object({
  mode: z.literal("flex"),
  direction: z.enum(["row", "column"]),
  gap: z.number().optional(),
  justify: z.enum(["start", "center", "end", "between"]).optional(),
  align: z.enum(["start", "center", "end", "stretch"]).optional(),
});

const StyleSchema = z.object({
  padding: z.number().optional(),
  paddingX: z.number().optional(),
  paddingY: z.number().optional(),
  background: z.string().optional(),
  borderRadius: z.number().optional(),
  width: z.union([z.number(), z.literal("fill"), z.literal("hug")]).optional(),
  height: z.union([z.number(), z.literal("fill"), z.literal("hug")]).optional(),
  fontSize: z.number().optional(),
  fontWeight: z.enum(["normal", "bold"]).optional(),
  color: z.string().optional(),
  textAlign: z.enum(["left", "center", "right"]).optional(),
  objectFit: z.enum(["cover", "contain"]).optional(),
  opacity: z.number().min(0).max(1).optional(),
});

const BaseNodeSchema = z.object({
  id: z.string().optional(),
  style: StyleSchema.optional(),
  layout: LayoutSchema.optional(),
});

// Recursive schema for ForgeNode
export const ForgeNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.discriminatedUnion("type", [
    BaseNodeSchema.extend({
      type: z.literal("container"),
      children: z.array(ForgeNodeSchema),
    }),
    BaseNodeSchema.extend({
      type: z.literal("text"),
      text: z.string(),
    }),
    BaseNodeSchema.extend({
      type: z.literal("button"),
      text: z.string(),
      variant: z.enum(["primary", "secondary", "outline"]).optional(),
      onClick: z.string().optional(),
    }),
    BaseNodeSchema.extend({
      type: z.literal("image"),
      src: z.string().url(),
      alt: z.string().optional(),
    }),
    BaseNodeSchema.extend({
      type: z.literal("custom"),
      render: z.object({
        svg: z.string(),
      }),
    }),
  ])
);

export const ForgeGraphSchema = z.object({
  root: ForgeNodeSchema,
});

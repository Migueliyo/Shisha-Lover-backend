import z from "zod";

const entryCategorySchema = z.object({
  category_name: z.string({
    invalid_type_error: "Category name must be a string",
    required_error: "Category name is required.",
  }),
});

const entrySchema = z.object({
  title: z.string({
    invalid_type_error: "Title must be a string",
    required_error: "Title is required.",
  }),
  description: z.string({
    invalid_type_error: "Description must be a string",
    required_error: "Description is required.",
  }),
  entry_categories: z.array(entryCategorySchema),
});

export function validateEntry(input) {
  return entrySchema.safeParse(input);
}

export function validatePartialEntry(input) {
  return entrySchema.partial().safeParse(input);
}

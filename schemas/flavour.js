import z from 'zod'

const flavourCategorySchema = z.object({
  category_name: z.string({
    invalid_type_error: 'Category name must be a string',
    required_error: 'Category name is required.',
  }),
})

const flavourSchema = z.object({
  name: z.string({
    invalid_type_error: 'Flavour name must be a string',
    required_error: 'Flavour name is required.'
  }),
  description: z.string({
    invalid_type_error: 'Flavour description must be a string',
    required_error: 'Flavour description is required.'
  }),
  brand: z.string({
    invalid_type_error: 'Flavour brand must be a string',
    required_error: 'Flavour brand is required.'
  }),
  flavour_categories: z.array(flavourCategorySchema),
})

export function validateFlavour (input) {
  return flavourSchema.safeParse(input)
}

export function validatePartialFlavour (input) {
  return flavourSchema.partial().safeParse(input)
}

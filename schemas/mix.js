import z from 'zod';

const mixFlavourSchema = z.object({
  flavour_name: z.string({
    invalid_type_error: 'Flavour name must be a string',
    required_error: 'Flavour name is required.',
  }),
  percentage: z.number().int().min(0).max(100),
})

const mixCategorySchema = z.object({
  category_name: z.string({
    invalid_type_error: 'Category name must be a string',
    required_error: 'Category name is required.',
  }),
})

const mixSchema = z.object({
  name: z.string({
    invalid_type_error: 'Mix name must be a string',
    required_error: 'Mix name is required.',
  }),
  username: z.string({
    invalid_type_error: 'Username must be a string',
    required_error: 'Username is required.',
  }),
  mix_flavours: z.array(mixFlavourSchema),
  mix_categories: z.array(mixCategorySchema),
}).refine((data) => {
  // Suma de porcentajes de sabores en la mezcla
  const totalPercentage = data.mix_flavours.reduce(
    (acc, flavour) => acc + flavour.percentage,
    0
  )

  // Comprueba si la suma no es igual a 100%
  if (totalPercentage !== 100) {
    throw new Error('Total percentage of flavours must equal 100%')
  }

  return true
})

export function validateMix(input) {
  return mixSchema.safeParse(input)
}

import z from 'zod';

const mixFlavourSchema = z.object({
  flavour_name: z.string({
    invalid_type_error: 'Flavour name must be a string',
    required_error: 'Flavour name is required.',
  }),
  percentage: z.number().int().min(0).max(100),
})

const mixSchema = z.object({
  name: z.string({
    invalid_type_error: 'Mix name must be a string',
    required_error: 'Mix name is required.',
  }),
  type: z.enum(['Dulce', 'Cítrica', 'Afrutada', 'Mentolada'], {
    invalid_type_error: 'Mix type must be a value of enum Type',
    required_error: 'Mix type is required.',
  }),
  mix_flavours: z.array(mixFlavourSchema),
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

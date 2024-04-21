import z from "zod";

const mixFlavourSchema = z.object({
  flavour_name: z.string({
    invalid_type_error: "Flavour name must be a string",
    required_error: "Flavour name is required.",
  }),
  percentage: z.number().int().min(0).max(100),
});

const mixSchema = z.object({
  name: z.string({
    invalid_type_error: "Mix name must be a string",
    required_error: "Mix name is required.",
  }),
  mix_flavours: z.array(mixFlavourSchema),
});

export function validateMix(input) {
  return mixSchema
    .refine((data) => {
      // Suma de porcentajes de sabores en la mezcla
      const totalPercentage = data.mix_flavours.reduce(
        (acc, flavour) => acc + flavour.percentage,
        0
      );

      // Comprueba si la suma no es igual a 100%
      if (totalPercentage !== 100) {
        throw new Error("Total percentage of flavours must equal 100%");
      }

      return true;
    })
    .safeParse(input);
}

export function validatePartialMix(input) {
  return mixSchema
    .partial()
    .refine((data) => {
      if (data.mix_flavours !== undefined) {
        // Suma de porcentajes de sabores en la mezcla
        const totalPercentage = data.mix_flavours.reduce(
          (acc, flavour) => acc + flavour.percentage,
          0
        );

        // Comprueba si la suma no es igual a 100%
        if (totalPercentage !== 100) {
          throw new Error("Total percentage of flavours must equal 100%");
        }
      }

      // Solo si la entrada tiene datos válidos para actualizar
      if (Object.keys(data).length > 0) {
        return true;
      }

      throw new Error("No data entered");
    })
    .safeParse(input);
}

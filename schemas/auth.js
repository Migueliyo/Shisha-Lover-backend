import z from 'zod'

const authSchema = z.object({
  email: z.string({
    invalid_type_error: 'Email must be a string',
    required_error: 'Email is required.'
  }),
  password: z.string({
    invalid_type_error: 'Password must be a string',
    required_error: 'Password is required.'
  })
})

export function validateAuth (input) {
  return authSchema.safeParse(input)
}
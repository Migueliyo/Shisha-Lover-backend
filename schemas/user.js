import z from 'zod'

const userSchema = z.object({
  username: z.string({
    invalid_type_error: 'Username must be a string',
    required_error: 'Username is required.'
  }),
  password: z.string({
    invalid_type_error: 'Password must be a string',
    required_error: 'Password is required.'
  }),
  first_name: z.string({
    invalid_type_error: 'First name must be a string',
    required_error: 'First name is required.'
  }),
  last_name: z.string({
    invalid_type_error: 'Last name must be a string',
    required_error: 'Last name is required.'
  }),
  email: z.string({
    invalid_type_error: 'Email must be a string',
    required_error: 'Email is required.'
  }),
})

export function validateUser (input) {
  return userSchema.safeParse(input)
}

export function validatePartialUser (input) {
  return userSchema.partial().safeParse(input)
}

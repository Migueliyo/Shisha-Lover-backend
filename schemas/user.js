import z from "zod";

const userSchema = z.object({
  username: z.string({
    invalid_type_error: "Username must be a string",
    required_error: "Username is required.",
  }),
  password: z.string({
    invalid_type_error: "Password must be a string",
    required_error: "Password is required.",
  }),
  first_name: z.string({
    invalid_type_error: "First name must be a string",
    required_error: "First name is required.",
  }),
  last_name: z.string({
    invalid_type_error: "Last name must be a string",
    required_error: "Last name is required.",
  }),
  email: z.string({
    invalid_type_error: "Email must be a string",
    required_error: "Email is required.",
  }),
  avatar: z.string({ invalid_type_error: "Avatar must be a string" }),
  description: z.string({ invalid_type_error: "Description must be a string" }),
  twitter: z.string({ invalid_type_error: "Twitter url must be a string" }),
  instagram: z.string({ invalid_type_error: "Instagram url must be a string" }),
  facebook: z.string({ invalid_type_error: "Facebook url must be a string" }),
  youtube: z.string({ invalid_type_error: "Youtube url must be a string" }),
  reddit: z.string({ invalid_type_error: "Reddit url must be a string" }),
});

export function validateUser(input) {
  return userSchema.safeParse(input);
}

export function validatePartialUser(input) {
  return userSchema.partial().safeParse(input);
}

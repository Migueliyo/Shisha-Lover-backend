import { validateAuth } from '../schemas/auth.js'

export class AuthController {
  constructor ({ authModel }) {
    this.authModel = authModel
  }

  login = async (req, res) => {
    try {
      const result = validateAuth(req.body)

      if (!result.success) {
        return res.status(400).json({ error: result.error.message })
      }

      const jwtToken = await this.authModel.login({ input: result.data })

      res.status(200).json({ token: jwtToken})
    } catch (error) {
      res.status(400).json({ message: error.message })
    }
  }

  register = async (req, res) => {}

}

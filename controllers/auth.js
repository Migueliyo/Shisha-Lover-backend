import { validateAuth } from "../schemas/auth.js";
import { validateUser } from "../schemas/user.js";

export class AuthController {
  constructor({ authModel }) {
    this.authModel = authModel;
  }

  login = async (req, res) => {
    try {
      const result = validateAuth(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ error: true, message: result.error.message });
      }

      const jwtToken = await this.authModel.login({ input: result.data });

      res.status(200).json({ error: false, data: jwtToken });
    } catch (error) {
      res.status(400).json({ error: true, message: error.message });
    }
  };

  register = async (req, res) => {
    try {
      const result = validateUser(req.body)
  
      if (!result.success) {
        return res.status(400).json({ error: true, message: JSON.parse(result.error.message) })
      }
  
      const insertedUser = await this.authModel.register({ input: result.data });
  
      // Autenticar al usuario recién registrado
      const jwtToken = await this.authModel.login({ input: { email: insertedUser.email, password: result.data.password } });
  
      res.status(200).json({ error: false, data: jwtToken });
      
    } catch (error) {
      res.status(400).json({ error: true, message: error.message });
    }
  };
  
}

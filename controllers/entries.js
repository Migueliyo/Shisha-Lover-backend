import { validateEntry, validatePartialEntry } from "../schemas/entry.js";

export class EntryController {
  constructor({ entryModel }) {
    this.entryModel = entryModel;
  }

  getAll = async (req, res) => {
    const { category } = req.query;
    const entries = await this.entryModel.getAll({ category });
    res.json({ error: false, data: entries });
  };

  getById = async (req, res) => {
    const { id } = req.params;
    const entry = await this.entryModel.getById({ id });
    if (entry) return res.json({ error: false, data: entry });
    res.status(404).json({ error: true, message: "Entry not found" });
  };

  create = async (req, res) => {
    try {
      const result = validateEntry(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ error: true, message: JSON.parse(result.error.message) });
      }

      const userId = req.user.id;
      const newEntry = await this.entryModel.create({
        userId,
        input: result.data,
      });

      res.status(201).json({ error: false, data: newEntry });
    } catch (error) {
      res.status(400).json({ error: true, message: error.message });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await this.entryModel.delete({ id, userId });

      if (!result) {
        return res
          .status(404)
          .json({ error: true, message: JSON.parse(result.error.message) });
      }

      return res.json({ error: false, message: "Entry deleted" });
    } catch (error) {
      res.status(400).json({ error: true, message: error.message });
    }
  };

  update = async (req, res) => {
    try {
      const result = validatePartialEntry(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ error: true, message: JSON.parse(result.error.message) });
      }

      const { id } = req.params;
      const userId = req.user.id;

      const updatedEntry = await this.entryModel.update({
        id,
        userId,
        input: result.data,
      });

      return res.json({ error: false, data: updatedEntry });
    } catch (error) {
      res.status(400).json({ error: true, message: error.message });
    }
  };
}

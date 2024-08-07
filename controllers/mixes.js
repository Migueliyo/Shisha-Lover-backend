import { validateMix, validatePartialMix } from "../schemas/mix.js";

export class MixController {
  constructor({ mixModel }) {
    this.mixModel = mixModel;
  }

  getAll = async (req, res) => {
    const { category, flavour } = req.query;
    const mixes = await this.mixModel.getAll({ category, flavour });
    if (mixes.length === 0) {
      return res.status(404).json({ error: true, message: "No mixes found" });
    }
    res.json({ error: false, data: mixes });
  };

  getById = async (req, res) => {
    const { id } = req.params;
    const mix = await this.mixModel.getById({ id });
    if (mix) return res.json({ error: false, data: mix });
    res.status(404).json({ error: true, message: "Mix not found" });
  };

  create = async (req, res) => {
    try {
      const result = validateMix(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ error: true, message: JSON.parse(result.error.message) });
      }

      const userId = req.user.id;
      const newMix = await this.mixModel.create({ userId, input: result.data });

      res.status(201).json({ error: false, data: newMix });
    } catch (error) {
      res.status(400).json({ error: true, message: error.message });
    }
  };

  delete = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      const result = await this.mixModel.delete({ id, userId });

      if (!result) {
        return res
          .status(404)
          .json({ error: true, message: JSON.parse(result.error.message) });
      }

      return res.json({ error: false, message: "Mix deleted" });
    } catch (error) {
      res.status(400).json({ error: true, message: error.message });
    }
  };

  update = async (req, res) => {
    try {
      const result = validatePartialMix(req.body);

      if (!result.success) {
        return res
          .status(400)
          .json({ error: true, message: JSON.parse(result.error.message) });
      }

      const { id } = req.params;
      const userId = req.user.id;

      const updatedMix = await this.mixModel.update({
        id,
        userId,
        input: result.data,
      });

      return res.json({ error: false, data: updatedMix });
    } catch (error) {
      res.status(400).json({ error: true, message: error.message });
    }
  };

  addLike = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const response = await this.mixModel.addLike({ id, userId });
      if (response.success) {
        res.json({ error: false, data: { id: response.likeId } });
      } else {
        res.json({ error: true, data: null });
      }
    } catch (error) {
      res.status(400).json({ error: true, message: error.message });
    }
  };

  removeLike = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const response = await this.mixModel.removeLike({ id, userId });
      if (response.success) {
        res.json({ error: false, data: { id: response.likeId } });
      } else {
        res.json({ error: true, data: null });
      }
    } catch (error) {
      res.status(400).json({ error: true, message: error.message });
    }
  }; 

  checkLike = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const hasLiked = await this.mixModel.checkLike({ id, userId });

      res.json({ error: false, data: { hasLiked } });
    } catch (error) {
      res.status(400).json({ error: true, message: error.message });
    }
  };

  addComment = async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      await this.mixModel.addComment({ id, userId, input: req.body });
      res.json({ error: false, message: "Comment added successfully" });
    } catch (error) {
      res.status(400).json({ erorr: true, message: error.message });
    }
  };

  removeComment = async (req, res) => {
    try {
      const { id, commentId } = req.params;
      const userId = req.user.id;
      await this.mixModel.removeComment({ id, userId, commentId });
      res.json({ error: false, message: "Comment removed successfully" });
    } catch (error) {
      res.status(400).json({ error: true, message: error.message });
    }
  };
}

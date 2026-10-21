import { validationResult } from 'express-validator';
import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';

const getUsers = asyncHandler(async (req, res) => {
  const { search } = req.query;

  const query = { _id: { $ne: req.user._id } };

  if (search && search.trim()) {
    const safeSearch = search.trim();
    const regex = new RegExp(safeSearch.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    query.name = { $regex: regex };
  }

  const users = await User.find(query)
    .select('_id name department year')
    .sort({ name: 1 });

  res.json({ users });
});

export { getUsers };

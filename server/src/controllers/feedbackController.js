import { validationResult } from 'express-validator';
import mongoose from 'mongoose';
import Feedback from '../models/Feedback.js';
import User from '../models/User.js';
import asyncHandler from '../middleware/asyncHandler.js';

const CATEGORY_OPTIONS = ['teamwork', 'communication', 'technical', 'helpfulness'];

const createFeedback = asyncHandler(async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400);
    throw new Error(errors.array()[0].msg);
  }

  const { to, category, rating, comment, anonymous } = req.body;

  if (to === req.user._id.toString()) {
    res.status(400);
    throw new Error('You cannot give feedback to yourself.');
  }

  const recipient = await User.findById(to);
  if (!recipient) {
    res.status(404);
    throw new Error('Recipient not found');
  }

  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const existing = await Feedback.findOne({
    from: req.user._id,
    to,
    category,
    createdAt: { $gte: thirtyDaysAgo },
  });

  if (existing) {
    res.status(429);
    throw new Error('You already gave feedback in this category to this student within the last 30 days.');
  }

  const feedback = await Feedback.create({
    from: req.user._id,
    to,
    category,
    rating,
    comment,
    anonymous: Boolean(anonymous),
  });

  const populated = await Feedback.findById(feedback._id).populate('to', 'name');

  res.status(201).json({ feedback: populated });
});

const getReceivedFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ to: req.user._id })
    .populate('from', 'name department year')
    .populate('to', 'name department year')
    .sort({ createdAt: -1 });

  const normalized = feedback.map((item) => ({
    ...item.toObject(),
    from: item.anonymous ? null : item.from,
  }));

  // Aggregation keeps the dashboard fast and avoids loading all documents into memory.
  const average = await Feedback.aggregate([
    { $match: { to: new mongoose.Types.ObjectId(req.user._id) } },
    { $group: { _id: null, averageRating: { $avg: '$rating' }, total: { $sum: 1 } } },
  ]);

  const categoryStats = await Feedback.aggregate([
    { $match: { to: new mongoose.Types.ObjectId(req.user._id) } },
    {
      $group: {
        _id: '$category',
        averageRating: { $avg: '$rating' },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  const categorySummary = CATEGORY_OPTIONS.reduce((acc, category) => {
    const existing = categoryStats.find((item) => item._id === category);
    acc[category] = existing
      ? {
          average: Number(existing.averageRating.toFixed(2)),
          count: existing.count,
        }
      : {
          average: 0,
          count: 0,
        };
    return acc;
  }, {});

  res.json({
    feedback: normalized,
    overallAverage: average[0] ? Number(average[0].averageRating.toFixed(2)) : 0,
    feedbackCount: average[0] ? average[0].total : 0,
    categoryAverage: categorySummary,
  });
});

const getGivenFeedback = asyncHandler(async (req, res) => {
  const feedback = await Feedback.find({ from: req.user._id })
    .populate('to', 'name department year')
    .sort({ createdAt: -1 });

  const formatted = feedback.map((item) => ({
    ...item.toObject(),
    to: item.to,
  }));

  res.json({ feedback: formatted });
});

export { createFeedback, getReceivedFeedback, getGivenFeedback };

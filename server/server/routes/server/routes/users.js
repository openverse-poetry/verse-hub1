const express = require('express');
const User = require('../models/User');
const Poem = require('../models/Poem');

const router = express.Router();

// Get all users
router.get('/', async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ popularity: -1 });
    
    // Get poems count for each user
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const poemsCount = await Poem.countDocuments({ author: user._id });
        return {
          ...user.toObject(),
          poemsCount
        };
      })
    );

    res.json(usersWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Get user profile
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    
    if (!user) {
      return res.status(404).json({ message: 'Пользователь не найден' });
    }

    const poemsCount = await Poem.countDocuments({ author: user._id });
    const userWithStats = {
      ...user.toObject(),
      poemsCount
    };

    res.json(userWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Get top authors
router.get('/top/authors', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    
    const topAuthors = await User.find({ popularity: { $gt: 0 } })
      .select('-password')
      .sort({ popularity: -1 })
      .limit(limit);

    // Get poems count for each author
    const authorsWithStats = await Promise.all(
      topAuthors.map(async (author) => {
        const poemsCount = await Poem.countDocuments({ author: author._id });
        return {
          ...author.toObject(),
          poemsCount
        };
      })
    );

    res.json(authorsWithStats);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;

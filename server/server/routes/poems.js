const express = require('express');
const Poem = require('../models/Poem');
const User = require('../models/User');
const auth = require('../middleware/auth');

const router = express.Router();

// Get all poems
router.get('/', async (req, res) => {
  try {
    const poems = await Poem.find()
      .populate('author', 'name avatarColor popularity')
      .sort({ createdAt: -1 });
    res.json(poems);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Get single poem
router.get('/:id', async (req, res) => {
  try {
    const poem = await Poem.findById(req.params.id)
      .populate('author', 'name avatarColor popularity');
    
    if (!poem) {
      return res.status(404).json({ message: 'Стихотворение не найдено' });
    }

    res.json(poem);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Create poem
router.post('/', auth, async (req, res) => {
  try {
    const { title, content } = req.body;

    const poem = new Poem({
      title,
      content,
      author: req.user.id,
      authorName: req.user.name
    });

    await poem.save();
    
    // Populate author info for response
    await poem.populate('author', 'name avatarColor popularity');

    res.status(201).json(poem);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Update poem
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content } = req.body;

    let poem = await Poem.findById(req.params.id);
    
    if (!poem) {
      return res.status(404).json({ message: 'Стихотворение не найдено' });
    }

    // Check if user owns the poem
    if (poem.author.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Нельзя редактировать чужое стихотворение' });
    }

    poem = await Poem.findByIdAndUpdate(
      req.params.id,
      { title, content, updatedAt: Date.now() },
      { new: true }
    ).populate('author', 'name avatarColor popularity');

    res.json(poem);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Delete poem
router.delete('/:id', auth, async (req, res) => {
  try {
    const poem = await Poem.findById(req.params.id);
    
    if (!poem) {
      return res.status(404).json({ message: 'Стихотворение не найдено' });
    }

    // Check if user owns the poem
    if (poem.author.toString() !== req.user.id) {
      return res.status(401).json({ message: 'Нельзя удалить чужое стихотворение' });
    }

    // Update author popularity
    await User.findByIdAndUpdate(req.user.id, {
      $inc: { popularity: -poem.readers }
    });

    await Poem.findByIdAndDelete(req.params.id);
    res.json({ message: 'Стихотворение удалено' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Mark as read
router.post('/:id/read', auth, async (req, res) => {
  try {
    const poem = await Poem.findById(req.params.id);
    
    if (!poem) {
      return res.status(404).json({ message: 'Стихотворение не найдено' });
    }

    // Check if already read
    if (poem.uniqueReaders.includes(req.user.id)) {
      return res.json({ message: 'Уже прочитано' });
    }

    // Add to readers and update popularity
    poem.uniqueReaders.push(req.user.id);
    poem.readers = poem.uniqueReaders.length;
    await poem.save();

    // Update author popularity
    await User.findByIdAndUpdate(poem.author, {
      $inc: { popularity: 1 }
    });

    res.json({ message: '+1 к популярности автора!' });
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Get user's poems
router.get('/user/:userId', async (req, res) => {
  try {
    const poems = await Poem.find({ author: req.params.userId })
      .populate('author', 'name avatarColor popularity')
      .sort({ createdAt: -1 });
    res.json(poems);
  } catch (error) {
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;

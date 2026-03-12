const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();
const app = express();

app.use(express.json());

const bookSchema = new mongoose.Schema({
  title: { type: String, required: true },
  author: { type: String, required: true },
  isbn: { type: String, required: true, unique: true },
  genre: { type: String, required: true },
  publisher: { type: String, required: true },
  publicationYear: Number,
  totalCopies: { type: Number, required: true, min: 1 },
  availableCopies: { type: Number, required: true },
  shelfLocation: String,
  bookType: { type: String, enum: ['Reference', 'Circulating'] },
  status: { type: String, default: 'Available', enum: ['Available', 'Checked Out'] }
});

const Book = mongoose.model('Book', bookSchema);

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected'))
  .catch(err => console.log('MongoDB Connection Error:', err));

// POST - Add new book
app.post('/books', async (req, res, next) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
});

// GET - All books
app.get('/books', async (req, res, next) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
});

// GET - Search books by title (YEH PEHLE ANA CHAHIYE)
app.get('/books/search', async (req, res, next) => {
  try {
    const { title } = req.query;
    
    if (!title) {
      return res.status(400).json({ message: 'Title query parameter is required' });
    }
    
    console.log('Searching for title:', title);
    
    const books = await Book.find({ 
      title: { $regex: title, $options: 'i' } 
    });
    
    console.log('Found books:', books.length);
    
    res.status(200).json(books);
  } catch (error) {
    console.error('Search error:', error);
    next(error);
  }
});

// GET - Book by ID (YEH BAAD MEIN ANA CHAHIYE)
app.get('/books/:id', async (req, res, next) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
});

// PUT - Update book
app.put('/books/:id', async (req, res, next) => {
  try {
    const book = await Book.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
});

// DELETE - Delete book
app.delete('/books/:id', async (req, res, next) => {
  try {
    const book = await Book.findByIdAndDelete(req.params.id);
    if (!book) {
      return res.status(404).json({ message: 'Book not found' });
    }
    res.status(200).json({ message: 'Book deleted successfully' });
  } catch (error) {
    next(error);
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.log('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message });
  }
  if (err.code === 11000) {
    return res.status(400).json({ message: 'ISBN must be unique' });
  }
  res.status(500).json({ message: 'Server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
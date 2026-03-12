const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

const dns = require('dns').promises;
dns.setServers(['8.8.8.8', '1.1.1.1']);
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
  .catch(err => console.log(err));

app.post('/api/books', async (req, res, next) => {
  try {
    const book = new Book(req.body);
    await book.save();
    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
});

app.get('/api/books', async (req, res, next) => {
  try {
    const books = await Book.find();
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
});

app.get('/api/books/:id', async (req, res, next) => {
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

app.put('/api/books/:id', async (req, res, next) => {
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

app.delete('/api/books/:id', async (req, res, next) => {
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

app.get('/api/books/search', async (req, res, next) => {
  try {
    const { title } = req.query;
    const books = await Book.find({ title: { $regex: title, $options: 'i' } });
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
});

app.use((err, req, res, next) => {
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
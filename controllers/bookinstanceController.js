const BookInstance = require("../models/bookinstance");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator");

const asyncHandler = require("express-async-handler");

// Display list of all BookInstances.
exports.bookinstance_list = asyncHandler(async (req, res, next) => {
  const allBookInstances = await BookInstance.find().populate("book").exec();

  res.render("bookinstance_list", {
    title: "Book Instance List",
    bookinstance_list: allBookInstances
  });
});

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id)
    .populate("book")
    .exec();

  if (bookInstance === null) {
    const err = new Error("Book copy not found");
    err.status = 404;
    return next(err);
  }

  res.render("bookinstance_detail", {
    title: `Book Instance of ${bookInstance.book.title}`,
    bookinstance: bookInstance,
  });
});

// Display BookInstance create form on GET.
exports.bookinstance_create_get = asyncHandler(async (req, res, next) => {
  const allBooks = await Book.find({}, "title").exec();

  res.render("bookinstance_form", {
    title: "Create BookInstance",
    book_list: allBooks,
  });
});

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
  body("book", "Book must be specified").trim().isLength({ min: 1 }).escape(),
  body("imprint", "Imprint must be specified")
    .trim()
    .isLength({ min: 3 })
    .escape(),
  body("status").escape(),
  body("due_back", "Invalid date")
    .optional({ checkFalsy: true })
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
    });

    if (!errors.isEmpty()) {
      const allBooks = await Book.find({}, "title").exec();

      res.render("bookinstance_form", {
        title: "Create BookInstance",
        book_list: allBooks,
        selected_book: bookInstance.book._id,
        errors: errors.array(),
        bookinstance: bookInstance,
      });
      return;
    } else {
      await bookInstance.save();
      res.redirect(bookInstance.url);
    }
  }),
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id).exec();

  if (bookInstance === null) {
    res.redirect("/catalog/bookinstances")
  }

  res.render('bookinstance_delete', {
    title: 'Delete Book Instance',
    book_instance: bookInstance,
  });
});

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = asyncHandler(async (req, res, next) => {
  const bookInstance = await BookInstance.findById(req.params.id).exec();

  if (bookInstance === null) {
    const err = new Error("Book not found");
    err.status = 404;
    return next(err);
  }

  await BookInstance.findByIdAndRemove(req.params.id).exec();

  res.redirect("/catalog/bookinstances");
});

// Display BookInstance update form on GET.
exports.bookinstance_update_get = asyncHandler(async (req, res, next) => {
  const [bookInstance, allBooks] = await Promise.all([
    BookInstance.findById(req.params.id).exec(),
    Book.find().exec(),
  ])

  if (bookInstance === null) {
    res.redirect('/catalog/bookinstances');
  }

  res.render('bookinstance_form', {
    title: 'Update book instance',
    selected_book: bookInstance.book,
    bookinstance: bookInstance,
    book_list: allBooks,
  })
});

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
  body("book", "Book can not be empty")
    .trim()
    .not().isEmpty()
    .escape(),
  body("imprint", "Imprint can not be empty")
    .trim()
    .not().isEmpty()
    .escape(),
  body("status", "Status can not be empty")
    .trim()
    .not().isEmpty()
    .escape(),
  body("due_back", "Not a valid date")
    .optional({values: 'falsy'})
    .isISO8601()
    .isDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    const bookInstance = new BookInstance({
      book: req.body.book,
      imprint: req.body.imprint,
      status: req.body.status,
      due_back: req.body.due_back,
      _id: req.params.id,
    });

    if (!errors.isEmpty()) {
      const allBooks = await Book.find().exec();

      res.render('bookinstance_form', {
        title: 'Update book instance',
        bookinstance: bookInstance,
        selected_book: bookInstance.book,
        book_list: allBooks,
      });
      return;
    } else {
      await BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {}).exec();

      res.redirect('/catalog/bookinstances');
    }
  }),
];

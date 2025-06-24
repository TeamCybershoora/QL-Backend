const express = require('express');
const router = express.Router();
const Account = require('../models/Accounts');
const User = require('../models/User');

/**
 * GET /accounts?email=...
 * Fetch all account entries for a user.
 */
router.get('/accounts', async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) return res.status(400).json({ message: 'Email is required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const accountDoc = await Account.findOne({ user: user._id });
    const accounts = accountDoc?.accounts || [];
    return res.status(200).json({ accounts });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /add/accounts
 * Add a new account entry (with month) to user's account list.
 * Body: { email, category, amount, month }
 */
router.post('/add/accounts', async (req, res) => {
  try {
    const { email, category, amount, month } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    let accountDoc = await Account.findOne({ user: user._id });
    if (!accountDoc) {
      accountDoc = new Account({
        user: user._id,
        accounts: [{ category, amount, month }]
      });
    } else {
      // Avoid duplicate categories?
      accountDoc.accounts.push({ category, amount, month });
    }

    await accountDoc.save();
    res.status(201).json({ message: 'Account detail added' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /edit/accounts
 * Edit an existing account entry by category.
 * Body: { email, oldCategory, category, amount, month }
 */
router.post('/edit/accounts', async (req, res) => {
  try {
    const { email, oldCategory, category, amount, month } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const accountDoc = await Account.findOne({ user: user._id });
    if (!accountDoc) return res.status(404).json({ message: 'No account data found' });

    const idx = accountDoc.accounts.findIndex(acc => acc.category === oldCategory);
    if (idx === -1) {
      // If not found, add as new
      accountDoc.accounts.push({ category, amount, month });
    } else {
      accountDoc.accounts[idx] = { category, amount, month };
    }

    await accountDoc.save();
    res.status(200).json({ message: 'Account updated' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

/**
 * POST /delete/accounts
 * Delete an account entry matching category.
 * Body: { email, category }
 */
router.post('/delete/accounts', async (req, res) => {
  try {
    const { email, category } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const accountDoc = await Account.findOne({ user: user._id });
    if (!accountDoc) return res.status(404).json({ message: 'No account data found' });

    const beforeCount = accountDoc.accounts.length;
    accountDoc.accounts = accountDoc.accounts.filter(acc => acc.category !== category);

    if (accountDoc.accounts.length === beforeCount) {
      return res.status(404).json({ message: 'Category not found' });
    }

    await accountDoc.save();
    res.status(200).json({ message: 'Account deleted' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;

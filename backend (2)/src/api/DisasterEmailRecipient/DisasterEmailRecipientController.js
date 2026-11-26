const Recipient = require('./DisasterEmailRecipient');

const normalize = (value) => String(value || '').trim().toLowerCase();
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const validEmail = (email) => email.length > 0 && email.length <= 254 && EMAIL_REGEX.test(email);

exports.all = async (_req, res) => {
  try {
    const data = await Recipient.find().sort({ createdAt: -1 });
    return res.json({ success: true, data });
  } catch (err) { return res.status(500).json({ success: false, message: 'Unable to load recipients' }); }
};

exports.add = async (req, res) => {
  const email = normalize(req.body.email);
  if (!validEmail(email)) return res.status(400).json({ success: false, message: 'Enter a valid email address' });
  try {
    const existing = await Recipient.findOne({ email });
    if (existing) return res.status(409).json({ success: false, message: 'This email address already exists' });

    const item = await Recipient.create({ email });
    return res.status(201).json({ success: true, message: 'Email recipient added', data: item });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'This email address already exists' });
    if (err.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Enter a valid email address' });
    return res.status(500).json({ success: false, message: 'Unable to add recipient' });
  }
};

exports.update = async (req, res) => {
  const email = normalize(req.body.email);
  if (!validEmail(email)) return res.status(400).json({ success: false, message: 'Enter a valid email address' });
  try {
    const existing = await Recipient.findOne({ email, _id: { $ne: req.params._id } });
    if (existing) return res.status(409).json({ success: false, message: 'This email address already exists' });

    const item = await Recipient.findByIdAndUpdate(req.params._id, { email }, { new: true, runValidators: true });
    if (!item) return res.status(404).json({ success: false, message: 'Recipient not found' });
    return res.json({ success: true, message: 'Email recipient updated', data: item });
  } catch (err) {
    if (err.code === 11000) return res.status(409).json({ success: false, message: 'This email address already exists' });
    if (err.name === 'CastError' || err.name === 'ValidationError') return res.status(400).json({ success: false, message: 'Invalid email address or recipient ID' });
    return res.status(500).json({ success: false, message: 'Unable to update recipient' });
  }
};

exports.remove = async (req, res) => {
  try {
    const item = await Recipient.findByIdAndDelete(req.params._id);
    if (!item) return res.status(404).json({ success: false, message: 'Recipient not found' });
    return res.json({ success: true, message: 'Email recipient deleted' });
  } catch (err) { return res.status(500).json({ success: false, message: 'Unable to delete recipient' }); }
};
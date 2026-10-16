const { nameError } = require('../utils/teacherValidation');
const { findSupabaseAccountByUsername } = require('../services/supabaseAccountService');
const { uploadFile } = require('../services/storageService');
const { resolveStoredFileUrl } = require('../utils/fileStorage');

const profile = (user, req) => ({
  name: user.name, email: user.email, username: user.username,
  role: user.role, department: user.department || '',
  profileImage: user.profileImage ? resolveStoredFileUrl(req, user.profileImage) : '',
});

exports.get = (req, res) => res.json({ user: profile(req.user, req) });
exports.update = async (req, res, next) => {
  try {
    const name = String(req.body?.name || '').trim();
    const username = String(req.body?.username || '').trim();
    const invalidName = nameError(name, 'Name', 101);
    if (!name || invalidName || !/^[A-Za-z0-9][A-Za-z0-9._-]{2,29}$/.test(username)) {
      return res.status(400).json({ message: invalidName || 'Enter a name and a valid username (3–30 characters).' });
    }
    if (username.toLowerCase() !== String(req.user.username || '').toLowerCase()) {
      const existing = await findSupabaseAccountByUsername(username);
      if (existing) return res.status(409).json({ message: 'Username is already taken.' });
    }
    let image = req.user.profileImage;
    if (req.file) {
      const uploaded = await uploadFile({ file: req.file, folder: `profile-images/headteachers/${req.user._id}` });
      image = uploaded.storedPath;
    }
    req.user.name = name;
    req.user.username = username;
    req.user.profileImage = image;
    await req.user.save();
    return res.json({ message: 'Profile updated successfully.', user: profile(req.user, req) });
  } catch (error) { next(error); }
};

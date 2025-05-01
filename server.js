const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static HTML from "public" folder
app.use(express.static('public'));

// Create "uploads" folder if it doesn't exist
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // folder to save
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // unique file name
  }
});

const upload = multer({ storage: storage });

// Upload route (multiple files)
app.post('/upload', upload.array('files'), async (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.send('❌ No files uploaded');
  }

  // Prepare email attachments
  const attachments = req.files.map(file => ({
    filename: file.originalname,
    path: file.path
  }));

  // Nodemailer config
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,       // your gmail
      pass: process.env.EMAIL_PASS        // your app password
    }
  });

  try {
    let info = await transporter.sendMail({
      from: `"Send File to Himanshu" <${process.env.EMAIL_USER}>`,
      to: process.env.RECEIVER_EMAIL, // Your receiving Gmail
      subject: '📎 New Files Received',
      text: 'A user uploaded files for you.',
      attachments: attachments
    });

    console.log('✅ Email sent: ', info.messageId);
    res.send('✅ Files sent to Himanshu successfully!');
  } catch (error) {
    console.error('❌ Error sending email:', error);
    res.send('❌ Failed to send files. Try again later.');
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

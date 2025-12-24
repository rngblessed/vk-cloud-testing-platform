const { PutObjectCommand } = require('@aws-sdk/client-s3');
const s3Client = require('../config/s3');
const multer = require('multer');

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

exports.uploadMiddleware = upload.single('file');

exports.uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileName = `${Date.now()}-${req.file.originalname}`;
    
    const uploadParams = {
      Bucket: process.env.S3_BUCKET_NAME,
      Key: fileName,
      Body: req.file.buffer,
      ContentType: req.file.mimetype,
      ACL: 'public-read'
    };

    await s3Client.send(new PutObjectCommand(uploadParams));
    
    const fileUrl = `http://${process.env.CDN_DOMAIN}/${fileName}`;
    
    res.json({ 
      message: 'File uploaded successfully',
      url: fileUrl,
      fileName: fileName
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

import Category from '../models/Category.js';
import { cloudinary } from '../config/cloudinary.js';

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [
          { width: 500, height: 500, crop: 'limit' },
          { quality: 'auto' }
        ],
      },
      (error, result) => {
        if (error) {
          console.error('❌ Cloudinary upload error:', error);
          reject(error);
        } else {
          console.log('✅ Cloudinary upload success:', result.secure_url);
          resolve(result);
        }
      }
    );
    uploadStream.end(buffer);
  });
};

export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ message: 'Category name is required' });
    }
    const categoryExists = await Category.findOne({ 
      name: { $regex: new RegExp(`^${name.trim()}$`, 'i') } 
    });
    
    if (categoryExists) {
      return res.status(400).json({ message: 'Category already exists' });
    }

    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    let image = '';
    if (req.file) {
      try {
        const result = await uploadToCloudinary(req.file.buffer, 'ecommerce/categories');
        image = result.secure_url;
        console.log('✅ Image uploaded:', image);
      } catch (uploadError) {
        console.error('❌ Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload image to Cloudinary' });
      }
    } else {
      console.log('⚠️ No image file received - creating category without image');
    }

    const category = await Category.create({
      name: name.trim(),
      slug: slug,
      image: image,
    });

    console.log('✅ Category created:', category);
    res.status(201).json(category);
  } catch (error) {
    console.error('❌ Create category error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const { name } = req.body;

    if (name && name.trim()) {
      category.name = name.trim();
      category.slug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    if (req.file) {
      if (category.image) {
        try {
          const publicId = category.image.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`ecommerce/categories/${publicId}`);
          console.log('🗑️ Old image deleted:', publicId);
        } catch (err) {
          console.error('Delete old image error:', err);
        }
      }

      try {
        const result = await uploadToCloudinary(req.file.buffer, 'ecommerce/categories');
        category.image = result.secure_url;
        console.log('✅ New image uploaded:', category.image);
      } catch (uploadError) {
        console.error('❌ Cloudinary upload error:', uploadError);
        return res.status(500).json({ message: 'Failed to upload image' });
      }
    }

    await category.save();
    console.log('✅ Category updated:', category);
    res.json(category);
  } catch (error) {
    console.error('❌ Update category error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    if (category.image) {
      try {
        const publicId = category.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`ecommerce/categories/${publicId}`);
        console.log('🗑️ Image deleted:', publicId);
      } catch (err) {
        console.error('Delete image error:', err);
      }
    }

    await category.deleteOne();
    console.log('✅ Category deleted:', category.name);
    res.json({ message: 'Category removed successfully' });
  } catch (error) {
    console.error('❌ Delete category error:', error);
    res.status(500).json({ message: error.message });
  }
};

import Product from '../models/Product.js';
import Category from '../models/Category.js';
import { cloudinary } from '../config/cloudinary.js';

const uploadToCloudinary = (buffer, folder) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
        transformation: [
          { width: 800, height: 800, crop: 'limit' },
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

export const getProducts = async (req, res) => {
  try {
    const { category, brand, search, sort, page = 1, limit = 10, discount } = req.query;

    const query = {};

    if (category) {
      const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(category);
      
      let categoryDoc;
      if (isValidObjectId) {
        categoryDoc = await Category.findById(category);
      } else {
        categoryDoc = await Category.findOne({ slug: category });
      }
      
      if (categoryDoc) {
        query.category = categoryDoc._id;
      } else {
        return res.json({
          products: [],
          page: parseInt(page),
          pages: 0,
          total: 0,
        });
      }
    }

    if (brand) {
      query.brand = brand;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }
    if (discount === 'true') {
      query.discountPrice = { $exists: true, $ne: null, $gt: 0 };
    }

    let sortOption = {};
    if (sort === 'price_asc' || sort === 'price-asc') sortOption = { price: 1 };
    else if (sort === 'price_desc' || sort === 'price-desc') sortOption = { price: -1 };
    else if (sort === 'rating') sortOption = { 'ratings.average': -1 };
    else if (sort === 'newest') sortOption = { createdAt: -1 };
    else if (sort === 'discount_high' || sort === 'discount') {
      // Sort by discount amount (price - discountPrice)
      sortOption = { discountPrice: 1 }; // Lower discountPrice = higher discount
    }
    else sortOption = { createdAt: -1 };

    const skip = (page - 1) * limit;

    const products = await Product.find(query)
      .populate('category', 'name slug')
      .sort(sortOption)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      currentPage: parseInt(page),
      totalPages: Math.ceil(total / limit),
      totalProducts: total,
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getFeaturedProducts = async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true })
      .populate('category', 'name slug')
      .limit(6);
    res.json(products);
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name slug')
      .populate('reviews.user', 'name');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    console.error('Get product by ID error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createProduct = async (req, res) => {
  try {

    const { 
      name, 
      description, 
      price, 
      discountPrice, 
      category, 
      brand, 
      stock, 
      isFeatured 
    } = req.body;

    if (!name || !description || !price || !category) {
      return res.status(400).json({ 
        message: 'Name, description, price, and category are required' 
      });
    }
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ message: 'Category not found' });
    }
    let imageUrls = [];
    if (req.files && req.files.length > 0) {
      console.log(`📤 Uploading ${req.files.length} images to Cloudinary...`);
      
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer, 'ecommerce/products');
          imageUrls.push(result.secure_url);
          console.log(`✅ Uploaded: ${result.secure_url}`);
        } catch (uploadError) {
          console.error('❌ Upload error for file:', file.originalname, uploadError);
          return res.status(500).json({ 
            message: `Failed to upload image: ${file.originalname}` 
          });
        }
      }
    }

    if (imageUrls.length === 0) {
      return res.status(400).json({ message: 'At least one image is required' });
    }

    const product = await Product.create({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      discountPrice: discountPrice ? parseFloat(discountPrice) : undefined,
      category,
      brand: brand ? brand.trim() : '',
      images: imageUrls,
      stock: parseInt(stock) || 0,
      isFeatured: isFeatured === 'true' || isFeatured === true,
    });

    console.log('✅ Product created:', product._id);
    res.status(201).json(product);
  } catch (error) {
    console.error('❌ Create product error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const { 
      name, 
      description, 
      price, 
      discountPrice, 
      category, 
      brand, 
      stock, 
      isFeatured 
    } = req.body;

    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.discountPrice = discountPrice || product.discountPrice;
    product.category = category || product.category;
    product.brand = brand || product.brand;
    product.stock = stock || product.stock;
    product.isFeatured = isFeatured !== undefined ? isFeatured : product.isFeatured;

    if (req.files && req.files.length > 0) {
      for (const imageUrl of product.images) {
        try {
          const publicId = imageUrl.split('/').pop().split('.')[0];
          await cloudinary.uploader.destroy(`ecommerce/products/${publicId}`);
          console.log(`🗑️ Deleted: ${publicId}`);
        } catch (err) {
          console.error('Error deleting old image:', err);
        }
      }
      let newImageUrls = [];
      
      for (const file of req.files) {
        try {
          const result = await uploadToCloudinary(file.buffer, 'ecommerce/products');
          newImageUrls.push(result.secure_url);
        } catch (uploadError) {
          console.error('Upload error:', uploadError);
          return res.status(500).json({ 
            message: `Failed to upload image: ${file.originalname}` 
          });
        }
      }
      
      product.images = newImageUrls;
    }

    await product.save();
    console.log('✅ Product updated:', product._id);
    res.json(product);
  } catch (error) {
    console.error('❌ Update product error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    for (const imageUrl of product.images) {
      try {
        const publicId = imageUrl.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`ecommerce/products/${publicId}`);
        console.log(`🗑️ Deleted: ${publicId}`);
      } catch (err) {
        console.error('Error deleting image:', err);
      }
    }

    await product.deleteOne();
    console.log('✅ Product deleted:', product._id);
    res.json({ message: 'Product removed' });
  } catch (error) {
    console.error('❌ Delete product error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const addReview = async (req, res) => {
  try {
    const { rating, comment } = req.body;
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const alreadyReviewed = product.reviews.find(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
      return res.status(400).json({ message: 'Product already reviewed' });
    }

    const review = {
      user: req.user._id,
      rating: Number(rating),
      comment,
    };

    product.reviews.push(review);
    await product.updateRating();

    res.status(201).json({ message: 'Review added' });
  } catch (error) {
    console.error('Add review error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    const reviewIndex = product.reviews.findIndex(
      (r) => r.user.toString() === req.user._id.toString()
    );

    if (reviewIndex === -1) {
      return res.status(404).json({ message: 'Review not found' });
    }

    product.reviews.splice(reviewIndex, 1);
    await product.updateRating();

    res.json({ message: 'Review deleted' });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ message: error.message });
  }
};
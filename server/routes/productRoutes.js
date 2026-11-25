const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const Product = require("../models/product");

// Upload folder path
const uploadDir = path.resolve(__dirname, "../uploads");

// Create uploads folder only if it does not exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1E9);

        cb(null, uniqueName + path.extname(file.originalname));
    }
});

// Image upload validation
const upload = multer({
    storage: storage,

    limits: {
        fileSize: 3 * 1024 * 1024
    },

    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed!"));
        }
    }
});

// Add a new product with image
router.post("/add", (req, res) => {

    upload.single("image")(req, res, async (error) => {

        if (error) {
            console.error("Multer upload error:", error);

            return res.status(400).json({
                message: error.message
            });
        }

        try {
            const {
                name,
                description,
                price,
                category,
                condition,
                listingType,
                seller
            } = req.body;

            if (!name || !description || !category || !seller) {
                return res.status(400).json({
                    message: "Please fill all required fields."
                });
            }

            const product = new Product({
                name,
                description,
                price: Number(price) || 0,
                category,
                condition,
                listingType,
                seller,
                image: req.file
                    ? `/uploads/${req.file.filename}`
                    : ""
            });

            await product.save();

            return res.status(201).json({
                message: "Product added successfully!",
                product
            });

        } catch (error) {
            console.error("Product save error:", error);

            // Remove uploaded image if product saving fails
            if (req.file) {
                const filePath = path.join(uploadDir, req.file.filename);

                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
            }

            return res.status(500).json({
                message: error.message
            });
        }
    });
});

// Get all products
router.get("/", async (req, res) => {
    try {
        const products = await Product.find()
            .populate("seller", "fullName email");

        return res.status(200).json(products);

    } catch (error) {
        console.error("Fetch products error:", error);

        return res.status(500).json({
            message: error.message
        });
    }
});

// Delete a product
router.delete("/:id", async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);

        if (!product) {
            return res.status(404).json({
                message: "Product not found"
            });
        }

        // Delete the associated image
        if (product.image) {
            const imagePath = path.join(
                uploadDir,
                path.basename(product.image)
            );

            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }

        return res.status(200).json({
            message: "Product deleted successfully!"
        });

    } catch (error) {
        console.error("Delete product error:", error);

        return res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;
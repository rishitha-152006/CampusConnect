const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");

const Product = require("../models/product");

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, "../uploads"));
    },

    filename: (req, file, cb) => {
        const uniqueName =
            Date.now() + "-" + Math.round(Math.random() * 1E9);

        cb(null, uniqueName + path.extname(file.originalname));
    }
});

// Image validation
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
router.post("/add", upload.single("image"), async (req, res) => {
    try {
        const product = new Product({
            ...req.body,
            image: req.file
                ? `/uploads/${req.file.filename}`
                : ""
        });

        await product.save();

        res.status(201).json({
            message: "Product added successfully",
            product
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

// Get all products
router.get("/", async (req, res) => {
    try {
        const products = await Product.find()
            .populate("seller", "fullName email");

        res.status(200).json(products);

    } catch (error) {
        res.status(500).json({
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

        res.json({
            message: "Product deleted successfully"
        });

    } catch (error) {
        res.status(500).json({
            message: error.message
        });
    }
});

module.exports = router;
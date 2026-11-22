const User = require("../models/User");
const bcrypt = require("bcryptjs");

// Student Registration
const registerUser = async (req, res) => {
    try {
        const {
            fullName,
            studentId,
            email,
            password,
            department,
            year
        } = req.body;

        if (
            !fullName ||
            !studentId ||
            !email ||
            !password ||
            !department ||
            !year
        ) {
            return res.status(400).json({
                message: "Please fill all fields"
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase().trim() },
                { studentId: studentId.trim() }
            ]
        });

        if (existingUser) {
            return res.status(400).json({
                message: "Email or Student ID already exists"
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            fullName,
            studentId,
            email: email.toLowerCase().trim(),
            password: hashedPassword,
            department,
            year
        });

        await newUser.save();

        res.status(201).json({
            message: "Registration successful!"
        });

    } catch (error) {
        res.status(500).json({
            message: "Registration failed",
            error: error.message
        });
    }
};

// Student Login
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Please enter email and password"
            });
        }

        const user = await User.findOne({
            email: email.toLowerCase().trim()
        });

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(
            password,
            user.password
        );

        if (!isMatch) {
            return res.status(401).json({
                message: "Invalid password"
            });
        }

        res.status(200).json({
            message: "Login successful!",
            user: {
                _id: user._id,
                fullName: user.fullName,
                studentId: user.studentId,
                email: user.email,
                department: user.department,
                year: user.year
            }
        });

    } catch (error) {
        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};

module.exports = {
    registerUser,
    loginUser
};
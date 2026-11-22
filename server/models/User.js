const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true
    },

    studentId: {
        type: String,
        required: true,
        unique: true
    },

    email: {
        type: String,
        required: true,
        unique: true
    },

    password: {
        type: String,
        required: true
    },

    department: {
        type: String,
        required: true
    },

    year: {
        type: String,
        required: true
    }

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);
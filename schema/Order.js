const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
    },
    orderDate: {
        type: Date,
        required: true,
    },
    orderStatus: {
        type: String,
        required: true,
    },
    orderItems: {
        type: Array,
        required: true,
    },
    totalAmount: {
        type: Number,
        required: true,
    },
    customerNumber: {
        type: Number,
        required: true,
    }
},{timestamps : true});

const Order = mongoose.model("Order", OrderSchema);
module.exports = Order; 
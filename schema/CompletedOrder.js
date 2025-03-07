const mongoose = require("mongoose");

const CompletedOrderSchema = new mongoose.Schema({
    customerName: {
        type: String,
        
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
        
    },
    completionDate: {
        type: Date,
        
    }
},{timestamps : true});

const CompletedOrder = mongoose.model("CompletedOrder", CompletedOrderSchema);
module.exports = CompletedOrder;

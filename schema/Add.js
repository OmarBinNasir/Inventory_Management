const mongoose = require("mongoose"); 

const Inventory = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
    },
    company: {
        type: String,
        
    },
    unitPrice: {
        type: Number,
        required: true,
    },
    unitsInBox: {
        type: Number,
    },
    boxPrice: {
        type: Number,
    },
    image : [],
    category : {
        type : String,
        
    }

},{timestamps : true});

const InventoryModel = mongoose.model("Inventory", Inventory);
// how to export this function
module.exports = InventoryModel;
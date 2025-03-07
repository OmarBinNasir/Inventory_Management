const express = require("express");
const Order = require("../schema/Order");
const router = express.Router();

router.post("/new-order", async (req, res) => {
    try {
        
        const { customerName, orderDate, orderStatus, orderItems, totalAmount, customerNumber } = req.body;
        console.log(req.body)
        const newOrder = new Order({ customerName, orderDate, orderStatus, orderItems, totalAmount, customerNumber });
        await newOrder.save();
        console.log(newOrder)
        res.status(201).json({ newOrder : newOrder,message : "Order placed" });
    } catch (error) {
        console.error("Error creating new order", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/", async (req,res) => {
    try {
        const orders = await Order.find({orderStatus : "pending"}).sort({createdAt : -1})
        return res.status(200).json(orders)
    } catch (error) {
        return res.status(500).json({message : "internal server error"})
    }
})
router.delete("/:orderId", async (req,res) => {
    try {
        const orderId = req.params.orderId
        const order = await Order.findByIdAndDelete(orderId)
        return res.status(200).json({message : "order was deleted", order : order})
    } catch (error) {
        return res.status(500).json({message : "internal server error"})
    }
} )
module.exports = router;
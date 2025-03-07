const express = require("express");
const CompletedOrder = require("../schema/CompletedOrder");
const router = express.Router();

router.post("/", async (req, res) => {
    try {
        console.log(req.body)
        const { customerName, orderDate, orderItems, totalAmount, customerNumber, completionDate } = req.body;
        const newCompletedOrder = new CompletedOrder({ customerName, orderDate, orderStatus : "completed", orderItems, totalAmount, customerNumber, completionDate });
        await newCompletedOrder.save();
        res.status(201).json(newCompletedOrder);
    } catch (error) {
        console.error("Error creating completed order", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.get("/", async (req, res) => {
    try {
        const completedOrders = await CompletedOrder.find();
        res.status(200).json(completedOrders);
    } catch (error) {
        console.error("Error getting completed orders", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

// /videos?page=2&limit=5&query=tutorial&sortBy=createdAt&sortType=asc&userId=605c72aef1d1c234567890ab

router.get("/orders", async (req,res) =>{
    let { page = 1, limit = 10, query, sortBy = "createdAt", sortType = "dsc", startDate, endDate, orderId, filter, name, number } = req.query;
    try {
        
        const filters = {}
        if( startDate && endDate && startDate !== endDate){
            startDate = new Date(startDate)
            endDate = new Date(endDate)
            filters.orderDate = {
                $gte : startDate, $lte : endDate
            }
        }


        if(orderId.length){
            filters._id = new ObjectId(orderId)
        }
        if(filter.length){
            filters.orderStatus = filter
        }
        if(name.length){
            filters.customerName = { $regex : name, $options : "i" }  
        }
        if(number){
            filters.customerNumber = Number(number)
        }
        const sortOptions = {}
        sortOptions[sortBy] = sortType === 'asc' ? 1 : -1;

        const orders = await CompletedOrder.find(filters).sort(sortOptions).skip((Number(page)-1)*limit).limit(limit)
        const countOrders = await CompletedOrder.find(filters).countDocuments()
        return res.status(200).json({ordersList : orders, count : countOrders})
    } catch (error) {
        res.status(500).json({ message: "Internal server error" + error.message,  });
    }
})
module.exports = router;

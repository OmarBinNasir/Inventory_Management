const express = require("express");
const router = express.Router();
const InventoryModel = require("../schema/Add");



router.post("/add", async (req, res) => {
    try {
        const { name, description, company, unitPrice, unitsInBox, boxPrice, image, category = "meal" } = req.body;
        const existing = await InventoryModel.findOne({name : name})
        console.log("existing",existing)

        if(existing._id){
            return res.status(500).json({message:"Product already exists...."})
        }

        const newInventory = new InventoryModel({ name, description, company, unitPrice, unitsInBox, boxPrice, image, category });
        await newInventory.save();
        res.status(201).json(newInventory);
    } catch (error) {
        console.error("Error adding new inventory", error.message);
        res.status(500).json({ message: "Error adding new inventory" });
    }
});

router.get("/", async (req, res) => {
    try {
        const {category} = req.query
        const filter = {}
        if(category?.length)
            filter.category = category 
        const inventory = await InventoryModel.find(filter);
        res.status(200).json(inventory);
    } catch (error) {
        console.error("Error getting inventory", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
});

router.put("/update", async (req,res) => {
    try{
        const {_id, ...updateFields} = req.body
        const updatedProduct = await InventoryModel.findByIdAndUpdate(_id,{
            $set : updateFields
        } , {new:true});
        res.status(200).json(updatedProduct)
    }catch(error){
        console.error("Error getting inventory", error.message);
        res.status(500).json({ message: "Internal server error" });
    }
})

router.delete("/:id", async (req, res) => {
    try {
        const id = req.params.id
        const deleted = await InventoryModel.findByIdAndDelete(id)
         res.status(200).json({message : "deleted", item : deleted})
    } catch (error) {
         res.status(500).json({message : "item was not deleted"})
    }
})


module.exports = router;

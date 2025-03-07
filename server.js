const express = require("express"); 
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
require("dotenv").config();
const cors = require("cors");

// importing the routes 
const inventoryRoutes = require("./routes/inventory");
const {router} = require("./routes/user");
const newOrder = require("./routes/newOrder");
const completedOrderRoutes = require("./routes/completedOrder");
const cookieParser = require("cookie-parser");

const PORT = process.env.PORT || 6000;
const app = express();

app.use(cors({
    origin:process.env.CORS_ORIGIN,
    credentials:true
}))
app.use(cookieParser())
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const connectToDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log("Connected to database");
    } catch (error) {
        console.log("Error connecting to database", error);
    }
};

connectToDatabase();

app.use("/inventory", inventoryRoutes);
app.use("/user", router);
app.use("/order", newOrder);
app.use("/completed-order", completedOrderRoutes);

app.listen(PORT, () => {
    console.log(`Server running on port http://localhost:${PORT}`);
});
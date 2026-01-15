const mongoose = require('mongoose');

async function connectDB(){
    try {
        if(!process.env.MONGO_URI){
            console.error('MONGO_URI is not set in .env');
            process.exit(1);
        }
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected");
        
    } catch (err) {
        console.error("MongoDB connnection error", err.message);
        process.exit(1);
    }
}

module.exports = connectDB;
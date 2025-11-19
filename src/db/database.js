import mongoose from "mongoose";

const connectDB = async() => {
    try {
       await mongoose.connect(process.env.MONGO_URI);
       console.log('MongoDb connected successfully');
    } catch(error) {
        console.error('MongoDb connection failed:', error.message);
        process.exit(1);
    }
}

export default connectDB;
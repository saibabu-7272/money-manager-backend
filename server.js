const express = require('express');
const { ObjectId, MongoClient } = require('mongodb');
const cors = require('cors');
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const app = express();

require('dotenv').config();


app.use(express.json());
app.use(cors());


let client;
const initializeDBAndServer = async () => {
    // Replace 'username' and 'password' with your MongoDB Atlas username and password
    const username = encodeURIComponent(process.env.MONGO_USER);
    const password = encodeURIComponent(process.env.MONGO_PASS);

    // Replace this URI with your Node JS MongoDB connection URI obtained from MongoDB 
    const uri = `mongodb+srv://${username}:${password}@cluster0.yqd3ckv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

    client = new MongoClient(uri);

    try {
        await client.connect();
        console.log("Connected to MongoDB.....");
        app.listen(3000, () => {
            console.log('Server running on port: 3000');
        });
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};

initializeDBAndServer();


// Middleware to authenticate JWT token
const authenticateToken = (request, response, next) => {
    let jwtToken;
    const authHeader = request.headers["authorization"];
    if (authHeader !== undefined) {
        jwtToken = authHeader.split(" ")[1];
    }
    if (jwtToken === undefined) {
        response.status(401);
        response.send("Invalid JWT Token 1");
    } else {
        jwt.verify(jwtToken, process.env.JWT_SECRET, async (error, payload) => {
            if (error) {
                response.status(401);
                response.send({ "Invalid JWT Token 2": error });
            } else {
                request.userId = payload.userId;
                next();
            }
        });
    }
};




// Endpoint to register a new user
app.post('/register', async (request, response) => {
    try {
        // Replace 'database' with your database name and 'collection' with your collection name
        const collection = client.db(process.env.DB_NAME).collection(process.env.USERS_COLLECTION);
        const userDetails = request.body; 
        const { email } = userDetails;
        const isUserExist = await collection.find({ email }).toArray();
        if (isUserExist.length === 0) {
            const hashedPassword = await bcrypt.hash(userDetails.password, 10);
            userDetails.password = hashedPassword;
            const newUserDetails = {
                email : userDetails.email,
                password : userDetails.password,
                money : 0
            }
            const result = await collection.insertOne(newUserDetails);
            response.status(200)
            response.send({ yourId: result.insertedId, message: "User registered successfuly" });
        } else {
            response.status(401);
            response.send({ errorMsg: 'User with this Email ID already exists' })
        }
    } catch (error) {
        response.status(500)
        response.send({ "Internal server error:": error });
    }
});


// Endpoint to log in a user
app.post('/login', async (request, response) => {
    try {
        // Replace 'database' with your database name and 'collection' with your collection name
        const collection = client.db(process.env.DB_NAME).collection(process.env.USERS_COLLECTION); 
        const userDetails = request.body;
        const { email, password } = userDetails;
        const isUserExist = await collection.findOne({ email });
        if (!isUserExist) {
            response.status(401)
            response.send({ errorMsg: "User with this Email ID doesn't exist" });
            return;
        }
        const isPasswordMatched = await bcrypt.compare(password, isUserExist.password);
        if (isPasswordMatched) {
            // Replace 'MY_SECRET_TOKEN' with your JWT secret key
            const token = jwt.sign({ userId: isUserExist._id }, process.env.JWT_SECRET,{ expiresIn: '100h' });
            response.status(200)
            response.send({ jwtToken: token, userId: isUserExist._id });
        } else {
            response.status(401)
            response.send({ errorMsg: "Incorrect password" });
        }
    } catch (error) {
        response.status(500)
        response.send({ "Internal server error:": error });
    }
});

// Endpoint to get user data by userId
app.get('/getUserData/:userId', authenticateToken, async (request, response) => {
    try {
        // Replace 'database' with your database name and 'collection' with your collection name
        const collection = client.db(process.env.DB_NAME).collection(process.env.USERS_COLLECTION); 
        const { userId } = request.params;
        const result = await collection.findOne(new ObjectId(userId));
        response.status(200)
        response.send(result);
    } catch (error) {
        response.status(500)
        response.send({ "Internal server error:": error });
    }
});






app.post('/add-transaction',authenticateToken, async (request, response) => {
    try {
        const collection = client.db(process.env.DB_NAME).collection(process.env.DATA_COLLECTION);
        const userCollection = client.db(process.env.DB_NAME).collection(process.env.USERS_COLLECTION); 
        // Through request we get title, amount, type, objectID of user
        const reqData = request.body;
        const transactionDetails = {
            title : reqData.title,
            type : reqData.type,
            amount : reqData.amount,
            date : new Date(),
            user_id : new ObjectId(`${reqData.userId}`)
        };
        const result = await collection.insertOne(transactionDetails);
        const existUserData = await userCollection.findOne({_id : new ObjectId(`${reqData.userId}`)})

        const updatedMoney = reqData.type === "income" ? existUserData.money + reqData.amount : existUserData.money - reqData.amount;

        await userCollection.updateOne({_id : new ObjectId(`${reqData.userId}`)},{$set : {money : updatedMoney}})      
        
        response.status(200)
        response.send({ transactionId: result.insertedId, message: "Transaction added successfuly" });
       
    } catch (error) {
        response.status(500)
        response.send({ "Internal server error:": error.message });
    }
});



app.post('/',authenticateToken, async (request, response) => {
    try {
        const collection = client.db(process.env.DB_NAME).collection(process.env.DATA_COLLECTION); 
        const {userId} = request.body;

        const result = await collection.find({ user_id : new ObjectId(`${userId}`)}).toArray();
        
        response.status(200)

        response.send(result);
    } catch (error) {
        response.status(500)
        response.send({ "Internal server error:": error.message });
    }
});






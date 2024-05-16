const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const cookieParser = require('cookie-parser');

const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()
const app = express();
const port = process.env.PORT || 5000;

// middleware///////////////////////////////////////////////////////////////////
app.use(cors({
  origin: [ "http://localhost:5173",'https://doctors-of-car.firebaseapp.com', 
   'https://doctors-of-car.web.app'   ],
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

//// second   Middleware/////////////////////////////////////////////////////////
const verifyToken = async (req, res, next) => {
  const token = req.cookies?.token;
  console.log(token)
  if (!token) {
      return res.status(401).send({ message: 'unauthorized  access' })
  }
  jwt.verify(token, process.env.ACCESS_TOKEN, (err, decoded) => {
      if (err) {
      return res.status(401).send({ message: 'unauthorized access' })
      
      }
      req.user = decoded;
      next();
  })
}
////////////////////////////////////////////////////////////////////////

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.ldjypij.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {client
         const serviceCollection =client.db("tourDB").collection("Services");
         const BookingCollection =client.db("tourDB").collection("Booking");
   
   
  //////////////// Auth  reletd api///////////////////////////////////////////////////
    app.post('/jwt', async (req, res) => {
      const result = req.body;
      console.log(result, "email")
      const token = jwt.sign(result, process.env.ACCESS_TOKEN, { expiresIn: '1h' });

      res
      .cookie('token', token, {
        httpOnly: true,
        secure:true,
        sameSite:"none"
    })
      .send({success : true});

  })
  app.post('/logout', async (req, res) => {
    const user = req.body;
    console.log('logging out', user);
    res.clearCookie('token', { maxAge: 0 }).send({ success: true })
})


    //services API /////////////////////////////////////////////////////////////////////
    app.get('/services', async (req, res) => {
        const cursor = serviceCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    }) 
       
    app.get('/book/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) };
            const options = {
                projection: { title: 1, price: 1, service_id: 1, img: 1 },
            };

            const result = await serviceCollection.findOne(query,options);
        res.send(result);
    }) 

    //////////////////////// /////////////// Booking Apis//////////////////
    app.post('/booking', async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await BookingCollection.insertOne(booking);
      res.send(result);
  });
  // get Some  Data
  app.get('/booking',verifyToken, async (req, res) => {
    console.log(req.query.email);
    if(req.user.email !== req.query.email){
      return res.status(403).send({message: 'forbidden access'})
  }

    let query = {};
    if (req.query?.email) {
        query = { email: req.query.email }
    }
    const result = await BookingCollection.find(query).toArray();
    res.send(result);
})

  // delete
  app.delete('/booking/:id', async (req, res) => {
    const id = req.params.id;
    const query = { _id: new ObjectId(id) }
    const result = await BookingCollection.deleteOne(query);
    res.send(result);
})


///////////////////////////////////////////////////////////////
  
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

  }
}
run().catch(console.dir);
app.get('/', (req, res) => {
    res.send('doctor is running')
})

app.listen(port, () => {
    console.log(`Car Doctor Server is running on port ${port}`)
})
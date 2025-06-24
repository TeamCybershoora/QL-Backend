const express = require('express');
const app = express();
const cors = require('cors');
const connect = require('./lib/connection');
const user = require('./routes/user');
const business = require('./routes/business');
const accounts = require('./routes/accounts');  
const person = require('./routes/person');
const PORT = process.env.PORT ; 

connect();

app.use(cors({
  origin: 'http://localhost:3000',  
  credentials: true,                 
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(user);
app.use(business);
app.use(accounts);
app.use(person);

app.listen(3002, (err) => {
  if (err) {
    console.log(err);
  } else {
    console.log(`server is running on ${PORT}`);
  }
});

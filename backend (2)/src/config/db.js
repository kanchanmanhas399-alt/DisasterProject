// 1. Load environment variables at the very top of your application
require('dotenv').config();

const mongoose = require('mongoose');

// 2. Reference the variable using process.env
const dbURI =  "mongodb://kanchanmanhas399_db_user:WCvB0HSVsYGHzSeh@ac-ppl1xt3-shard-00-00.avgrkqh.mongodb.net:27017,ac-ppl1xt3-shard-00-01.avgrkqh.mongodb.net:27017,ac-ppl1xt3-shard-00-02.avgrkqh.mongodb.net:27017/alert?ssl=true&replicaSet=atlas-x3k8id-shard-0&authSource=admin";
console.log(dbURI);
mongodb://kanchanmanhas399_db_user:WCvB0HSVsYGHzSeh@ac-ppl1xt3-shard-00-00.avgrkqh.mongodb.net:27017,ac-ppl1xt3-shard-00-01.avgrkqh.mongodb.net:27017,ac-ppl1xt3-shard-00-02.avgrkqh.mongodb.net:27017/?ssl=true&replicaSet=atlas-x3k8id-shard-0&authSource=admin

mongoose.connect(dbURI)
  .then(() => {
    console.log('Successfully connected to MongoDB.');
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error.message);
  });

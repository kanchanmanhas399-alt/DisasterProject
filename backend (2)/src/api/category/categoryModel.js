const mongoose = require("mongoose")

const categorySchema = new mongoose.Schema({
    autoId: {
        type: "String",
        default:null
    },
    name:{
        type:"String",
        default:null
    },
    description:{
        type:"String",
        default:null
    },
    image:{
        type:"String",
        default:null
    },
    isDelete:{
        type:Boolean,
        default:false

    },
    status:{
        type:Boolean,
        default:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    }
})

module.exports =  mongoose.model("categories" , categorySchema)
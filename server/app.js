import express from "express"
import PaperGenerator from "../services/GenerationServics.js";
import {db} from "../config/dbconnection.js";


const port = 3000;
const app=express();
app.use(express.json()); 


app.get('/generatepaper',PaperGenerator.generatePaper);


//checking sever on or down
app.get('/',(req,res)=>{
    res.send("HELLO");
})

//connect with server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
import express from "express";
import PaperGenerator from "../services/GenerationServics.js";
import { db } from "../config/dbconnection.js";


const PORT = process.env.PORT || 3000; 
const app = express();

app.use(express.json());

app.get('/generatepaper', PaperGenerator.generatePaper);

// Checking if the server is up or down
app.get('/', (req, res) => {
    res.send("HELLO");
});

// Connect with the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

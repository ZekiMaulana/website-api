import express from "express"
import axios from "axios"
import bodyParser from "body-parser"

const app = express();
const port = 3000;

app.use(express.static("public"))

app.get("/", async (req, res) => {

    res.render("index.ejs");

});

app.listen(port, () => {
    console.log(`Server is running in port ${port}`);
})
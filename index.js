import express from "express"
import axios from "axios"
import bodyParser from "body-parser"

const app = express();
const port = 3000;
const API_URL = "https://api.jikan.moe/v4/"

app.use(express.static("public"))

app.get("/", async (req, res) => {
    try {
        const params = { filter: "airing", limit: 24};
        const result = await axios(API_URL + "top/anime", {params: params});
        const data = []
        
        // for (var i = 0; i < result.data.length; i++){
        //     const anime = {
        //         title: result.data[i].title_english,
        //         img: result.data[i].images.jpg.large_image_url
        //     }

        // }
        res.render("index.ejs", {content: result.data})
    } catch (error) {
        console.error("Failed to make request:", error.message);
        res.render("index.ejs", { error: error.message });
    }
});

app.get("/anime", async (req, res) => {
    res.render("content.ejs")
})

app.get("/category", async (req, res) => {
    switch(req.query.type){
        case "genre":
            try {
                const params = { filter: "genres"};
                const result = await axios(API_URL + "genres/anime", {params: params});
                
                res.render("category.ejs", {genres: result.data})
            }catch (error) {
                console.error("Failed to make request:", error.message);
                res.render("category.ejs", { error: error.message });
            }
            break;
        case "release-year":
            const result = [];
            for(var i = 1980; i < 2026; i++){ result.push(i)};
            console.log(result)
            
            res.render("category.ejs", {years: result})
            break;
        default:
            break;
    }
    res.render("category.ejs");
});

app.get("/search", async (req, res) => {
    res.render("search.ejs");
})
app.listen(port, () => {
    console.log(`Server is running in port ${port}`);
});
import express from "express"
import axios from "axios"
import bodyParser from "body-parser"

const app = express();
const port = 3000;
const API_URL = "https://api.jikan.moe/v4/"

app.use(express.static("public"))




app.get("/", async (req, res) => {
    try {
        const paramsTopAired = { filter: "airing", limit: 21, type: "tv"};
        const resultTopAired = await axios(API_URL + "top/anime", {params: paramsTopAired});

        const paramsGenres = { filter: "genres"};
        const resultGenres = await axios(API_URL + "genres/anime", {params: paramsGenres});


        const resultChar = await axios(API_URL + "top/characters");
        

        res.render("index.ejs", {content: resultTopAired.data, category: resultGenres.data, characters: resultChar.data});
    } catch (error) {
        console.error("Failed to make request:", error.message);
        res.render("index.ejs", { error: error.message });
    }
});

app.get("/anime", async (req, res) => {
    try {
        const animeId = req.query.animeId;
        const result = await axios.get(API_URL + "anime/" + animeId);
        console.log(result.data.data.title_english);
        res.render("content.ejs", {content: result.data})
    } catch(error) {
        res.render("content.ejs", { error: error.message })
    }
});

app.get("/category", async (req, res) => {
    switch(req.query.type){
        case "genre":
            try {
                const resultChar = await axios(API_URL + "top/characters");

                const params = { filter: "genres"};
                const result = await axios(API_URL + "genres/anime", {params: params});

                const paramsE = { filter: "explicit_genres"};
                const resultE = await axios(API_URL + "genres/anime", {params: paramsE});
                
                res.render("category.ejs", {category: result.data, characters: resultChar.data, categoryE: resultE.data});
            }catch (error) {
                console.error("Failed to make request:", error.message);
                res.render("category.ejs", { error: error.message });
            }
            break;
        case "release-year":
            try {
                const resultChar = await axios(API_URL + "top/characters");
                const result = await axios(API_URL + "seasons");
                const params = { filter: "genres"};
                const resultGenres = await axios(API_URL + "genres/anime", {params: params});
                
                res.render("category.ejs", {years: result.data, category: resultGenres.data, characters: resultChar.data})
            } catch(error) {
                console.error("Failed to make request:", error.message);
                res.render("category.ejs", { error: error.message });
            }
            break;
        default:
            break;
    }
});

app.post("/search", async (req, res) => {
    try {
        const params = {}
    }catch(error) {
        res.render("search.ejs", {error: error.message})
    }
    res.render("search.ejs");
})
app.listen(port, () => {
    console.log(`Server is running in port ${port}`);
});
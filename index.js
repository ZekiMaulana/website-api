import express from "express"
import axios from "axios"
import fs from "fs";
import bodyParser from "body-parser"
import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const port = 3000;
const API_URL = "https://api.jikan.moe/v4/"

app.use(express.static("public"))
app.use(bodyParser.urlencoded({ extended: true }));

function saveJson(data, fileName){
    fs.writeFile(__dirname + "/public/dataJSON/"+ fileName +".json", JSON.stringify(data), (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });
}

function readJson(fileName) {
    const file = fs.readFileSync(__dirname + "/public/dataJSON/" + fileName + ".json", "utf8");

    return JSON.parse(file)
}

const resultTopAired = readJson("topAiredTv");
const resultTopAiredMovie = readJson("topAiredMovie");
const resultGenres = readJson("genres")
const resultExplicitGenres = readJson("explicit_genres")
const resultChar = readJson("topCharacters")
const seasonsList = readJson("seasonsList")
const resultTopAnime = readJson("topAnime")
const resultTopUpcoming = readJson("topUpcoming")

app.get("/", async (req, res) => {
    try {

        // use public api

        // const paramsTopAired = { filter: "airing", type: "tv"};
        // const resultTopAired = await axios(API_URL + "top/anime", {params: paramsTopAired});

        // const paramsTopAiredMovie = { type: "movie"};
        // const resultTopAiredMovie = await axios(API_URL + "top/anime", {params: paramsTopAiredMovie});

        // const paramsTopUpcoming = { filter: "upcoming"};
        // const resultTopUpcoming = await axios(API_URL + "top/anime", {params: paramsTopUpcoming});

        // const paramsTopAnime = { type: "tv"};
        // const resultTopAnime = await axios(API_URL + "top/anime", {params: paramsTopAnime});
        
        // res.render("index.ejs", {content: resultTopAired.data,  characters: resultChar movie: resultTopAiredMovie.data, top: resultTopAnime.data});

        // use dataJSON
              
        res.render("index.ejs", {content: resultTopAired, characters: resultChar, movie: resultTopAiredMovie, top: resultTopAnime, upcoming: resultTopUpcoming});

    } catch (error) {
        console.error("Failed to make request:", error.message);
        res.render("index.ejs", { error: error.message });
    }
});

app.get("/anime", async (req, res) => {
    try {
        const animeId = req.query.animeId;
        const result = await axios.get(API_URL + "anime/" + animeId + "/full");
        const resultEpisodes = await axios.get(API_URL + "anime/" + animeId + "/episodes");
        
        res.render("content.ejs", {content: result.data, characters: resultChar, episodes: resultEpisodes.data})
    } catch(error) {
        res.render("content.ejs", { error: error.message })
    }
});

app.get("/category", async (req, res) => {
    switch(req.query.type){
        case "genre":
            try {
                
                res.render("category.ejs", {category: resultGenres, characters: resultChar, categoryE: resultExplicitGenres});
            }catch (error) {
                console.error("Failed to make request:", error.message);
                res.render("category.ejs", { error: error.message });
            }
            break;
        case "release-year":
            try {
                
                res.render("category.ejs", {years: seasonsList, characters: resultChar})
            } catch(error) {
                console.error("Failed to make request:", error.message);
                res.render("category.ejs", { error: error.message });
            }
            break;
        default:
            break;
    }
});

app.get("/search/genres", async (req, res) => {
    try {
        const genreId = req.query.genreId
        const params = {order_by: "score", sort: "desc", genres: genreId, page: 2 }
        const result = await axios.get(API_URL + "anime", {params: params})

        res.render("search.ejs", {content: result.data, characters: resultChar})
    }catch(error) {
        res.render("search.ejs", {error: error.message})
    }
})

app.post("/search", async(req, res) => {
    try {
        const genreId = req.body.genreId
        console.log(req.body.genreId)
        res.locals.nameGenre = req.body.name
        res.locals.year = req.body.year
        var start_date = ""
        var end_date = ""
        var genreX = 12
        if (req.body.year){
        start_date = req.body.year + "-01-01"
        end_date = (req.body.year) + "-12-31"
        console.log(end_date)
        }
        if (genreId == 12){
            genreX = 0
        }
        const params = {order_by: "score", sort: "desc", genres: genreId, genres_exclude: genreX,  start_date: start_date, end_date: end_date, page: 2 }
        const result = await axios.get(API_URL + "anime", {params: params})

        res.render("search.ejs", {content: result.data, characters: resultChar})
    }catch(error) {
        res.render("search.ejs", {error: error.message})
    }

})
app.listen(port, () => {
    console.log(`Server is running in port ${port}`);
});
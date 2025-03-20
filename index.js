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

// use data JSON local
const resultGenres = readJson("genres")
const resultExplicitGenres = readJson("explicit_genres")
const resultChar = readJson("topCharacters")
const seasonsList = readJson("seasonsList")

const resultTopAired = readJson("TopAiredTv")
const resultTopAiredMovie = readJson("TopAiredMovie")
const resultTopUpcoming = readJson("TopUpcoming")
const resultTopAnime = readJson("TopAnime")



app.get("/", async (req, res) => {
    try {

        // use public api

        // const paramsTopAired = { filter: "airing", type: "tv"};
        // const resultTopAired = await axios.get(API_URL + "top/anime", {params: paramsTopAired});

        // const paramsTopAiredMovie = { type: "movie"};
        // const resultTopAiredMovie = await axios.get(API_URL + "top/anime", {params: paramsTopAiredMovie});

        // const paramsTopUpcoming = { filter: "upcoming"};
        // const resultTopUpcoming = await axios.get(API_URL + "top/anime", {params: paramsTopUpcoming});

        
        // const resultTopAnime = await axios.get(API_URL + "top/anime");
        
        res.render("index.ejs", {
            content: resultTopAired,  
            characters: resultChar, 
            movie: resultTopAiredMovie, 
            top: resultTopAnime, 
            upcoming: resultTopUpcoming});

        
              

    } catch (error) {
        console.error("Failed to make request:", error.message);
        console.error(error.status);
        var message = ""
        if (error.status === 429){
            message = "Wait a minute, Too much Request";
        }
        res.render("error.ejs", { error: message });
    }
});

app.get("/anime", async (req, res) => {
    try {
        const animeId = req.query.animeId;
        const result = await axios.get(API_URL + "anime/" + animeId + "/full");
        const resultEpisodes = await axios.get(API_URL + "anime/" + animeId + "/episodes");
        
        res.render("content.ejs", {content: result.data, characters: resultChar, episodes: resultEpisodes.data})
    } catch(error) {
        res.render("error.ejs", { error: error.message })
    }
});

app.get("/category", async (req, res) => {
    switch(req.query.type){
        case "genre":
            try {
                
                res.render("category.ejs", {category: resultGenres, characters: resultChar, categoryE: resultExplicitGenres});
            }catch (error) {
                console.error("Failed to make request:", error.message);
                res.render("error.ejs", { error: error.message });
            }
            break;
        case "release-year":
            try {
                
                res.render("category.ejs", {years: seasonsList, characters: resultChar})
            } catch(error) {
                console.error("Failed to make request:", error.message);
                res.render("error.ejs", { error: error.message });
            }
            break;
        default:
            break;
    }
});



app.get("/search/:anime", async (req, res) => {
    try {
        var result1 = {}
        var result2 = {}
        var params1 = {}
        var params2 = {}
        
        res.locals.anime = req.params.anime

        if(req.params.anime === "top"){
            params1 = {
                filter: req.query.filter, 
                type: req.query.type,
                page: 1,    
                limit: 21, 
            }
            params2 = {
                filter: req.query.filter, 
                type: req.query.type,
                page: 2,     
                limit: 21,
            }

            res.locals.filter = req.query.filter
            
            res.locals.type = req.query.type

            res.locals.name = "Top Anime"
            if(req.query.filter){
                res.locals.name = "Top " + req.query.filter
            }
            
            result1 = await axios.get(API_URL + "top/anime", {params: params1});
            result2 = await axios.get(API_URL + "top/anime", {params: params2});

            
        } else if (req.params.anime === "category"){

            var start_date = ""
            var end_date = ""
            
            if(req.query.year){
                res.locals.year = req.query.year
                start_date = req.query.year + "-01-01"
                end_date = (req.query.year) + "-12-31"
                console.log(end_date + " | " + start_date)
            }

            params1 = {
                order_by: "start_date", 
                sort: "desc", 
                genres: req.query.genresId,
                type: req.query.type,
                start_date: start_date, 
                end_date: end_date, 
                page: 1,
                limit: 21,
            }

            params2 = {
                order_by: "start_date", 
                sort: "desc", 
                genres: req.query.genresId,
                type: req.query.type, 
                start_date: start_date, 
                end_date: end_date, 
                page: 2,
                limit: 21,
            }
            
            res.locals.name = req.query.genresName
            res.locals.genreId = req.query.genresId
            res.locals.type = req.query.type

            console.log(req.query.genresName)
            console.log(req.query.genresId)

            result1 = await axios.get(API_URL + "anime", {params: params1})
            result2 = await axios.get(API_URL + "anime", {params: params2});

        } else if (req.params.anime === "seasons"){

            params1 = {
                filter: req.query.type,
                page: 1, 
                limit: 21,    
            }
            params2 = {
                filter: req.query.type,
                page: 2,   
                limit: 21,  
            }
            
            res.locals.type = req.query.type
            
            
           if (req.query.season){

                const url = "seasons/" + req.query.year + "/" + req.query.season
             
                result1 = await axios.get(API_URL + url, {params: params1})
                result2 = await axios.get(API_URL + url, {params: params2});

                res.locals.name = req.query.season
                res.locals.year = req.query.year

            } else {
                
                result1 = await axios.get(API_URL + "seasons/now", {params: params1})
                result2 = await axios.get(API_URL + "seasons/now", {params: params2});
                
                res.locals.name = result1.data.data[0].season
                res.locals.year = result1.data.data[0].year

            } 
        }

        

        res.render("search.ejs", {content1: result1.data, content2: result2.data, characters: resultChar})
    }catch(error) {
        res.render("error.ejs", {error: error.message})
    }
})

app.post("/search", async(req, res) => {
    try {
        var start_date = ""
        var end_date = ""
        var genreId = ""
        var page1 = 1
        var page2 = 2

        if (req.body.genreId){
           genreId = req.body.genreId
           res.locals.name = req.body.name
           
           res.locals.genreId = genreId

           console.log("genreId = "+ genreId)
        }

        if (req.body.year){
            res.locals.year = req.body.year
            start_date = req.body.year + "-01-01"
            end_date = (req.body.year) + "-12-31"
            console.log(end_date + " | " + start_date)
        }

        if (req.body.page){
            page1 = page1 * 2
            page2 = page1 - 1

            console.log("page " + page1 + " and " + page2)
        }
        
        const params1 = {
            order_by: "start_date", 
            sort: "desc", 
            genres: genreId, 
            start_date: start_date, 
            end_date: end_date, 
            page: page1,
            limit: 21, }

        const result1 = await axios.get(API_URL + "anime", {params: params1})
        
        const params2 = {
            order_by: "start_date", 
            sort: "desc", 
            genres: genreId, 
            start_date: start_date, 
            end_date: end_date, 
            page: page2,
            limit: 21, }

        const result2 = await axios.get(API_URL + "anime", {params: params2})

        res.locals.anime = "category"

        res.render("search.ejs", {content1: result1.data, content2: result2.data, characters: resultChar})
    }catch(error) {
        res.render("error.ejs", {error: error.message})
    }

})
app.listen(port, () => {
    console.log(`Server is running in port ${port}`);
});
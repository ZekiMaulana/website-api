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


// function for saving json data
function saveJson(data, fileName){
    fs.writeFile(__dirname + "/public/dataJSON/"+ fileName +".json", JSON.stringify(data), (err) => {
                if (err) throw err;
                console.log('The file has been saved!');
            });
}

// function for read data JSON local
function readJson(fileName) {
    const file = fs.readFileSync(__dirname + "/public/dataJSON/" + fileName + ".json", "utf8");

    return JSON.parse(file)
}

// use data JSON local (Sometimes error because too many request to the server)
const resultGenres = readJson("genres")
const resultExplicitGenres = readJson("explicit_genres")
const resultThemes = readJson("themes")
const resultDemo = readJson("demographics")
const resultChar = readJson("topCharacters")


// Use Public Api
// const resultChar = await axios.get(API_URL + "top/characters")             
const seasonsList = await axios.get(API_URL + "seasons")




app.get("/", async (req, res) => {
    try {

        // use public api

        const paramsTopAired = { filter: "airing", type: "tv"};
        const resultTopAired = await axios.get(API_URL + "top/anime", {params: paramsTopAired});

        const paramsTopAiredMovie = { type: "movie"};
        const resultTopAiredMovie = await axios.get(API_URL + "top/anime", {params: paramsTopAiredMovie});

        const paramsTopUpcoming = { filter: "upcoming"};
        const resultTopUpcoming = await axios.get(API_URL + "top/anime", {params: paramsTopUpcoming});

        
        const resultTopAnime = await axios.get(API_URL + "top/anime");
        
        res.render("index.ejs", {
            content: resultTopAired.data,  
            characters: resultChar, 
            movie: resultTopAiredMovie.data, 
            top: resultTopAnime.data, 
            upcoming: resultTopUpcoming.data});

        
              

    } catch (error) {
        console.error("Failed to make request:", error.message);
        console.error(error.status);
        var message = ""
        if (error.status === 429){
            message = "Wait a minute, Too much Request";
        } else if(error.status === 400){
            message = "Technical Error, This Page Cannot be Accessed "
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
        console.error("Failed to make request:", error.message);
        console.error(error.status);
        var message = ""
        if (error.status === 429){
            message = "Wait a minute, Too much Request";
        } else if(error.status === 400){
            message = "Technical Error, This Page Cannot be Accessed "
        }
        res.render("error.ejs", { error: message });
    }
});

app.get("/category", async (req, res) => {
    switch(req.query.type){
        case "genre":
            try {
                // using data from public api


                // const paramsGenres = {filter: "genres"}
                // const resultGenres = await axios.get(API_URL+ "genres/anime", {params: paramsGenres})

                // const paramsExplicit = {filter: "explicit_genres"}
                // const resultExplicitGenres = await axios.get(API_URL + "genres/anime", {params: paramsExplicit})

                // const paramsThemes = {filter: "themes"}
                // const resultThemes = await axios.get(API_URL + "genres/anime", {params: paramsThemes})

                // const paramsDemo = {filter: "demographics"}
                // const resultDemo = await axios.get(API_URL + "genres/anime", {params: paramsDemo})

                res.render("category.ejs", {
                    category: resultGenres, 
                    characters: resultChar, 
                    categoryE: resultExplicitGenres, 
                    categoryT: resultThemes, 
                    categoryD: resultDemo});
            }catch (error) {
                console.error("Failed to make request:", error.message);
                console.error(error.status);
                var message = ""
                if (error.status === 429){
                    message = "Wait a minute, Too much Request";
                } else if(error.status === 400){
                    message = "Technical Error, This Page Cannot be Accessed "
                }
                res.render("error.ejs", { error: message });
            }
            break;
        case "release-year":
            try {
                
                res.render("category.ejs", {years: seasonsList.data, characters: resultChar})
            } catch(error) {
                console.error("Failed to make request:", error.message);
                console.error(error.status);
                var message = ""
                if (error.status === 429){
                    message = "Wait a minute, Too much Request";
                } else if(error.status === 400){
                    message = "Technical Error, This Page Cannot be Accessed "
                }
                res.render("error.ejs", { error: message });
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
        var page1 = 1
        var page2 = 2
        
        res.locals.anime = req.params.anime
        res.locals.page = Number(req.query.page)
        if (req.query.page){
            page2 = res.locals.page * 2
            page1 = page2 - 1}

        if(req.params.anime === "top"){
            params1 = {
                filter: req.query.filter, 
                type: req.query.type,
                page: page1,    
                limit: 21, 
            }
            params2 = {
                filter: req.query.filter, 
                type: req.query.type,
                page: page2,     
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
            var sort = ""
            var order_by = "popularity"
            
            if(req.query.year){
                res.locals.year = req.query.year
                start_date = req.query.year + "-01-01"
                end_date = (req.query.year) + "-12-31"
            }

            if(req.query.order_by){
                order_by = req.query.order_by
                switch(req.query.order_by){
                    case "start_date":
                        sort = "desc"
                        break;
                    case "score":
                        sort = "desc"
                        break;
                    case "rank":
                        sort = "asc"
                        break;
                    case "popularity":
                        sort = "asc"
                        break;
                    case "favorites":
                        sort = "desc"
                        break;
                    default:
                        break;

                }
            }
            params1 = {
                genres: req.query.genresId,
                type: req.query.type,
                start_date: start_date, 
                end_date: end_date,
                status: req.query.status,
                order_by: order_by,
                sort: sort,
                page: page1,
                limit: 21,
            }

            params2 = {
                genres: req.query.genresId,
                type: req.query.type, 
                start_date: start_date, 
                end_date: end_date, 
                status: req.query.status,
                order_by: order_by,
                sort: sort,
                page: page2,
                limit: 21,
            }
            
            res.locals.name = req.query.genresName
            res.locals.genreId = req.query.genresId
            res.locals.type = req.query.type
            res.locals.status = req.query.status
            res.locals.order_by = req.query.order_by


            result1 = await axios.get(API_URL + "anime", {params: params1})
            result2 = await axios.get(API_URL + "anime", {params: params2});

        } else if (req.params.anime === "seasons"){

            params1 = {
                filter: req.query.type,
                page: page1, 
                limit: 21,    
            }
            params2 = {
                filter: req.query.type,
                page: page2,   
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
        console.error("Failed to make request:", error.message);
        console.error(error.status);
        var message = ""
        if (error.status === 429){
            message = "Wait a minute, Too much Request";
        } else if(error.status === 400){
            message = "Technical Error, This Page Cannot be Accessed "
        }
        res.render("error.ejs", { error: message });
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

        }

        if (req.body.year){
            res.locals.year = req.body.year
            start_date = req.body.year + "-01-01"
            end_date = (req.body.year) + "-12-31"
        }

        
        
        const params1 = {
            order_by: "popularity", 
            sort: "asc", 
            genres: genreId, 
            start_date: start_date, 
            end_date: end_date, 
            page: page1,
            limit: 21, }

        const result1 = await axios.get(API_URL + "anime", {params: params1})
        
        const params2 = {
            order_by: "popularity", 
            sort: "asc", 
            genres: genreId, 
            start_date: start_date, 
            end_date: end_date, 
            page: page2,
            limit: 21, }

        const result2 = await axios.get(API_URL + "anime", {params: params2})

        res.locals.anime = "category"
        res.locals.type=""
        res.locals.order_by = "popularity"
        res.locals.page = 1

        res.render("search.ejs", {content1: result1.data, content2: result2.data, characters: resultChar})
    }catch(error) {
        console.error("Failed to make request:", error.message);
        console.error(error.status);
        var message = ""
        if (error.status === 429){
            message = "Wait a minute, Too much Request";
        } else if(error.status === 400){
            message = "Technical Error, This Page Cannot be Accessed "
        }
        res.render("error.ejs", { error: message });
    }

})
app.listen(port, () => {
    console.log(`Server is running in port ${port}`);
});
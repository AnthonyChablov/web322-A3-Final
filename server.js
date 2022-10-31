/*********************************************************************************
*  WEB322 – Assignment 03
*  I declare that this assignment is my own work in accordance with Seneca  Academic Policy.  No part *  of this assignment has been copied manually or electronically from any other source 
*  (including 3rd party web sites) or distributed to other students.
* 
*  Name: __________Anthony Chablov______ Student ID: __158794214__ Date: __October 31, 2022_________
*
*  Online (Heroku) Link: ________https://gory-vault-12444.herokuapp.com/about_________________________
*
********************************************************************************/ 
const express = require('express');
const streamifier = require('streamifier');
const multer = require("multer");
const cloudinary = require('cloudinary').v2;
const path = require("path");
const app = express();
const PORT = process.env.PORT || 8080;
const blogData = require("./blog-service");

cloudinary.config({ 
    cloud_name: 'ddazkiod2', 
    api_key: '859917284244576', 
    api_secret: 'ocGtYohQshpjpvSgmdBgAS65I1o',
    secure:true
});

const upload = multer();

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.redirect("/about");
});

app.get('/about', (req, res) => {
    res.sendFile(path.join(__dirname, "/views/about.html"))
});

app.get('/blog', (req,res)=>{
    blogData.getPublishedPosts()
        .then((data=>res.json(data)))
        .catch(err=>res.json({message: err}));
});

app.get('/posts', (req,res)=>{
    let getPromise = null;
    if(req.query.category){
        getPromise = blogData.getPostsByCategory(req.query.category);
    }else if(req.query.minDate){
        getPromise = blogData.getPostsByMinDate(req.query.minDate);
    }else{
        getPromise = blogData.getAllPosts()
    } 
    getPromise
        .then(data => res.json(data))
        .catch(err => res.json({message: err}))
});

app.post("/posts/add", upload.single("featureImage"), (req,res)=>{
    if(req.file){
        let streamUpload = (req) => {
            return new Promise((resolve, reject) => {
                let stream = cloudinary.uploader.upload_stream(
                    (error, result) => {
                        if (result) {
                            resolve(result);
                        } else {
                            reject(error);
                        }
                    }
                );
                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });
        };
    
        async function upload(req) {
            let result = await streamUpload(req);
            console.log(result);
            return result;
        }
    
        upload(req).then((uploaded)=>{
            processPost(uploaded.url);
        });
    }else{
        processPost("");
    }

    function processPost(imageUrl){
        req.body.featureImage = imageUrl;
        blogData.addPost(req.body)
            .then(post=>res.redirect("/posts"))
            .catch(err=>res.status(500).send(err))
    }   
});

app.get('/posts/add', (req,res)=>{
    res.sendFile(path.join(__dirname, "/views/addPost.html"));
}); 

app.get('/post/:id', (req,res)=>{
    blogData.getPostById(req.params.id)
        .then(data=>res.json(data))
        .catch(err=>res.json({message: err}));
});

app.get('/categories', (req,res)=>{
    blogData.getCategories()
        .then((data=>res.json(data)))
        .catch(err=>res.json({message: err}))
});

app.use((req,res)=>res.status(404).send("404 - Error Page Not Found"));

blogData.initialize()
    .then(() => app
        .listen(PORT, () => console.log(`listening on: ${PORT}`)))
        .catch((err) => console.log(err));

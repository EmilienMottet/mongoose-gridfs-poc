/**
 * NPM Module dependencies.
 */
const express = require('express');
const trackRoute = express.Router();
const multer = require('multer');

const mongoose = require('mongoose');

/**
 * NodeJS Module dependencies.
 */
const { Readable } = require('stream');

/**
 * Create Express server && Express Router configuration.
 */
const app = express();
app.use('/tracks', trackRoute);

//mongoose connect
mongoose.connect('mongodb://localhost/trackDB').catch((err)=>{
    console.log('*** Can Not Connect to Mongo Server:', mongo_location)
});

mongoose.connection.on('connected',function(){

    //instantiate mongoose-gridfs
    var gridfs = require('mongoose-gridfs')({
        collection:'tracks',
        // model:'',
        // bucketName : 'tracks',
        mongooseConnection: mongoose.connection
    });

    //obtain a model
    Attachment = gridfs.model;

})

/**
 * GET /tracks/:trackID
 */
trackRoute.get('/:trackID', (req, res) => {
    res.set('content-type', 'audio/mp3');
    res.set('accept-ranges', 'bytes');


    var downloadStream = Attachment.readById(req.params.trackID);
    downloadStream.on('data', (chunk) => {
        res.write(chunk);
    });

    downloadStream.on('error', () => {
        console.log(downloadStream == null || Attachment == null);
        res.sendStatus(404);
    });

    downloadStream.on('end', () => {
        res.end();
    });


});

/**
 * POST /tracks
 */
trackRoute.post('/', (req, res) => {
  const storage = multer.memoryStorage()
  const upload = multer({ storage: storage, limits: { fields: 1, fileSize: 6000000, files: 1, parts: 2 }});
  upload.single('track')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: "Upload Request Validation Failed" });
    } else if(!req.body.name) {
      return res.status(400).json({ message: "No track name in request body" });
    }
    
    let trackName = req.body.name;
    
    // Covert buffer to Readable Stream
    const readableTrackStream = new Readable();
    readableTrackStream.push(req.file.buffer);
    readableTrackStream.push(null);


      Attachment.write({
          filename:trackName,
          contentType:'audio/mp3'
      },readableTrackStream,
                       function(error,createdFile){
                           var id = createdFile._id ;
                           if (error) {
                               res.status(500).send(error);
                           }
                           res.status(201).send(createdFile);
                       }
                       );


 });
});

app.listen(3005, () => {
  console.log("App listening on port 3005!");
});

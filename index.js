const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const mysql = require('mysql');

//INITALISATION DE LA CONNEXION A LA BASE DE DONNEES
const pool = mysql.createPool({
        host    :   '**',
        user    :   '**',
        password : '**',
        database  : '**'
    });

//CREATION DES OBJETS
var ville = {
    id: Number,
    nom: String,
    pays: String,
    region: String,
    photo: String
}

var voyage = {
    id: Number,
    nom: String,
    createur: String,
    destinations: []
}
//INITIALISATIN BODYPARSER
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))

// parse application/json
app.use(bodyParser.json())

//VERSION DE L'API
const versionApi = 'v1';
app.get('/', (req,res) => {
    res.json({
        message: `Application de gestion des voyages ${versionApi}`
    })
});

//VILLES
//CREATE POST /api/v1/travel
app.post(`/api/${versionApi}/travel`,(req, res) => {
    const data = req.body;
    var newId = 0;
    //insertion du voyage
    pool.getConnection(function (err,connection) {
        if (err) throw err;
        //récuperation de l'id nouvellement inserer
         connection.query(`INSERT INTO voyage(nom,createur) VALUES ('${data.nom}','${data.createur}')`, function (error, results,fields) {
            if(error) throw error;
            console.log(newId);
            newId = results.insertId;
            data.destinations.forEach(function (destination) {
                 connection.query(`INSERT INTO assoc_voyage_ville(id_ville,id_voyage) VALUES ('${newId}','${destination}')`, function (error, results, fields) {
                     if (error) throw error;
                 })
            });
        })
        connection.release();
        res.send(`Travel has been store in database for id:${newId}`);
    });

});

//READ GET /api/v1/travel/:id
app.get(`/api/${versionApi}/travel/:id`, (req,res) => {
    pool.getConnection(function (err,connection){
        const id = req.params.id;
        toReturn = voyage;
        if(err) throw err;
        connection.query(`SELECT * FROM voyage WHERE id=${connection.escape(id)}`, function (error, results,fields) {
            if(error) throw error;
            toReturn.id = results[0].id;
            toReturn.nom = results[0].nom ;
            toReturn.createur = results[0].createur;
            connection.query(`SELECT id,nom,pays,region,photo,description FROM ville,assoc_voyage_ville WHERE assoc_voyage_ville.id_ville = ville.id AND id_voyage=${connection.escape(id)}`, function (error, results,fields) {
                if(error) throw error;
                results.forEach(function (element) {
                    toAdd = ville;
                    toAdd.id = element.id;
                    toAdd.nom = element.nom;
                    toAdd.pays= element.pays;
                    toAdd.region= element.region;
                    toAdd.photo = element.photo;
                    toAdd.description = element.description;
                    toReturn.destinations.push(toAdd);
                })
            })
            connection.release();
            res.json(toReturn);
        })
    });
});

//READ GET /api/v1/travel
app.get(`/api/${versionApi}/travel`, (req,res) => {
    pool.getConnection(function (err,connection){
        toReturn = new Array();
        if(err) throw err;
        connection.query(`SELECT * FROM voyage`, function (error, results,fields) {
            if(error) throw error;
            results.forEach(function (travel) {
                toAdd = voyage;
                toAdd.id = travel.id;
                toAdd.nom = travel.nom ;
                toAdd.createur = travel.createur;
                connection.query(`SELECT id,nom,pays,region,photo,description FROM ville,assoc_voyage_ville WHERE assoc_voyage_ville.id_ville = ville.id AND id_voyage=${connection.escape(travel.id)}`, function (error, results,fields) {
                    if(error) throw error;
                    results.forEach(function (element) {
                        toAddVille = ville;
                        toAddVille.id = element.id;
                        toAddVille.nom = element.nom;
                        toAddVille.pays= element.pays;
                        toAddVille.region= element.region;
                        toAddVille.photo = element.photo;
                        toAddVille.description = element.description;
                        toAdd.destinations.push(toAddVille);
                    })
                })
                toReturn.push(toAdd);
            })
            connection.release();
            res.json(toReturn);
        })
    });
});

//UPDATE PUT /api/v1/travel/:id
app.put(`/api/${versionApi}/travel/:id`, (req,res)=>{
    const id = req.params.id;
    const data = req.body;
    pool.getConnection(function(err,connection){
        if (err) throw err;
        connection.query(`UPDATE voyage SET nom = '${data.nom}', createur = '${data.createur}' WHERE id=${id}`, function(error,results,fields) {
            connection.release();
            if (error) throw error;
           })
        })
    });

//DELETE DELETE /api/v1/travel/:id
app.delete(`/api/${versionApi}/travel/:id`, (req,res)=>{
    const id = req.params.id;
    pool.getConnection(function (err,connection) {
        if(err) throw err;
        connection.query(`DELETE FROM \`voyage\` WHERE id=${id}`, function (error, results, fields) {
            if (error) throw error;
        })
        connection.query(`DELETE FROM \`assoc_voyage_ville\` WHERE id_voyage=${id}`, function (error, results, fields) {
            if (error) throw error;
            connection.release();
        })
        res.send('ok');
    })
});


//ECOUTE DU SERVEUR
app.listen(3000, () => console.log('Listening on port 3000'));

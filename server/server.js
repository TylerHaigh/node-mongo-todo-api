
const {mongoose} = require('./db/mongoose');
const { Todo, User } = require('./models/models');

const express = require('express');
const bodyParser = require('body-parser');

const {ObjectID} = require('mongodb');

var app = express();

app.use(bodyParser.json());

app.post('/todos', (req, res) => {
    var todo = new Todo({text: req.body.text});

    todo.save().then( (doc) => {
        res.send(doc);
    }, (err) => {
        res.status(400).send(err);
    })
})


app.get('/todos', (req, res) => {

    Todo.find({}).then( (todos) => {
        res.send({todos});
    }, (e) => {
        res.status(400).send(e);
    })
});


app.get('/todos/:id', (req, res) => {
    var id = req.params.id;
    //res.send(req.params);

    if (!ObjectID.isValid(id))
        return res.status(404).send();

    Todo.findById(id).then( (todo) => {
        if (!todo)
            return res.status(404).send();
        
        return res.send({todo});
    }).catch( (e) => res.status(500).send(e) );
})





const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`)
});


module.exports = {app}
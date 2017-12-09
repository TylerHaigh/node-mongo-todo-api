
const {mongoose} = require('./db/mongoose');
const { Todo, User } = require('./models/models');

const express = require('express');
const bodyParser = require('body-parser');

const {ObjectID} = require('mongodb');
const _ = require('lodash');

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
});


app.delete('/todos/:id', (req, res) => {

    var id = req.params.id;

    if (!ObjectID.isValid(id))
        return res.status(404).send();

    Todo.findByIdAndRemove(id).then( (todo) => {
        if (!todo)
            return res.status(404).send();

        res.send({todo});
    }).catch( (e) => res.status(500).send(e) );

});



app.patch('/todos/:id', (req, res) => {
    var id = req.params.id;
    var body = _.pick(req.body, ['text', 'completed']);

    if (!ObjectID.isValid(id))
        return res.status(404).send();
    
        if (_.isBoolean(body.completed) && body.completed) {
            body.completedAt = new Date().getTime();
        } else {
            body.completed = false;
            body.completedAt = null;
        }

        Todo.findByIdAndUpdate(id, {$set:body}, {new: true}).then( (todo) => {
            if (!todo)
                return res.status(404).send();

            res.send({todo});
        }).catch( (e) => res.status(500).send());


});



const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`)
});


module.exports = {app}
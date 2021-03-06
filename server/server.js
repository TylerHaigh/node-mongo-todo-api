const config = require('./config/config');

const {mongoose} = require('./db/mongoose');
const { Todo, User } = require('./models/models');

const express = require('express');
const bodyParser = require('body-parser');

const {ObjectID} = require('mongodb');
const _ = require('lodash');

const {authenticate} = require('./middleware/authenticate');

var app = express();

// middleware

app.use(bodyParser.json());





// routes


app.post('/todos', authenticate, (req, res) => {
    var todo = new Todo({text: req.body.text, _creator: req.user._id});

    todo.save().then( (doc) => {
        res.send(doc);
    }).catch((err) => {
        res.status(400).send(err);
    });
});

app.get('/todos', authenticate, (req, res) => {

    Todo.find({_creator: req.user._id}).then( (todos) => {
        res.send({todos});
    }, (e) => {
        res.status(400).send(e);
    });
});


app.get('/todos/:id', authenticate, (req, res) => {
    var id = req.params.id;
    //res.send(req.params);

    if (!ObjectID.isValid(id))
        return res.status(404).send();

    Todo.findOne({ _id: id, _creator: req.user._id}).then( (todo) => {
        if (!todo)
            return res.status(404).send();
        
        return res.send({todo});
    }).catch( (e) => res.status(500).send(e) );
});


app.delete('/todos/:id', authenticate, (req, res) => {

    var id = req.params.id;

    if (!ObjectID.isValid(id))
        return res.status(404).send();

    Todo.findOneAndRemove({ _id: id, _creator: req.user._id}).then( (todo) => {
        if (!todo)
            return res.status(404).send();

        res.send({todo});
    }).catch( (e) => res.status(500).send(e) );

});



app.patch('/todos/:id', authenticate, (req, res) => {
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

        Todo.findOneAndUpdate({_id: id, _creator: req.user._id}, {$set:body}, {new: true}).then( (todo) => {
            if (!todo)
                return res.status(404).send();

            res.send({todo});
        }).catch( (e) => res.status(500).send());
});



app.post('/users', (req, res) => {
    
    var body = _.pick(req.body, ['email', 'password']);
    
    var user = new User(body);

    user.save().then( () => {
        return user.generateAuthToken();
    }).then( (token) => {
        //res.send(doc);
        res.header('x-auth', token).send(user);
    }).catch( (err) => {
        // console.log(err);
        res.status(400).send(err);
    });
});




app.get('/users/me', authenticate, (req, res) => {
    res.send(req.user);
});




app.post('/users/login', (req, res) => {

    var body = _.pick(req.body, ['email', 'password']);
    //res.send(body);

    User.findByCredentials(body.email, body.password).then( (user) => {
        return user.generateAuthToken().then( (token) => {
            res.header('x-auth', token).send(user);
        });
    }).catch( (err) => {
        res.status(400).send();
    });

});


app.delete('/users/me/token', authenticate, (req, res) => {
    req.user.removeToken(req.token).then( () => {
        res.status(200).send();
    }, () => {
        res.statusCode(400).send();
    });
});



const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server started on port ${port}`)
});


module.exports = {app}
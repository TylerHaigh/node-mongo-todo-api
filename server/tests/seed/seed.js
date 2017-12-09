const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');

const {Todo, User} = require('./../../models/models');

const userOneId = new ObjectID();
const userTwoId = new ObjectID();

const initTodos = [
    {text: 'First todo', _id: new ObjectID(), _creator: userOneId },
    {text: 'Second todo', _id: new ObjectID(), completed: true, completedAt: 333, _creator: userTwoId}
];


const populateTodos = (done) => {
    Todo.remove({}).then( () => {
        return Todo.insertMany(initTodos);
    }).then( () => done() );
};


const initUsers = [
    {
        _id: userOneId,
        email: 'tyler@me.com',
        password: 'userOnePass',
        tokens: [{
            access: 'auth',
            token: jwt.sign({_id: userOneId, access: 'auth'}, '123abc').toString()
        }]
    },
    {
        _id: userTwoId,
        email: 'jordan@me.com',
        password: 'userTwoPass',
        tokens: [{
            access: 'auth',
            token: jwt.sign({_id: userTwoId, access: 'auth'}, '123abc').toString()
        }]
    },
]

const populateUsers = (done) => {
    User.remove({}).then( () => {
        var userOne = new User(initUsers[0]).save();
        var userTwo = new User(initUsers[1]).save();
        
        return Promise.all([userOne, userTwo]);
    }).then( () => done() );
};


module.exports = {
    initTodos,
    populateTodos,
    initUsers,
    populateUsers
}




const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server');
const {Todo} = require('./../models/todo-model');

const {ObjectID} = require('mongodb');

const initTodos = [{text: 'First todo', _id: new ObjectID() }, {text: 'Second todo', _id: new ObjectID()}];


beforeEach( (done) => {
    Todo.remove({}).then( () => {
        return Todo.insertMany(initTodos);
    }).then( () => done() );
})


describe('POST /todos', () => {

    it('should create new todo', (done) => {
        var text = 'Test todo text';

        request(app)
            .post('/todos')
            .send({text})
            .expect(200)
            .expect( (res) => {
                expect(res.body.text).toBe(text);
            }).end( (err, res) => {
                if (err) return done(err);
                
                Todo.find().then( (todos) => {
                    expect(todos.length).toBe(3);
                    expect(todos[2].text).toBe(text);
                    done();
                }).catch( (e) => done(e));
            });
    });

    it ('should not create todo with invalid data', (done) => {

        request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .end( (err, res) => {
                if (err) return done(err);

                Todo.find().then( (todos) => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch( (e) => done(e));
            } );

    });

});


describe('GET /todos', () => {

    it('should get todos', (done) => {
        request(app)
            .get('/todos')
            .expect(200)
            .expect( (res) => {
                expect(res.body.todos.length).toBe(2);
            }).end(done);
    });


});


describe ('GET /todos/id', () => {

    it ('should get valid', (done) => {
        request(app)
            .get(`/todos/${initTodos[0]._id.toHexString()}`)
            .expect(200)
            .expect( (res) => {
                expect(res.body.todo.text).toBe(initTodos[0].text)
            }).end(done)
    })

    it ('should return 404 for invalid ID', (done) => {
        var newId = '123'
        request(app)
            .get(`/todos/${newId}`)
            .expect(404)
            .end(done)
    })

    it ('should return 404 for non-existing ID', (done) => {
        var newId = new ObjectID().toHexString();
        request(app)
            .get(`/todos/${newId}`)
            .expect(404)
            .end(done)
    })

})
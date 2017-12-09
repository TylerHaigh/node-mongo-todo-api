const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server');
const {Todo} = require('./../models/todo-model');

const {ObjectID} = require('mongodb');

const initTodos = [
    {text: 'First todo', _id: new ObjectID() },
    {text: 'Second todo', _id: new ObjectID(), completed: true, completedAt: 333}
];


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

});



describe('DELETE /todos/id', () => {

    it ('should delete if valid', (done) => {

        var id = initTodos[0]._id.toHexString();
        request(app)
            .delete(`/todos/${id}`)
            .expect(200)
            .expect( (res) => {
                expect(res.body.todo.text).toBe(initTodos[0].text);
            })
            .end( (err, res) => {
                if (err) return done(err);

                Todo.findById(id).then( (todo) => {
                    expect(todo).toNotExist();
                    done();
                }).catch( (e) => done(e));
            });

    });

    it ('should return 404 if not found', (done) => {
        var id = new ObjectID().toHexString();

        request(app)
            .delete(`/todos/${id}`)
            .expect(404)
            .end(done);
    });

    it ('should return 404 if invalid object id', (done) => {
        var id = '123';

        request(app)
            .delete(`/todos/${id}`)
            .expect(404)
            .end(done);
    });

});



describe ('PATCH /todos/id', () => {

    it ('should update if valid id', (done) => {

        var id = initTodos[0]._id.toHexString();
        var text = 'Updated';

        request(app)
            .patch(`/todos/${id}`)
            .send({
                completed: true,
                text
            })
            .expect(200)
            .expect( (res) => {
                expect(res.body.todo.completed).toBe(true);
                expect(res.body.todo.completedAt).toBeA('number');
                expect(res.body.todo.text).toBe(text);
            }).end(done);
    });

    it ('should clear data on non-completed', (done) => {
        var id = initTodos[1]._id.toHexString();
        var text = 'Updated';

        request(app)
            .patch(`/todos/${id}`)
            .send({
                completed: false,
                text
            })
            .expect(200)
            .expect( (res) => {
                expect(res.body.todo.completed).toBe(false);
                expect(res.body.todo.completedAt).toNotExist();
                expect(res.body.todo.text).toBe(text);
            }).end(done);
    });

    it ('should return 404 if invalid ID', (done) => {
        var id = new ObjectID().toHexString();

        request(app)
            .patch(`/todos/${id}`)
            .send({completed: true})
            .expect(404)
            .end(done);
    });

    it ('should update if non-existing id', (done) => {
        var id = '123';

        request(app)
            .patch(`/todos/${id}`)
            .send({completed: true})
            .expect(404)
            .end(done);
    });

})
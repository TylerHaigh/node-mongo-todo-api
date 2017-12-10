const expect = require('expect');
const request = require('supertest');
const {ObjectID} = require('mongodb');

const {app} = require('./../server');
const {Todo, User} = require('./../models/models');
const {initTodos, populateTodos, initUsers, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);


describe('POST /todos', () => {

    it('should create new todo', (done) => {
        var text = 'Test todo text';

        request(app)
            .post('/todos')
            .set('x-auth', initUsers[0].tokens[0].token)
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
            .set('x-auth', initUsers[0].tokens[0].token)
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
            .set('x-auth', initUsers[0].tokens[0].token)
            .expect(200)
            .expect( (res) => {
                expect(res.body.todos.length).toBe(1);
            }).end(done);
    });


});


describe ('GET /todos/id', () => {

    it ('should get valid', (done) => {
        request(app)
            .get(`/todos/${initTodos[0]._id.toHexString()}`)
            .set('x-auth', initUsers[0].tokens[0].token)
            .expect(200)
            .expect( (res) => {
                expect(res.body.todo.text).toBe(initTodos[0].text)
            }).end(done);
    });

    it ('should return 404 for invalid ID', (done) => {
        var newId = '123';
        request(app)
            .get(`/todos/${newId}`)
            .set('x-auth', initUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it ('should return 404 for non-existing ID', (done) => {
        var newId = new ObjectID().toHexString();
        request(app)
            .get(`/todos/${newId}`)
            .set('x-auth', initUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });


    it ('should not return todo created by other user', (done) => {
        request(app)
            .get(`/todos/${initTodos[0]._id.toHexString()}`)
            .set('x-auth', initUsers[1].tokens[0].token)
            .expect(404)
            .end(done);
    });

});



describe('DELETE /todos/id', () => {

    it ('should delete if valid', (done) => {

        var id = initTodos[0]._id.toHexString();
        request(app)
            .delete(`/todos/${id}`)
            .set('x-auth', initUsers[0].tokens[0].token)
            .expect(200)
            .expect( (res) => {
                expect(res.body.todo.text).toBe(initTodos[0].text);
            })
            .end( (err, res) => {
                if (err) return done(err);

                Todo.findById(id).then( (todo) => {
                    expect(todo).toBeFalsy();
                    done();
                }).catch( (e) => done(e));
            });

    });


    it ('should return 404 if deleting todo by another user', (done) => {

        var id = initTodos[0]._id.toHexString();
        request(app)
            .delete(`/todos/${id}`)
            .set('x-auth', initUsers[1].tokens[0].token)
            .expect(404)
            .end( (err, res) => {
                if (err) return done(err);

                Todo.findById(id).then( (todo) => {
                    expect(todo).toBeTruthy();
                    done();
                }).catch( (e) => done(e));
            });

    });


    it ('should return 404 if not found', (done) => {
        var id = new ObjectID().toHexString();

        request(app)
            .delete(`/todos/${id}`)
            .set('x-auth', initUsers[0].tokens[0].token)
            .expect(404)
            .end(done);
    });

    it ('should return 404 if invalid object id', (done) => {
        var id = '123';

        request(app)
            .delete(`/todos/${id}`)
            .set('x-auth', initUsers[0].tokens[0].token)
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
            .set('x-auth', initUsers[0].tokens[0].token)
            .send({
                completed: true,
                text
            })
            .expect(200)
            .expect( (res) => {
                expect(res.body.todo.completed).toBe(true);
                //expect(res.body.todo.completedAt).toBeA('number');
                expect(typeof res.body.todo.completedAt).toBe('number');
                expect(res.body.todo.text).toBe(text);
            }).end(done);
    });


    it ('should return 404 if updating todo by another user', (done) => {

        var id = initTodos[0]._id.toHexString();
        var text = 'Updated';

        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', initUsers[1].tokens[0].token)
            .send({
                completed: true,
                text
            })
            .expect(404)
            .end(done);
    });

    it ('should clear data on non-completed', (done) => {
        var id = initTodos[1]._id.toHexString();
        var text = 'Updated';

        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', initUsers[1].tokens[0].token)
            .send({
                completed: false,
                text
            })
            .expect(200)
            .expect( (res) => {
                expect(res.body.todo.completed).toBe(false);
                expect(res.body.todo.completedAt).toBeFalsy();
                expect(res.body.todo.text).toBe(text);
            }).end(done);
    });

    it ('should return 404 if invalid ID', (done) => {
        var id = new ObjectID().toHexString();

        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', initUsers[0].tokens[0].token)
            .send({completed: true})
            .expect(404)
            .end(done);
    });

    it ('should update if non-existing id', (done) => {
        var id = '123';

        request(app)
            .patch(`/todos/${id}`)
            .set('x-auth', initUsers[0].tokens[0].token)
            .send({completed: true})
            .expect(404)
            .end(done);
    });

})

describe('GET /users/me', () => {

    it ('should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', initUsers[0].tokens[0].token)
            .expect(200)
            .expect( (res) => {
                expect(res.body._id).toBe(initUsers[0]._id.toHexString());
                expect(res.body.email).toBe(initUsers[0].email);
            })
            .end(done);
    });


    it ('should return 401 if not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .expect(401)
            .expect( (res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});



describe('POST /users', () => {

    it ('should create a user', (done) => {
        var email = 'example@example.com';
        var password = '123456!';
        request(app)
            .post('/users')
            .send({email, password})
            .expect(200)
            .expect( (res) => {
                expect(res.headers['x-auth']).toBeTruthy();
                expect(res.body._id).toBeTruthy();
                expect(res.body.email).toBe(email);
            }).end( (err) => {
                if (err) return done(err);

                User.findOne({email}).then( (user) => {
                    expect(user).toBeTruthy();
                    //expect(user.password).toNotBe(password);
                    expect(user.password).not.toBe(password);
                    done();
                }).catch( (e) => done(e));
            });
    });


    it ('should return validation errors if invalid request', (done) => {
        var email = 'and';
        var password = '123';
        request(app)
            .post('/users')
            .send({email, password})
            .expect(400)
            .end(done);
    });


    it ('should not create a user if email in use', (done) => {
        var email = initUsers[0].email;
        var password = '123456!';
        request(app)
            .post('/users')
            .send({email, password})
            .expect(400)
            .end(done);
    });

});


describe('POST /users/login', () => {

    it ('should login user and return auth token', (done) => {
        request(app)
            .post('/users/login')
            .send({email: initUsers[0].email, password: initUsers[0].password})
            .expect(200)
            .expect( (res) => {
                expect(res.headers['x-auth']).toBeTruthy();
            })
            .end( (err, res) => {
                if (err) return done(err);

                User.findById(initUsers[0]._id).then( (user) => {
                    
                    // expect(user.tokens[1]).toInclude({
                    //     access: 'auth',
                    //     token: res.headers['x-auth']
                    // });

                    expect(user.toObject().tokens[1]).toMatchObject({
                        access: 'auth',
                        token: res.headers['x-auth']
                    });

                    done();
                }).catch( (e) => done(e));
            });
    });

    it ('should reject invalid login', (done) => {
        request(app)
            .post('/users/login')
            .send({email: initUsers[0].email, password: initUsers[0].password + '1'})
            .expect(400)
            .expect( (res) => {
                expect(res.headers['x-auth']).toBeFalsy();
            })
            .end( (err, res) => {
                if (err) return done(err);

                User.findById(initUsers[0]._id).then( (user) => {
                    
                    expect(user.tokens.length).toBe(1);
                    done();
                }).catch( (e) => done(e));
            });
    });

});



describe('DELETE /users/me/token', () => {

    it('should remove auth token on log out', (done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', initUsers[0].tokens[0].token)
            .expect(200)
            .end( (err) => {
                if (err) return done(err);

                User.findById(initUsers[0]._id).then( (user) => {
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch ( (e) => done(e));

            });
    });

});
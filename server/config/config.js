const env = process.env.NODE_ENV || 'development';

if (env === 'development' || env === 'test') {
    // load config file
    var config = require('./config.json');
    var envConfig = config[env];

    Object.keys(envConfig).forEach( (key => {
        process.env[key] = envConfig[key];
    }));
}
else if (env === 'travis') {
    // load config file
    var config = require('./config.travis.json');
    var envConfig = config[env];

    Object.keys(envConfig).forEach( (key => {
        process.env[key] = envConfig[key];
    }));
}

// Do this before importing mongoose config file
// if (env === 'development') {
//     process.env.PORT = 3000;
//     process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoApp';
// } else if (env === 'test') {
//     process.env.PORT = 3000;
//     process.env.MONGODB_URI = 'mongodb://localhost:27017/TodoAppTest';
// }


// > heroku config
// > heroku config:set   JWT_SECRET=akrgufhe
// > heroku config:get   JWT_SECRET
// > heroku config:unset JWT_SECRET
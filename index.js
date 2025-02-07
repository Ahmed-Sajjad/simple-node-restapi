const config = require('./common/config/env.config.js');
const bodyParser = require('body-parser');

const express = require('express');
const app = express();
const UsersRouter = require('./users/routes.config');
const AuthRouter = require('./auth/routes.config');

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Allow-Methods', 'GET,HEAD,PUT,PATCH,POST,DELETE');
    res.header('Access-Control-Expose-Headers', 'Content-Length');
    res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range');
    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    } else {
        return next();
    }
});

app.use(bodyParser.json());
UsersRouter.routesConfig(app);
AuthRouter.routesConfig(app);

// app.get('test-newman')

app.listen(config.port, function () {
    console.log('app listening at port %s', config.port);
})
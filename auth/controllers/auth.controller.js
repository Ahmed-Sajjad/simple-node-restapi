const config = require('../../common/config/env.config.js');
const mailer = require('nodemailer');
const jwtSecret = config.jwt_secret;
jwt = require('jsonwebtoken');
const crypto = require('crypto');
switch (config.password_reset_token_expiry_span) {
    case 'days':
        tokenExpiresIn = Number.parseInt(config.password_reset_token_expires_in) * 24 * 60 * 60 * 1000;
        break;
    case 'hours':
        tokenExpiresIn = Number.parseInt(config.password_reset_token_expires_in) * 60 * 60 * 1000;
        break;
    case 'minutes':
        tokenExpiresIn = Number.parseInt(config.password_reset_token_expires_in) * 60 * 1000;
        break;
    default:
        tokenExpiresIn = 12 * 60 * 60 * 1000;
        break;
}
exports.login = (req, res) => {
    try {
        let refreshId = req.body.userId + jwtSecret;
        let salt = crypto.randomBytes(16).toString('base64');
        let hash = crypto.createHmac('sha512', salt).update(refreshId).digest("base64");
        req.body.refreshKey = salt;
        let token = jwt.sign(req.body, jwtSecret);
        let b = new Buffer(hash);
        let refresh_token = b.toString('base64');
        res.status(201).send({
            accessToken: token,
            refreshToken: refresh_token,
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            permissionLevel: req.body.permissionLevel
        });
    } catch (err) {
        res.status(500).send({errors: err});
    }
};

const UserModel  =require('../../users/models/users.model');
exports.confirmEmail = (req, res) => {
    var code, body;
    UserModel.findTokenById(req.body._userId).then((token) => {
        const tokenVerfiyResponse = verifyToken(token);
        code = tokenVerfiyResponse['code'];
        body = tokenVerfiyResponse['body'];
        if(code === 0 && body === 'its-all-good') {
            const actualToken = token[0].token;
            const requestToken = req.body.token;
            if(actualToken === requestToken) {
                UserModel.confirmEmail(req.body._userId).then((result) => {
                    code = 200; body = {};
                    //res.status(200).send({});
                });
            }
            else {
                code = 400; body = {errors: ['Invalid token, does not match the actual token']};
                //res.status(400).send({errors: ['Invalid token, does not match the actual token']});
            }
        }
        return res.status(code).send(body);
    });
};

exports.getResetPasswordToken = (req, res) => {
    UserModel.findByEmail(req.params.email).then(user => {
        if(!user[0]) {
            res.status(404).send({errors:['Not found!']});
        }
        else {
            const transporter = mailer.createTransport({
                service: 'gmail',
                auth: {
                    user: config.email,
                    pass: config.password
                }
            });
            const token = crypto.randomBytes(24).toString('hex');
            const date = new Date();
            transporter.sendMail({
                from: config.email,
                to: req.params.email,
                subject: 'React Bootstrap | NodeJS API - Reset Password',
                html: 'Hey there! Heres the link to reset your password:<br />'+
                '<a href="http://localhost:3000/'+token+'/nodejs-reset-pwd">Click here to reset your password</a>'
            }, function(error, info) {
                console.log((error) ? error : 'Email sent to '+req.body.email+': '+info.response);
            });
            const newToken = {
                _userId: user[0]._id, token: token, issuedFor: 'reset-password',
                _issuedAt: date.toUTCString(),
                _expiresAt: new Date(date.getTime()+tokenExpiresIn).toUTCString()
            };
            UserModel.createToken(newToken);
            res.status(201).send(newToken);
        }
    });
};

exports.resetPassword = (req, res) => {
    var code, body;
    UserModel.findByEmail(req.body.email).then(user => {
        if(!user[0]) {
            code=404; body={};
        }
        else {
            UserModel.findTokenById(user[0]._id).then(token => {
                const tokenVerfiyResponse = verifyToken(token);
                code = tokenVerfiyResponse['code'];
                body = tokenVerfiyResponse['body'];
                if(code === 0 && body === 'its-all-good') {
                    const actualToken = token[0].token;
                    const requestToken = req.body.token;
                    if(actualToken === requestToken) {
                        if (req.body.password){
                            let salt = crypto.randomBytes(16).toString('base64');
                            let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
                            req.body.password = salt + "$" + hash;
                        }
                        UserModel.patchUser(user[0]._id, { "password": req.body.password }).then((result) => {
                            UserModel.removeTokenByUserId(token[0]._userId);
                            return res.status(204).send({});
                        });
                    }
                    else {
                        return res.status(400).send({errors: ['Invalid token, does not match the actual token']});
                    }
                }
            });
        }
    });
};

function verifyToken(token) {
    var code = 0; body = 'its-all-good';
    if(!token[0]) {
        code = 404;
        body = {errors:['Token not found!']};
        //return res.status(404).send({erros:['Token not found!']});
    }
    else if(new Date(token[0]._expiresAt).getTime() < new Date().getTime()) {
        console.log('EXPIRED');
        UserModel.removeTokenByUserId(token[0]._userId).then(result => {
            code = 400;
            body = {errors:['Invalid Token, it is expired!']}
            //res.status(400).send({ errors: ['Invalid token, it is expired!'] });
        });
    }
    return { code: code, body: body };
};
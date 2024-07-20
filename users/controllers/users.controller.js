const UserModel = require('../models/users.model');
const crypto = require('crypto');
const mailer = require('nodemailer');
const config = require("../../common/config/env.config");
const tokenExpirySpan = config.token_expiry_span;
var tokenExpiresIn;
switch (tokenExpirySpan) {
    case 'days':
        tokenExpiresIn = Number.parseInt(config.token_expires_in) * 24 * 60 * 60 * 1000;
        break;
    case 'hours':
        tokenExpiresIn = Number.parseInt(config.token_expires_in) * 60 * 60 * 1000;
        break;
    case 'minutes':
        tokenExpiresIn = Number.parseInt(config.token_expires_in) * 60 * 1000;
        break;
    default:
        tokenExpiresIn = 12 * 60 * 60 * 1000;
        break;
}

exports.insert = (req, res) => {
    let salt = crypto.randomBytes(16).toString('base64');
    let hash = crypto.createHmac('sha512',salt).update(req.body.password).digest("base64");
    req.body.password = salt + "$" + hash;
    req.body.permissionLevel = 1;
    req.body.emailConfirmed = false;
    UserModel.createUser(req.body)
        .then((result) => {
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
                to: req.body.email,
                subject: 'React Bootstrap | NodeJS API - Confirm Email',
                html: 'Hey there! Heres the link to activate your account:<br />'+
                '<a href="http://localhost:3000/'+token+'/nodejs-confirm">Click here to activate your account</a>'
            }, function(error, info) {
                console.log((error) ? error : 'Email sent to '+req.body.email+': '+info.response);
            });
            const newToken = {
                _userId: result._id, token: token, issuedFor: 'email-verification',
                _issuedAt: date.toUTCString(),
                _expiresAt: new Date(date.getTime()+tokenExpiresIn).toUTCString()};
            UserModel.createToken(newToken);
            res.status(201).send(newToken);
        });
};

exports.getById = (req, res) => {
    UserModel.findById(req.params.userId).then((result) => {
        res.status(200).send(result);
    });
}

exports.patchById = (req, res) => {
    if (req.body.password){
        let salt = crypto.randomBytes(16).toString('base64');
        let hash = crypto.createHmac('sha512', salt).update(req.body.password).digest("base64");
        req.body.password = salt + "$" + hash;
    }
    UserModel.patchUser(req.params.userId, req.body).then((result) => {
            res.status(204).send({});
    });
};

exports.list = (req, res) => {
    let limit = req.query.limit && req.query.limit <= 100 ? parseInt(req.query.limit) : 10;
    let page = 0;
    if (req.query) {
        if (req.query.page) {
            req.query.page = parseInt(req.query.page);
            page = Number.isInteger(req.query.page) ? req.query.page : 0;
        }
    }
    UserModel.list(limit, page).then((result) => {
        res.status(200).send(result);
    })
};

exports.removeById = (req, res) => {
    UserModel.removeById(req.params.userId)
        .then((result)=>{
            res.status(204).send({});
        });
};

            /*********************************************************************************
            **************           NEWMAN REQUESTS GO BELOW HERE          ******************
            **************           FOR THE SPROUTVIDEO API                ******************
            **************                      ||                          ******************
            **************                      \/                          ******************
            *********************************************************************************/

const newman = require('newman');
exports.testNewman = (req, res) => {
    newman.run({
        collection: "Vids_Collection.postman_collection.json",
        reporters: ['json'],
        reporter: {
            json: {
                exports: "../../common/report.json"
            }
        },
        folder: "get-videos"
    }, function(err, summary) {
        err && console.log(err);
        var response = Buffer.from(summary.run.executions[0].response.stream).toString();
        res.status(200).send(JSON.parse(response));
    });
};

exports.getVideos = (req, res) => {
    newman.run({
        collection: "Vids_Collection.postman_collection.json",
        reporters: ['json'],
        reporter: {
            json: {
                exports: "../../common/report.json"
            }
        },
        iterationData: [{ "folder_id": req.query.folder_id }],
        folder: "get-videos"
    }, function(err, summary) {
        err && console.log(err);
        var response = Buffer.from(summary.run.executions[0].response.stream).toString();
        res.status(200).send(JSON.parse(response));
    });
};

exports.getUploadToken = (req, res) => {
    newman.run({
        collection: "Vids_Collection.postman_collection.json",
        reporters: ['json'],
        reporter: {
            json: {
                exports: "../../common/report.json"
            }
        },
        folder: "get-upload-token"
    }, function(err, summary) {
        err && console.log(err);
        var response = Buffer.from(summary.run.executions[0].response.stream).toString();
        res.status(200).send(JSON.parse(response));
    });
};

exports.createFolder = (req, res) => {
    newman.run({
        collection: "Vids_Collection.postman_collection.json",
        reporters: ['json'],
        reporter: {
            json: {
                exports: "../../common/report.json"
            }
        },
        iterationData: [{"username": req.body.name}],
        folder: "create-folder",
    }, function(err, summary) {
        err && console.log(err);
        var response = Buffer.from(summary.run.executions[0].response.stream).toString();
        res.status(200).send(JSON.parse(response));
    });
};

exports.getFolderId = (req, res) => {
    const name = req.params.name;
    newman.run({
        collection: "Vids_Collection.postman_collection.json",
        reporters: ['json'],
        reporter: {
            json: {
                exports: "../../common/report.json"
            }
        },
        folder: "get-folders",
    }, function(err, summary) {
        err && console.log(err);
        var response = Buffer.from(summary.run.executions[0].response.stream).toString();
        var responseObject = JSON.parse(response);
        var iter = 0;
        if(responseObject.folders.length > 0) {
            responseObject.folders.forEach(folder => {
                if(folder.name === req.params.name) {
                    return res.status(200).send({ id: folder.id });
                }
                iter += 1;
            });
        }
        if(iter >= responseObject.folders.length) {
            return res.status(400).send('No folder named '+name);
        }
    });
};

exports.getTagNames = (req, res) => {
    const tagIds = req.body.tagIds;
    const tags = [];
    tagIds.forEach((tagId) => {
        tags.push({tag: tagId});
    });
    
    newman.run({
        collection: "Vids_Collection.postman_collection.json",
        reporters: ['json'],
        reporter: {
            json: {
                exports: "../../common/report.json"
            }
        },
        iterationData: tags,
        folder: "get-tagnames"
    }, function(err, summary) {
        err && console.log(err);
        const execs = summary.run.executions;
        var responseObject = [];
        execs.forEach((exec) => {
            var fullResObject = JSON.parse(Buffer.from(exec.response.stream).toString());
            responseObject.push({ tagId: fullResObject.id, tagName: fullResObject.name.toLowerCase() });
        });
        responseObject = responseObject.sort(function(a, b) {
            return a.tagName.localeCompare(b.tagName);
        });
        res.status(200).send(responseObject);
    });
}

exports.deleteVideo = (req, res) => {
    newman.run({
        collection: "Vids_Collection.postman_collection.json",
        reporters: ['json'],
        reporter: {
            json: {
                exports: "../../common/report.json"
            }
        },
        iterationData: [{ id: req.params.id }],
        folder: "delete-video"
    }, function(err, summary) {
        err && console.log(err);
        var responseObject = JSON.parse(Buffer.from(summary.run.executions[0].response.stream).toString());
        if(Object.keys(responseObject).findIndex((key) => key.toLowerCase() === "error") === -1) {
            res.status(200).send(responseObject);
        }
        else {
            res.status(400).send(responseObject);
        }
    });
};
const UsersController = require('./controllers/users.controller');
const ValidationMiddleware = require('../common/middlewares/auth.validation.middleware');
const PermissionMiddleware = require('../common/middlewares/auth.permission.middleware');
const config = require('../common/config/env.config');

const ADMIN = config.permissionLevels.ADMIN;
const PAID = config.permissionLevels.PAID_USER;
const FREE = config.permissionLevels.NORMAL_USER;

exports.routesConfig = (app) => {
    app.post('/users', [
        UsersController.insert
    ]);
    
    app.get('/users', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(PAID),
        UsersController.list
    ]);

    app.get('/users/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        UsersController.getById
    ]);

    app.patch('/users/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(FREE),
        PermissionMiddleware.onlySameUserOrAdminCanDoThisAction,
        UsersController.patchById
    ]);

    app.delete('/users/:userId', [
        ValidationMiddleware.validJWTNeeded,
        PermissionMiddleware.minimumPermissionLevelRequired(ADMIN),
        UsersController.removeById
    ]);

            /*********************************************************************************
            **************           NEWMAN REQUESTS GO BELOW HERE          ******************
            **************           FOR THE SPROUTVIDEO API                ******************
            **************                      ||                          ******************
            **************                      \/                          ******************
            *********************************************************************************/

    app.get('/test-newman', [
        UsersController.testNewman
    ]);

    app.get('/get-videos', [
        UsersController.getVideos
    ]);

    app.get('/get-upload-token', [
        UsersController.getUploadToken
    ]);

    app.post('/create-folder', [
        UsersController.createFolder
    ]);

    app.get('/get-folder-id/:name', [
        UsersController.getFolderId
    ]);

    app.post('/get-tagnames', [
        UsersController.getTagNames 
    ]);

    app.delete('/videos/:id', [
        UsersController.deleteVideo
    ]);
}
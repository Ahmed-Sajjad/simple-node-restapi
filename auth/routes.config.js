const VerifyUserMiddleware = require('./middlewares/verify.user.middleware');
const AuthorizationController = require('./controllers/auth.controller');

exports.routesConfig = (app) => {
    app.post('/auth', [
        VerifyUserMiddleware.hasAuthValidFields,
        VerifyUserMiddleware.isPasswordAndUserMatch,
        AuthorizationController.login
    ]);

    app.post('/auth/confirm', [
        AuthorizationController.confirmEmail
    ]);

    app.get('/auth/:email/reset-password-token', [
        AuthorizationController.getResetPasswordToken
    ]);

    app.post('/auth/reset-password', [
        AuthorizationController.resetPassword
    ]);
}
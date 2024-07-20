const mongoose = require("mongoose");
mongoose.connect('mongodb://localhost:27017');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    firstName: String,
    lastName: String,
    email: String,
    password: String,
    permissionLevel: Number,
    emailConfirmed: Boolean
});

const tokenSchema = new mongoose.Schema({
    _userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
    token: { type: String, required: true },
    issuedFor: { type: String, required: true},
    _issuedAt: { type: Date, required: true},
    _expiresAt: { type: Date, required: true}
});

const User = mongoose.model('Users', userSchema);
const Token = mongoose.model('Tokens', tokenSchema);

exports.createUser = (userData) => {
    const user = new User(userData);
    return user.save();
};

exports.createToken = (tokenData) => {
    const token = new Token(tokenData);
    return token.save();
}

exports.findById = (id) => {
    User.findById(id).then(result => {
        result = result.toJSON();
        delete result._id;
        delete result.__v;
        return result;
    });
};

exports.findByEmail = (email) => {
    return User.find({ email: email });
}

exports.findTokenById = (_userId) => {
    return Token.find({ _userId: _userId });
}

exports.patchUser = (id, userData) => {
    return new Promise((resolve, reject) => {
        User.findById(id, function (err, user) {
            if (err) reject(err);
            for (let i in userData) {
                user[i] = userData[i];
            }
            user.save(function (err, updatedUser) {
                if (err) return reject(err);
                resolve(updatedUser);
            });
        });
    })
};

exports.removeById = (userId) => {
    return new Promise((resolve, reject) => {
        User.remove({_id: userId}, (err) => {
            if (err) {
                reject(err);
            } else {
                resolve(err);
            }
        });
    });
};

exports.removeTokenByUserId = (userId) => {
    return new Promise((resolve, reject) => {
        Token.deleteOne({ _userId: userId }, (err) => {
            if(err) {
                reject(err);
            }
            else {
                resolve(err);
            }
        });
    });
};

exports.list = (perPage, page) => {
    return new Promise((resolve, reject) => {
        User.find()
            .limit(perPage)
            .skip(perPage * page)
            .exec(function (err, users) {
                if (err) {
                    reject(err);
                } else {
                    resolve(users);
                }
            })
    });
};

exports.confirmEmail = (userId) => {
    return new Promise((resolve, reject) => {
        User.updateOne({_id: userId}, {emailConfirmed: true}, (err) => {
            (err) ? reject(err) : resolve(err);
        });
    });
};
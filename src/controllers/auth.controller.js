require('dotenv').config();
const path = require('path');

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require(path.join(__dirname, '../config/db'));
const queries = require(path.join(__dirname, '../db/queries'));

const authenticate = (user) => {
    const expiresIn = '2 days';
    const accessToken = jwt.sign(
        { id: user.id },
        process.env.SECRET,
        { expiresIn: expiresIn },
        { algorithm: 'RS256' }
    );

    return {
        user: user,
        access_token: accessToken,
        expires_in: expiresIn
    }
}

const authorize = async (password, hash) => {
    try {
        // use bcrypt to compare user plaintext pw to hash
        const isMatch = await bcrypt.compare(password, hash);
    
        return isMatch;
    }
    catch(error) {
        return Promise.reject({ message: 'Authorization failed' });
    }
}

exports.authorize = authorize;

const addUser = async (user) => {
    try {
        // .none returns null if successful
        await db.none(queries.addUser, user);
    }
    catch(error) {
        return Promise.reject({ message: 'Add user failed' });
    }
}

exports.signup = async (req, res, next) => {
    
    if (!req.body.display_name || !req.body.email || !req.body.password) {
        return res.status(400).json({ message: 'Missing fields' });
    }
    
    try {
        const saltRounds = 12; // 2^12 iterations
        // check if user with given email already exists
        // .any is used to not throw an error if the query doesn't return any data
        const users = await db.any(queries.findUser, [req.body.email]);
        if (users.length) return res.status(400).json({ message: 'Account with that email already exists' });

        const user = [
            req.body.display_name,
            req.body.email,
            await bcrypt.hash(req.body.password, saltRounds),
            req.body.first_name || null,
            req.body.last_name || null,
        ];

        // otherwise add new user with given info
        await addUser(user);

        // get user with given email (minus their password)
        const { password, ...userWithoutPw } = await db.one(queries.findUser, [req.body.email]);
        // authenticate user
        const authentication = authenticate(userWithoutPw);
        
        // success; return user info, access token and expiration
        return res.status(200).json(authentication);
    }
    catch(error) {
        if (error) return next(error);
    }
}

exports.login = async (req, res, next) => {
    if (!req.body.email || !req.body.password) {
	    return res.status(400).json({ message: 'Missing fields' });
    }
    
    try {
        // verify that user with given email already exists
        // .any is used to not throw an error if the query doesn't return any data
        const users = await db.any(queries.findUser, [req.body.email]);
        const errorMessage = 'Email or password is incorrect';
        if (!users.length) return res.status(401).json({ message: errorMessage });

        // plaintext pw
        const userSentPassword = req.body.password;
        // user id, email and password in db
        const { password, ...user} = users[0];

        // authorize user
        const authorization = await authorize(userSentPassword, password);

        // if incorrect login info, return auth error
        if (!authorization) return res.status(401).json({ message: errorMessage });

        // else send token by calling authenticate func with user as param
        const authentication = authenticate(user);

        return res.status(200).json(authentication);
    }
    catch(error) {
        if (error) return next(error);
    }
};

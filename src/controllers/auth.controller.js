require('dotenv').config();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const db = require(path.join(__dirname, '../db/config'));
const queries = require(path.join(__dirname, '../db/queries'));
const saltRounds = 10;

const authenticate = async (user) => {
    const expiresIn = '2 days';
    const accessToken = jwt.sign(
        { id: user.id },
        process.env.SECRET,
        { expiresIn: expiresIn }
    );

    return {
        user: user,
        access_token: accessToken,
        expires_in: expiresIn
    }
}

// const authorize = async (password, hash) => {
//     // use bcrypt to properly compare user plaintext pw to hash
// }

// exports.authorize = authorize;

exports.signup = async (req, res, next) => {
    if( !req.body.display_name || !req.body.email || !req.body.password ) {
        return res.status(400).json({ message: 'Missing fields' });
    }
    
    try {
        // check if user with given email already exists
        // .any is used to not throw an error if the query doesn't return any data
        const users = await db.any(queries.findUser, [req.body.email]);
        if(users.length) return res.status(400).json({ message: 'Account with that email already exists' });

        const user = [
            req.body.display_name,
            req.body.email,
            bcrypt.hashSync(req.body.password, saltRounds),
            req.body.first_name || null,
            req.body.last_name || null,
        ];

        // otherwise add new user with given info
        // .none returns null if successful
        await db.none(queries.addUser, user);

        // get user with given email (minus their password)
        const { password, ...userWithoutPw } = await db.one(queries.findUser, [req.body.email]);
        // authenticate user
        const authentication = await authenticate(userWithoutPw);
        
        // success; return user info, access token and expiration
        return res.status(200).json(authentication);
    }
    catch(error) {
        if(error) return next(error);
    }
}

// exports.login = async (req, res, next) => {
//     try {
//         if (!req.body.email || !req.body.password) {
//             return res.status(400).json({ message: 'Missing fields' });
//         }
//         const errorMessage = 'Email or password is incorrect';
//         // verify that user with given email already exists
//         // .any is used to not throw an error if the query doesn't return any data
//         const users = await db.any(queries.findUser, [req.body.email]);
//         if (!users.length) return res.status(401).json({ message: errorMessage });

//         // plaintext pw
//         const password = req.body.password;
//         // user id, email and password in db
//         const { hash, ...user} = users[0];

//         // verify given password is correct by calling func called authorize with password and hash as params
//         // if incorrect return res.status(401).json({ message: errorMessage });
//         // else send token by calling authenticate func above with user as param
//     }
//     catch(error) {
//         if(error) return next(error);
//     }
// };

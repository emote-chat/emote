const path = require('path');

const db = require(path.join(__dirname, '../db/index'));
const queries = require(path.join(__dirname, '../db/queries'));

exports.getUserIdByEmail = async (req, res, next) => {
    try {
        const resp = await db.any(queries.findUserByEmail, [req.params.email]);
        if (!resp.length) return res.status(404).send({ message: 'User not found' });
        
        const { id } = resp[0];
        return res.status(200).json({ id });
    }
    catch(error) {
        if(error) return next(error);
    }
}
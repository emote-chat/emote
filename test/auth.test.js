const path = require('path');
const request = require('supertest');
const app = require(path.join(__dirname, '../src/config/app'));
const fs = require('fs');

// hard-coded user for testing
const user = { 
    display_name: 'manos',
    email: 'user@gmail.com', 
    password: 'gmail'
}

const invalidUser = {
    email: 'user@yahoo.com',
    password: 'yahoo'
}

// init db; drop and recreate tables
const initDb = async (db) => {
    const sql = fs.readFileSync(
        path.join(__dirname, '../src/db/init_db.sql')
    ).toString();
    await db.multi(sql);
}

describe('Test Suite for auth', () => {
    
    let server = null;
    let db = null;
    
    beforeAll(async (done) => {
        server = await app.listen();
        db = require(path.join(__dirname, '../src/config/db'));
        await initDb(db);
        done();
    })

    afterAll(async (done) => {
        await db.$pool.end();
        await server.close(done);
        done();
    })

    // POST /api/signup
    test('POST /api/signup with no data should respond with 400', async (done) => {
        const res = await request(server).post('/api/signup');
        // expect error since missing data
        expect(res.statusCode).toBe(400);
        done();
    });

    test('POST /api/signup should respond with 200', async (done) => {
        const res = await request(server).post('/api/signup').send(user);

        // expect success
        expect(res.statusCode).toBe(200);

        // verify response data is correct
        expect(JSON.parse(res.text)).toEqual({
            user: {
                id: expect.any(Number),
                display_name: user.display_name,
                email: user.email,
                first_name: null,
                last_name: null,
            },
            access_token: expect.any(String),
            expires_in: expect.any(String)
        });
        
        done();
    });
    
    test('POST /api/signup with same email of existing user should respond with 400', async (done) => {
        const res = await request(server).post('/api/signup').send(user);
        // expect error since can only have one account per email
        expect(res.statusCode).toBe(400);
        done();
    });

    // POST /api/login
    test('POST /api/login with no data should respond with 400', async (done) => {
        const res = await request(server).post('/api/login');
        // expect error since missing data
        expect(res.statusCode).toBe(400);
        done();
    });

    test('POST /api/login should respond with 200', async (done) => {
        const {display_name, ...testUser} = user;
        const res = await request(server).post('/api/login').send(testUser);
	
        // expect success
	    expect(res.statusCode).toBe(200);

        // verify response data is correct
        expect(JSON.parse(res.text)).toEqual({
            user: {
                id: expect.any(Number),
                display_name: user.display_name,
                email: user.email,
                first_name: null,
                last_name: null,
            },
            access_token: expect.any(String),
            expires_in: expect.any(String)
        });
        
        done();
    });
    
    test('POST /api/login with invalid email should respond with 401', async (done) => {
        const res = await request(server).post('/api/login').send({
            email: invalidUser.email,
            password: user.password
        });
        // expect error since email is incorrect
        expect(res.statusCode).toBe(401);
        done();
    });

    test('POST /api/login with invalid password should respond with 401', async (done) => {
        const res = await request(server).post('/api/login').send({
            email: user.email,
            password: invalidUser.password
        });
	
        // expect error since password is incorrect
        expect(res.statusCode).toBe(401);
        done();
    });

});

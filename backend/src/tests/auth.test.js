const request = require('supertest')
const app = require('./testApp')

require('./setup')

// helper — registers a user and returns the cookies + user data
const registerUser = async (data = {}) => {
    const defaults = {
        username: 'TestUser',
        email: 'test@example.com',
        password: 'Test@1234'
    }
    const res = await request(app)
        .post('/api/auth/register')
        .send({ ...defaults, ...data })
    return res
}

describe('Auth — Register', () => {
    test('registers a new user successfully', async () => {
        const res = await registerUser()
        expect(res.status).toBe(201)
        expect(res.body.user.email).toBe('test@example.com')
        expect(res.body.user.isVerified).toBe(false)
    })

    test('fails if email already registered', async () => {
        await registerUser()
        const res = await registerUser()
        expect(res.status).toBe(400)
        expect(res.body.message).toBe('Email already registered')
    })

    test('fails with weak password', async () => {
        const res = await registerUser({ password: 'weakpass' })
        expect(res.status).toBe(400)
    })

    test('fails with missing fields', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ email: 'test@example.com' })
        expect(res.status).toBe(400)
        expect(res.body.message).toBe('All fields are required')
    })
})

describe('Auth — Login', () => {
    beforeEach(async () => {
        await registerUser()
    })

    test('logs in with correct credentials', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'Test@1234' })
        expect(res.status).toBe(200)
        expect(res.body.user.email).toBe('test@example.com')
        // both cookies should be set
        expect(res.headers['set-cookie']).toBeDefined()
    })

    test('fails with wrong password', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'WrongPass@1' })
        expect(res.status).toBe(400)
        expect(res.body.message).toBe('Invalid email or password')
    })

    test('fails with non-existent email', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({ email: 'nobody@example.com', password: 'Test@1234' })
        expect(res.status).toBe(400)
    })
})

describe('Auth — Logout', () => {
    test('logs out and clears cookies', async () => {
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'Test@1234' })

        // this won't work because afterEach clears DB — register first
        await registerUser()
        const loginRes2 = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'Test@1234' })

        const cookies = loginRes2.headers['set-cookie']
        const res = await request(app)
            .post('/api/auth/logout')
            .set('Cookie', cookies)
        expect(res.status).toBe(200)
        expect(res.body.message).toBe('Logged out successfully')
    })
})

describe('Auth — Token Refresh', () => {
    test('issues new access token using refresh token', async () => {
        await registerUser()
        const loginRes = await request(app)
            .post('/api/auth/login')
            .send({ email: 'test@example.com', password: 'Test@1234' })

        const cookies = loginRes.headers['set-cookie']
        const res = await request(app)
            .post('/api/auth/refresh')
            .set('Cookie', cookies)
        expect(res.status).toBe(200)
        expect(res.body.message).toBe('Token refreshed successfully')
        // new cookies should be issued
        expect(res.headers['set-cookie']).toBeDefined()
    })

    test('fails with no refresh token', async () => {
        const res = await request(app).post('/api/auth/refresh')
        expect(res.status).toBe(401)
    })
})
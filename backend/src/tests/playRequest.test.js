const request = require('supertest')
const app = require('./testApp')
require('./setup')

// helper — register + login a user, return cookies and user id
const createAndLoginUser = async (suffix = '1') => {
    const regRes = await request(app)
        .post('/api/auth/register')
        .send({
            username: `User${suffix}`,
            email: `user${suffix}@example.com`,
            password: 'Test@1234'
        })

    const cookies = regRes.headers['set-cookie']
    const userId = regRes.body.user._id || regRes.body.user.id


    // manually verify the user so they can send requests
    const mongoose = require('mongoose')
    await mongoose.connection.collection('users').updateOne(
        { email: `user${suffix}@example.com` },
        { $set: { isVerified: true } }
    )

    return { cookies, userId }
}

describe('Play Requests', () => {
    let user1, user2

    beforeEach(async () => {
        user1 = await createAndLoginUser('1')
        user2 = await createAndLoginUser('2')

        // give user2 a game so user1 can send a request
        await request(app)
            .put('/api/users/profile')
            .set('Cookie', user2.cookies)
            .send({ games: [{ name: 'chess', skillLevel: 'intermediate' }] })
    })

    test('sends a play request successfully', async () => {
        const res = await request(app)
            .post('/api/requests/send')
            .set('Cookie', user1.cookies)
            .send({
                receiverId: user2.userId,
                game: 'chess',
                location: 'home',
                proposedTime: new Date(Date.now() + 86400000).toISOString()
            })
        expect(res.status).toBe(201)
        expect(res.body.playRequest.game).toBe('chess')
        expect(res.body.playRequest.status).toBe('pending')
    })

    test('cannot send request to yourself', async () => {
        const res = await request(app)
            .post('/api/requests/send')
            .set('Cookie', user1.cookies)
            .send({
                receiverId: user1.userId,
                game: 'chess',
                location: 'home',
                proposedTime: new Date(Date.now() + 86400000).toISOString()
            })
        expect(res.status).toBe(400)
    })

    test('cannot send request for a game receiver does not play', async () => {
        const res = await request(app)
            .post('/api/requests/send')
            .set('Cookie', user1.cookies)
            .send({
                receiverId: user2.userId,
                game: 'cricket',
                location: 'local ground',
                proposedTime: new Date(Date.now() + 86400000).toISOString()
            })
        expect(res.status).toBe(400)
    })

    test('cannot send request with past proposed time', async () => {
        const res = await request(app)
            .post('/api/requests/send')
            .set('Cookie', user1.cookies)
            .send({
                receiverId: user2.userId,
                game: 'chess',
                location: 'home',
                proposedTime: new Date(Date.now() - 86400000).toISOString()
            })
        expect(res.status).toBe(400)
    })

    test('receiver can accept a request', async () => {
        // send request
        const sendRes = await request(app)
            .post('/api/requests/send')
            .set('Cookie', user1.cookies)
            .send({
                receiverId: user2.userId,
                game: 'chess',
                location: 'home',
                proposedTime: new Date(Date.now() + 86400000).toISOString()
            })
        const requestId = sendRes.body.playRequest._id

        // accept it
        const res = await request(app)
            .put(`/api/requests/${requestId}/respond`)
            .set('Cookie', user2.cookies)
            .send({ status: 'accepted' })
        expect(res.status).toBe(200)
        expect(res.body.playRequest.status).toBe('accepted')
    })

    test('receiver can decline a request', async () => {
        const sendRes = await request(app)
            .post('/api/requests/send')
            .set('Cookie', user1.cookies)
            .send({
                receiverId: user2.userId,
                game: 'chess',
                location: 'home',
                proposedTime: new Date(Date.now() + 86400000).toISOString()
            })
        const requestId = sendRes.body.playRequest._id

        const res = await request(app)
            .put(`/api/requests/${requestId}/respond`)
            .set('Cookie', user2.cookies)
            .send({ status: 'declined' })
        expect(res.status).toBe(200)
        expect(res.body.playRequest.status).toBe('declined')
    })

    test('sender can cancel a pending request', async () => {
        const sendRes = await request(app)
            .post('/api/requests/send')
            .set('Cookie', user1.cookies)
            .send({
                receiverId: user2.userId,
                game: 'chess',
                location: 'home',
                proposedTime: new Date(Date.now() + 86400000).toISOString()
            })
        const requestId = sendRes.body.playRequest._id

        const res = await request(app)
            .put(`/api/requests/${requestId}/cancel`)
            .set('Cookie', user1.cookies)
        expect(res.status).toBe(200)
        expect(res.body.playRequest.status).toBe('cancelled')
    })

    test('accepted requests appear in match history', async () => {
        const sendRes = await request(app)
            .post('/api/requests/send')
            .set('Cookie', user1.cookies)
            .send({
                receiverId: user2.userId,
                game: 'chess',
                location: 'home',
                proposedTime: new Date(Date.now() + 86400000).toISOString()
            })
        const requestId = sendRes.body.playRequest._id

        await request(app)
            .put(`/api/requests/${requestId}/respond`)
            .set('Cookie', user2.cookies)
            .send({ status: 'accepted' })

        const res = await request(app)
            .get('/api/requests/history')
            .set('Cookie', user1.cookies)
        expect(res.status).toBe(200)
        expect(res.body.history.length).toBe(1)
        expect(res.body.history[0].status).toBe('accepted')
    })

    test('unverified user cannot send requests', async () => {
        // register without verifying
        const regRes = await request(app)
            .post('/api/auth/register')
            .send({ username: 'Unverified', email: 'unverified@example.com', password: 'Test@1234' })

        const res = await request(app)
            .post('/api/requests/send')
            .set('Cookie', regRes.headers['set-cookie'])
            .send({
                receiverId: user2.userId,
                game: 'chess',
                location: 'home',
                proposedTime: new Date(Date.now() + 86400000).toISOString()
            })
        expect(res.status).toBe(403)
    })
})  
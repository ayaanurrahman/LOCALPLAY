import axios from 'axios'

// fetching /api via axios 
const api = axios.create({
    baseURL: '/api',
    withCredentials: true
})

export default api
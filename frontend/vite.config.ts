import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { reactRouter } from '@react-router/dev/vite'

export default defineConfig({
    plugins: [
        reactRouter(),
        tailwindcss(),
    ],
    server: {
    proxy: {
        '/api': 'http://localhost:3000',
        '/socket.io': {          // ← add this block
            target: 'http://localhost:3000',
            ws: true             // forward WebSocket upgrades
        }
    }
}
})
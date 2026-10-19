import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootUserReviewsPath = path.resolve(__dirname, '../user_reviews.json')

function userReviewsPlugin() {
  return {
    name: 'vite-plugin-user-reviews',
    configureServer(server) {
      if (fs.existsSync(rootUserReviewsPath)) {
        server.watcher.add(rootUserReviewsPath)
      }

      // Serve live user_reviews.json directly from repository root on every request
      server.middlewares.use((req, res, next) => {
        const url = req.url ? req.url.split('?')[0] : ''
        if (
          url === '/user_reviews.json' ||
          url === '/api/v1/analysis/user-reviews' ||
          url === '/api/user-reviews'
        ) {
          if (fs.existsSync(rootUserReviewsPath)) {
            try {
              const fileContent = fs.readFileSync(rootUserReviewsPath, 'utf-8')
              res.setHeader('Content-Type', 'application/json; charset=utf-8')
              res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate')
              res.setHeader('Pragma', 'no-cache')
              res.setHeader('Expires', '0')
              res.end(fileContent)
              return
            } catch (err) {
              console.error('Error reading root user_reviews.json:', err)
            }
          }
        }
        next()
      })
    },
    buildStart() {
      // Keep static bundles synced with root user_reviews.json
      if (fs.existsSync(rootUserReviewsPath)) {
        try {
          const content = fs.readFileSync(rootUserReviewsPath, 'utf-8')
          const publicTarget = path.resolve(__dirname, 'public/user_reviews.json')
          const dataTarget = path.resolve(__dirname, 'src/data/user_reviews.json')
          fs.writeFileSync(publicTarget, content, 'utf-8')
          fs.writeFileSync(dataTarget, content, 'utf-8')
        } catch (err) {
          console.error('Failed to sync user_reviews.json during build start:', err)
        }
      }
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    userReviewsPlugin(),
  ],
  resolve: {
    alias: {
      '@root_user_reviews': rootUserReviewsPath,
    },
  },
  server: {
    fs: {
      allow: ['..'],
    },
  },
})


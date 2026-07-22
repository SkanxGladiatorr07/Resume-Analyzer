import request from 'supertest'
import express from 'express'

// Simple health check route for testing
const app = express()

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'ResumeAI Backend Running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  })
})

describe('Health Check Endpoint', () => {
  it('should return 200 with health status', async () => {
    const res = await request(app).get('/api/health')
    
    expect(res.status).toBe(200)
    expect(res.body).toHaveProperty('success', true)
    expect(res.body).toHaveProperty('message')
    expect(res.body).toHaveProperty('timestamp')
  })

  it('should include environment in response', async () => {
    const res = await request(app).get('/api/health')
    
    expect(res.body).toHaveProperty('environment')
    expect(['development', 'production', 'test']).toContain(res.body.environment)
  })

  it('should return JSON content type', async () => {
    const res = await request(app).get('/api/health')
    
    expect(res.headers['content-type']).toMatch(/json/)
  })
})

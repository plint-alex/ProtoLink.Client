import React from 'react'

const TestPage: React.FC = () => {
  console.log('TestPage component is rendering!')
  console.log('Current URL:', window.location.href)
  console.log('Current pathname:', window.location.pathname)
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Test Page - WORKING!</h1>
      <p>This is a minimal test page to verify routing is working.</p>
      <p>Current URL: {window.location.href}</p>
      <p>If you can see this, the test route is working correctly!</p>
    </div>
  )
}

export default TestPage

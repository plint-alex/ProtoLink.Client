import React from 'react'

const HomePage: React.FC = () => {
  console.log('HomePage component is rendering!')
  console.log('Current URL:', window.location.href)
  console.log('Current pathname:', window.location.pathname)
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <h1>Home Page - WORKING!</h1>
      <p>This is a simple home page without any language functionality.</p>
      <p>Current URL: {window.location.href}</p>
      <p>If you can see this, the home route is working correctly!</p>
    </div>
  )
}

export default HomePage
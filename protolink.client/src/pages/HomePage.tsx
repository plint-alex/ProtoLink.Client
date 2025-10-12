import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '../store/store'
import { loadViewScript } from '../store/actions/thunkActions/entities'

const HomePage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const dispatch = useAppDispatch()
  
  const entityId = id || '4cca22a8-bf99-4c52-a753-c820969925c3'
  const entityViews = useAppSelector(state => state.entities.entityViews[entityId])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  useEffect(() => {
    setIsLoading(true)
    setError(null)
    
    dispatch(loadViewScript(entityId))
      .unwrap()
      .then(() => setIsLoading(false))
      .catch((err) => {
        setError(err.message || 'Failed to load dynamic view')
        setIsLoading(false)
      })
  }, [entityId, dispatch])
  
  // Loading state
  if (isLoading) {
    return <div style={{ padding: '20px', textAlign: 'center' }}>Loading dynamic view...</div>
  }
  
  // Error state - show server transpilation or client-side errors
  if (error) {
    return (
      <div style={{ 
        padding: '20px', 
        backgroundColor: '#ffebee', 
        border: '1px solid #f44336', 
        borderRadius: '4px',
        margin: '20px',
        color: '#c62828'
      }}>
        <h3 style={{ margin: '0 0 10px 0' }}>Dynamic View Error</h3>
        <p style={{ margin: 0, fontFamily: 'monospace' }}>{error}</p>
      </div>
    )
  }
  
  // Try to render dynamic component
  if (entityViews && entityViews.length > 0) {
    const viewId = entityViews[0].viewId
    
    if (viewId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const DynamicComponent = (window as any)[viewId]
      
      if (DynamicComponent && typeof DynamicComponent === 'function') {
        return <DynamicComponent entityId={entityId} />
      }
    }
  }
  
  // No dynamic view configured
  return (
    <div style={{ 
      padding: '20px', 
      backgroundColor: '#fff3e0', 
      border: '1px solid #ff9800', 
      borderRadius: '4px',
      margin: '20px',
      color: '#e65100'
    }}>
      <h3 style={{ margin: '0 0 10px 0' }}>No Dynamic View Configured</h3>
      <p style={{ margin: 0 }}>Entity ID: {entityId}</p>
    </div>
  )
}

export default HomePage
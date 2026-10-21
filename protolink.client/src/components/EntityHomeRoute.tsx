import React from 'react'
import { useParams } from 'react-router-dom'
import HomePage from '../pages/HomePage'
import NotFoundPage from '../pages/NotFoundPage'
import { parseEntityIdFromSegment } from '../services/search/searchHelpers'

/**
 * C2: `/:id` and `/:id/*` share HomePage when the first segment is a GUID
 * (or GUID-slug). Multi-segment non-GUID paths stay 404 (e.g. /does/not/match).
 */
const EntityHomeRoute: React.FC = () => {
    const { id, '*': splat } = useParams<{ id?: string; '*': string }>()
    if (splat && !parseEntityIdFromSegment(id)) {
        return <NotFoundPage />
    }
    return <HomePage />
}

export default EntityHomeRoute

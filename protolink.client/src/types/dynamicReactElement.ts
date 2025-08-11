import { FC } from 'react'
import { EntityViewMapping } from './view';

export type DynamicReactElement = FC<{ level: number; entityId: string; entityViews: EntityViewMapping[] }>
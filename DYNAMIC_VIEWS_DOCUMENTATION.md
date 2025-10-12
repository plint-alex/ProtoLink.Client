# Dynamic Views Documentation

## Overview

The ProtoLink system supports dynamic page rendering through server-side script transformation and client-side execution. This allows you to write React components using standard import/export syntax that get automatically transformed for execution in the browser.

## How Dynamic Page Rendering Works

### 1. **Server-Side Transformation Pipeline**

```
TSX/JSX Script → Import Transformation → JSX Transpilation → JavaScript
```

#### Step 1: Import Transformation
The server automatically converts standard ES6 import syntax to window-based global variable access:

**Input (TSX/JSX):**
```tsx
import React from 'react';
import { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';

const MyComponent = ({ entityId }) => {
  const [message, setMessage] = useState('Hello World');
  
  useEffect(() => {
    console.log('Component mounted');
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2}>
        <Typography variant="h4">{message}</Typography>
      </Paper>
    </Box>
  );
};

export default MyComponent;
```

**Output (Transformed):**
```javascript
const React = window['react'];
const useState = window['useState'];
const useEffect = window['useEffect'];
const Box = window['Box'];
const Typography = window['Typography'];
const Paper = window['Paper'];

const MyComponent = ({ entityId }) => {
  const [message, setMessage] = useState('Hello World');
  
  useEffect(() => {
    console.log('Component mounted');
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2}>
        <Typography variant="h4">{message}</Typography>
      </Paper>
    </Box>
  );
};

window['{id}'] = MyComponent;
```

#### Step 2: JSX Transpilation
The server uses Babel with ChakraCore to transpile JSX to `React.createElement` calls:

**Final Output (JavaScript):**
```javascript
const React = window['react'], useState = window['useState'], useEffect = window['useEffect'], Box = window['Box'], Typography = window['Typography'], Paper = window['Paper'], MyComponent = ({entityId:a})=>{const[b,c]=useState("Hello World");return useEffect(()=>{console.log("Component mounted")},[]),React.createElement(Box,{sx:{p:3}},React.createElement(Paper,{elevation:2},React.createElement(Typography,{variant:"h4"},b)))};
window["52f110cb-51a9-45ec-8c5d-66bdbc25f49f"] = MyComponent;
```

### 2. **Client-Side Execution**

1. **API Call**: Client calls `/api/entities/getView/{entityId}`
2. **Script Loading**: Server returns transpiled JavaScript
3. **Script Execution**: Client executes the JavaScript in a controlled environment
4. **Component Registration**: Component is registered in `window[viewId]`
5. **Rendering**: HomePage component renders the dynamic component

### 3. **Error Handling**

- **Server Transpilation Errors**: Caught and returned as error responses
- **Client Execution Errors**: Displayed in error UI with monospace formatting
- **Network Errors**: Shown with clear error messages

## How to Write Proper Dynamic Pages

### 1. **Basic Component Structure**

```tsx
// Use standard import syntax - server will transform it
import React from 'react';
import { useState, useEffect } from 'react';
import { Box, Typography, Paper } from '@mui/material';

const MyDynamicView = ({ entityId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Your initialization logic here
    setLoading(false);
  }, [entityId]);

  if (loading) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>Loading...</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Paper elevation={2} sx={{ p: 2 }}>
        <Typography variant="h4" gutterBottom>
          Dynamic View for Entity: {entityId}
        </Typography>
        <Typography variant="body1">
          This is a dynamically rendered component!
        </Typography>
      </Paper>
    </Box>
  );
};

export default MyDynamicView;
```

### 2. **Best Practices**

#### ✅ **DO:**
- Use standard import/export syntax
- Use React hooks (useState, useEffect, etc.)
- Use Material-UI components
- Handle loading and error states
- Use the `entityId` prop passed to your component
- Write clean, readable JSX

#### ❌ **DON'T:**
- Use TypeScript type annotations (they'll be stripped)
- Use complex TypeScript features (generics, interfaces, etc.)
- Use external libraries not available in window globals
- Use CommonJS require() syntax
- Use dynamic imports
- Access DOM directly (use React patterns instead)

### 3. **Advanced Patterns**

#### API Calls in Dynamic Views
```tsx
import React, { useState, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';

const DataFetcher = ({ entityId }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Use the internal API helper
      const result = await window.internal.apiRequest(
        `entities/getEntity/${entityId}`, 
        'GET'
      );
      setData(result);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Button onClick={fetchData} disabled={loading}>
        {loading ? 'Loading...' : 'Fetch Data'}
      </Button>
      {data && (
        <Typography sx={{ mt: 2 }}>
          Data: {JSON.stringify(data, null, 2)}
        </Typography>
      )}
    </Box>
  );
};

export default DataFetcher;
```

## Available Import List

### **React Core**
- `React` - Main React object
- `useState` - State hook
- `useEffect` - Effect hook
- `useMemo` - Memoization hook
- `useCallback` - Callback hook
- `createElement` - React.createElement function

### **Material-UI Components**
- `Box` - Layout component
- `Typography` - Text component
- `Button` - Button component
- `TextField` - Input component
- `Paper` - Surface component
- `Grid` - Grid layout
- `Container` - Container component
- `Card` - Card component
- `CardContent` - Card content
- `CardActions` - Card actions

### **Material-UI Package Access**
- `mui` or `@mui/material` - Full Material-UI package access
- `window['mui']` - Alternative access method

### **Internal Helpers**
- `window.internal.apiRequest(path, method, body?)` - API request helper

## Current Limitations

### 1. **TypeScript Limitations**
- ❌ Type annotations are stripped during transpilation
- ❌ Interface definitions are removed
- ❌ Generic types are simplified
- ❌ Complex TypeScript features not supported

### 2. **Import Limitations**
- ❌ Only supports imports from `'react'` and `'@mui/material'`
- ❌ No support for relative imports (`'./Component'`)
- ❌ No support for external npm packages
- ❌ No support for dynamic imports

### 3. **Execution Environment**
- ❌ No access to Node.js APIs
- ❌ Limited to browser-compatible JavaScript
- ❌ No file system access
- ❌ No process.env access

### 4. **Performance Considerations**
- ⚠️ Scripts are transpiled on every request (cached for 10 seconds)
- ⚠️ Large components may impact initial load time
- ⚠️ No code splitting support

### 5. **Development Limitations**
- ❌ No TypeScript intellisense in dynamic scripts
- ❌ No hot reloading for dynamic views
- ❌ Limited debugging capabilities
- ❌ No source maps

## How to Extend Available Import List

### 1. **Add New Global Imports (Client-Side)**

Edit `D:\- Projects\ProtoLink.Client\protolink.client\src\App.tsx`:

```typescript
// Add new imports to the window object
import * as newLibrary from 'some-library';

// In the window setup section:
w['newLibrary'] = newLibrary;
w['NewComponent'] = newLibrary.NewComponent;
w['newUtility'] = newLibrary.utility;
```

### 2. **Update Server-Side Transformation**

Edit `D:\- Projects\ProtoLink.Api\ProtoLink.Api\Controllers\Entities\EntitiesController.cs`:

In the `TransformImportsToWindowSyntax` method, add support for new import sources:

```csharp
else if (sourcePart == "some-library")
{
    // Handle new library imports
    if (importPart.StartsWith("{") && importPart.EndsWith("}"))
    {
        var items = importPart.Substring(1, importPart.Length - 2)
            .Split(',')
            .Select(x => x.Trim())
            .Where(x => !string.IsNullOrEmpty(x))
            .ToList();
        
        foreach (var item in items)
        {
            transformedLines.Add($"const {item} = window['{item}'];");
        }
    }
}
```

### 3. **Example: Adding Lodash Support**

**Client-Side (App.tsx):**
```typescript
import * as _ from 'lodash';

// Add to window setup:
w['lodash'] = _;
w['_'] = _;
```

**Server-Side (EntitiesController.cs):**
```csharp
else if (sourcePart == "lodash")
{
    if (importPart == "_" || importPart == "lodash")
    {
        transformedLines.Add($"const {importPart} = window['lodash'];");
    }
}
```

**Usage in Dynamic Script:**
```tsx
import _ from 'lodash';

const MyComponent = ({ entityId }) => {
  const numbers = [1, 2, 3, 4, 5];
  const doubled = _.map(numbers, n => n * 2);
  
  return <div>{doubled.join(', ')}</div>;
};

export default MyComponent;
```

## Troubleshooting

### Common Issues

1. **"Component not found on window"**
   - Check if the component is properly exported
   - Verify the viewId matches the window key
   - Ensure server transformation completed successfully

2. **"Import not supported"**
   - Only `'react'` and `'@mui/material'` imports are supported
   - Use window globals for other libraries
   - Check if the import is added to the transformation logic

3. **"Syntax Error"**
   - Avoid TypeScript-specific syntax
   - Use plain JavaScript/JSX
   - Check for unsupported language features

4. **"Transpilation Failed"**
   - Check server logs for Babel errors
   - Simplify complex JSX patterns
   - Ensure all imports are properly transformed

### Debug Tips

1. **Check Browser Console**: Look for execution errors
2. **Check Network Tab**: Verify API responses
3. **Check Server Logs**: Look for transpilation errors
4. **Use Simple Components**: Start with basic components and add complexity gradually

## Performance Best Practices

1. **Keep Components Small**: Large components impact load time
2. **Minimize State**: Use local state efficiently
3. **Avoid Heavy Computations**: Move complex logic to useEffect
4. **Use Material-UI Efficiently**: Leverage built-in optimizations
5. **Cache API Calls**: Use internal state to avoid repeated requests

## Security Considerations

1. **Script Execution**: Dynamic scripts run in the browser with full user permissions
2. **API Access**: Components can make API calls using the internal helper
3. **Data Validation**: Always validate data from API responses
4. **XSS Prevention**: React's built-in XSS protection applies to dynamic components

---

This documentation covers the complete dynamic view system. For questions or issues, check the troubleshooting section or examine the server/client logs for specific error messages.

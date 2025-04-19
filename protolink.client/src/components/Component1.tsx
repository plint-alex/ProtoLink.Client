import { Suspense } from 'react';

//const Component2 = React.lazy(() => import('./Component2.tsx'));

const Component1 = () => {
    return (
        <>
            <div>Hi1</div>
            <Suspense fallback={<div>Loading...</div>}>
            
                {/*<Component2 />*/}
            </Suspense>
        </>

    );

}

export default Component1;
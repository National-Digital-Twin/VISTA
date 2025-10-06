import classNames from 'classnames';
import { Suspense, lazy } from 'react';

const AppBodyLoadedContents = lazy(() => import('./AppBodyLoadedContents'));

export interface AppBodyProps {
    /** Additional classes to add to the top-level element */
    readonly className?: string;
}

/** Body of the Paralog app, everything below the header */
export default function AppBody({ className }: AppBodyProps) {
    return (
        <main
            className={classNames(className)}
            style={{
                display: 'flex', // Ensure the main element uses flexbox
                flexDirection: 'column', // Stack children vertically
                flexGrow: 1, // Allow the main element to grow and fill the parent
                height: '100%', // Ensure it takes up the full height of the parent
            }}
        >
            <Suspense fallback={<p>Loading...</p>}>
                <AppBodyLoadedContents />
            </Suspense>
        </main>
    );
}

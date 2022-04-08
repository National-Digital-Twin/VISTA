import React, { useRef } from 'react'

export const ElementsContext = React.createContext()

const ElementsProvider = ({children}) => {
    const assetsRef = useRef()
    const connectionsRef = useRef()
    const updateElements = ({assets, connections}) => {
        assetsRef.current = assets
        connectionsRef.current = connections
    }
    return (
        <ElementsContext.Provider value={{updateElements, assetsRef, connectionsRef}}>
            {children}
        </ElementsContext.Provider>
    )
}

export default ElementsProvider
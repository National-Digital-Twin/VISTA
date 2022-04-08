import React, {useEffect,useState, useRef} from 'react'
import CytoscapeComponent from 'react-cytoscapejs';

const Network = ({assets =[], connections=[]}) => {
    const [layout, setLayout] = useState("concentric")
    const cyRef = useRef()
    const [elements, setElements] = useState([])
    // useEffect(()=>{
    //     cyRef.current.resize()
    // },[])
    useEffect(() => {
        const nodes= assets.map(asset=> ({
                
            data:{
                id: asset.uri,
                label: asset.id,
                style: {
                    "border-color": asset.scoreColour,
                    height: `${asset.count + 40}`,
                    width: `${asset.count + 40}`
                }
            },
            classes: asset.id.charAt(0)
        }   ))
        const links = connections.map(connection => ({
            data: connection,
            classes: `${connection.criticality}`
        }))
        setElements([...nodes, ...links])
       
    }, [assets, connections])
    useEffect(() => {
        
        cyRef.current.layout({name: layout}).run()
        cyRef.current.center()
        cyRef.current.fit()
            
       
    }, [elements, layout])
    
    return (
        <CytoscapeComponent
            layout={{name:layout}}
            cy={(cy)=> {
                cyRef.current= cy
            }}
            className="w-full h-full"
            elements={elements}
            stylesheet={[{
                'selector':'node',
                'style':{
                    'width':'60px',
                    'height':'60px',
                    'borderWidth':"4px",
                    'borderColor':"gray",
                    'background-color':"black",
                    'label': 'data(label)',
                    'color' : 'white',
                    'fontSize':'0.6em',
                    "text-valign": "center",
                    "text-halign": "center",
                    'text-margin-y':'10px',
                    'background-position-y':'5px'
                }
            },
            {
                'selector':'edge',
                'style':{
                    'curve-style':'haystack',
                    'color':'aqua',
                    'fontSize':'0.6em',
                    'label': 'data(label)' 
                }  
            },
            {
                'selector':'.F',
                'style':{
                    'background-image':'./assets/gas-station-fill-green.svg',
                    'background-color':'black'
                }
            },
            {
                'selector':'.M',
                'style':{
                    'background-image':'./assets/medical_services_green_24dp.svg',
                    'background-color':'black'
                }
            },
            {
                'selector':'.C',
                'style':{
                    'background-image':'./assets/phone-fill-coral.svg',
                    'background-color':'black'
                }
            },                        
            {
                'selector':'.W',
                'style':{
                    'background-color':'black',
                    'background-image':'./assets/drop-fill-blue.svg',

                }
            },                        
            {
                'selector':'.T',
                'style':{
                    'background-image':'./assets/car-fill-aqua.svg',
                    'background-color':'black'
                }
            },                        
            {
                'selector':'.E',
                'style':{
                    'background-image':'./assets/battery-charge-fill-teal.svg',
                    'background-color':'black'
                }
            },   
            {                     
                'selector':'.1',
                'style':{
                    'line-color':'Yellow'
                }
            },                        
            {                     
                'selector':'.2',
                'style':{
                    'line-color':'Goldenrod'
                }
            },                        
            {                     
                'selector':'.3',
                'style':{
                    'line-color':'Red'
                }
            },                        
            {
                'selector':':selected',
                'style':{
                    'background-color':'white',
                    'borderWidth':"4px",
                    'borderColor':"white",
                    "color":"black"
                }
            },]}
            >

        </CytoscapeComponent>
    )
}

export default Network
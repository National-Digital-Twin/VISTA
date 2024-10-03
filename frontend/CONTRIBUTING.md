# Contributing Guide / Getting Started for Developers



Welcome to the C477 frontend development guide! This document will help you get started with our project and guide you through various aspects of our development environment, tools, and best practices.



## Prerequisites



### TypeScript



We use TypeScript for its powerful type-checking and IntelliSense capabilities, which make development more efficient and less error-prone than JavaScript.



- [JavaScript in 15 minutes](https://learnxinyminutes.com/docs/javascript/)

- [TypeScript in 5 minutes](https://learnxinyminutes.com/docs/typescript/)



Ensure you understand how types, interfaces, and generics work in TypeScript.



## Building Web Applications



### Base Technology



The foundation of any web application includes HTML, CSS, and JavaScript. However, this stack isn't very modular, and managing state with EventListeners can become cumbersome. Our solution: **React**.



### React



The C477 frontend is a React app. React allows us to build modular components that update reactively when data changes.



- [React Introduction](https://react.dev/)

- [React Tutorial](https://react.dev/learn)

- [Understanding Your UI as a Tree](https://react.dev/learn/understanding-your-ui-as-a-tree)



React components are exported as `.tsx` functions, often using hooks, and they return elements to be added to the component tree.



#### Useful Resources



- [JavaScript Frameworks - FreeCodeCamp](https://www.youtube.com/watch?v=cuHDQhDhvPE)

- [React Tutorial - Codevolution](https://www.youtube.com/watch?v=Tn6-PIqc4UM)

- [React Concepts - Fireship](https://www.youtube.com/watch?v=TNhaISOUy6Q)



### CSS Modules



We use CSS Modules to scope styles locally, improving code maintainability.



## Data Management



### Fetching Data



We fetch data from external APIs using Apollo Client for GraphQL.



Example:



```typescript

export const fetchRouteGeoJson = async (

  roadRouteInputParams: RoadRouteInputParams

): Promise<RoadRoute> => {

  const { data, errors } = await client.query({

    query: GET_ROAD_ROUTE,

    variables: {

      start: roadRouteInputParams.start,

      end: roadRouteInputParams.end,

      floodExtent: roadRouteInputParams.floodExtent

        ? JSON.stringify(roadRouteInputParams.floodExtent)

        : undefined,

    },

  });

};

```



### Cached Querying



We use Tanstack Query for cached querying of non-GraphQL APIs.



Example:



```typescript

export default function Sandbag() {

  const { data } = useQuery({

    queryKey: ["sandbag"],

    queryFn: () => fetchSandbagPlacements(),

  });

}

```



### State Management



We use Zustand for state management. Alistair has written some custom `createStore` code.



- [Zustand Documentation](https://zustand.docs.pmnd.rs/getting-started/introduction)



We also use React Error Boundaries to make the UI more resilient. If a part of the UI tree breaks, it only breaks up to the error boundary.



- [React Error Boundary](https://github.com/bvaughn/react-error-boundary)



Wrap an `ErrorBoundary` component around other React components to "catch" errors and render a fallback UI. The component supports several ways to render a fallback.


## Build Tool



We use Vite for building the project. Vite supports hot-reloading, so you can see changes without restarting the server.



- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode)



### Yarn



We use Yarn for package management because it is faster than npm and more feature-complete than Bun.



- [Bun](https://bun.sh/)


## Linting

We use ESLint to ensure code passes without infractions, freeing you up to focus on more important coding.


## Mapping



We use `React Map GL`, a suite of React components for `mapbox-gl` or `maplibre-gl`.



- [React Map GL Documentation](https://github.com/visgl/react-map-gl)

- [Maplibre GL Documentation](https://maplibre.org/maplibre-gl-js/docs/)



To understand the difference between a Map object, Source, and Layer, read [this Stack Overflow answer](https://stackoverflow.com/a/66379033).



### GL Expressions



Understanding GL expressions can help render thousands of objects efficiently on the GPU.



- [GL Expressions](https://docs.mapbox.com/style-spec/reference/expressions/)



## Custom Features



### Feature Flags



Use feature flags to keep your changes integrated with regular merges to the develop branch.



### Tool Interface



The Tool Interface simplifies frontend development by enabling the composition of tools into the map component.



1. **Exporting Components**



    Your code snippet indicates the export of several modules:



    - `TOOL_NAME`: A constant string representing the name of the tool.

    - `MapElements`: These render everything that can be rendered in Maplibre GL on the map. [List of things in Maplibre GL](https://maplibre.org/maplibre-gl-js/docs/API/#markers-and-controls).

    - `DetailPanel`: Detail Panels display extra tables and charts of information on click. We're using [Recharts](https://refine.dev/blog/recharts/) to make our charts.

    - `ToolbarTools`: A default export from `./Monitoring`.

    - `layers`: This duplicates `MapElements`.



You can create a structured, interactive React map application using MapLibre GL with these components. Each interface part contributes to the overall mapping functionality, from rendering data to providing user controls and detailed information.

### Styling

Standardised z-scores as follows:

- base layer + controls are all on z-index 0
- positioned overlays like the logos on 10
- dropdowns on 30
- tooltips on 100

Note this isn't comprehensive as:
- These can be relative to their parent rather than global
- Much of the ordering is set up by Tools (note that logos still appear above the details panel)


## Debugging & Troubleshooting



Here are various strategies to debug and troubleshoot issues in your development process:



- Use Insomnia to see the contents of API calls and ensure correct CORS headers. Supports import/export of API calls from a variety of formats. [Insomnia](https://formulae.brew.sh/cask/insomnia)

- Use `console.log()` to log data and inspect it in the developer console.

- Use the `debugger` statement to pause execution and inspect variables.

- Use the network tab to inspect failing queries.

- Use the terminal logs for the backend, ontology API, and frontend.

- Install the Chrome React Developer Tools extension, viewable in the developer tools under >> ⚛️ Components.

- Use the Tanstack Query DevTools to see and fetch query objects.

  - Use the Apollo Client Developer Tools Chrome extension to see and fetch GraphQL query objects.



Happy coding and contributing!

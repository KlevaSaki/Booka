// implement a debounce function
// the function should only run after the user stops 
//triggering it for X milliseconds

import { useEffect, useRef, useState } from "react"




// function debounce(fn, delay) {

//     let timeoutId: ReturnType<typeof setTimeout>;
    
//     return function(...args){
//         clearTimeout(timeoutId);

//         timeoutId = setTimeout(() => {
//             fn(...args)
//         }, delay)
//     }
// }

// function debounce(fn, delay) {

//     let timeoutId: ReturnType<typeof setTimeout>;
    
//     return function(...args){
//         clearTimeout(timeoutId);

//         timeoutId = setTimeout(() => {
//             fn(...args)
//         }, delay)
//     }
// }

// const handleSearch = debounce((query) => {
//     console.log("Searching for:", query)
// }, 500)

// handleSearch("A")


// function debounce (fn, delay) {
//     let timer;

//     clearTimeout(timer);

//     return function (...args) {
//         setTimeout(() => {
//             fn(...args)
//         }, delay)
//     }
// }

// const handleSearch = debounce((query) => {
//     console.log(query)
// }, 3000)

// handleSearch("A");


//Build a Debounced Search component

// import { useEffect, useState } from "react";

// function debounce (fn, delay) {
//     let timerId;

//     clearTimeout(timerId);

//     return function (...args) {
//         timerId = setTimeout(() => {
//             fn(...args)
//         }, delay)
//     }
// }

// const Search = () => {

//     const [ query, setQuery ] = useState("");
//     const [ debouncedQuery, setDebouncedQuery ] = useState("");

//     useEffect(() => {
//         const timer = setTimeout(() => {
//             setDebouncedQuery(query);
//         }, 500)

//         return () => clearTimeout(timer)
//     }, [query])


//     useEffect(() => {
//         if(!debouncedQuery) return;

//         console.log("Searching for:", debouncedQuery)
//     }, [debouncedQuery])

//     return (
//         <>
//             <h1>Search</h1>
//             <input value={query} onChange={e => setQuery(e.target.value)} placeholder="search"/>

//             <h4>Typed: {query}</h4>
//             <h4>Debounced: {debouncedQuery}</h4>
//         </>
//     )
// }

// import { useEffect } from "react"

// const useDebounce = (value, delay) => {
//     const [ debouncedValue, setDebouncedValue ] = useState(value)

//     useEffect(() => {
//         const timer = setTimeout(() => {
//             setDebouncedValue(value)
//         }, delay)


//         return () => clearTimeout(timer);
//     }, [value, delay])

//     return debouncedValue;
// }

// const greetings = (greeting: any) => {
//     return greeting
// }

// const debouncedGreetings = useDebounce(value, delay);

// debouncedGreetings("Hello")


//Build a usePrevious hook
// lets you access the value from the previous render

//It should take a current value, and generate next value, 
// meaning the current  value will be the old value.

// const usePrevious = (value : number) => {
//     const ref = useRef();

//     useEffect(() => {
//         ref.current = value;
//     }, [value])

//     return ref.current;
// }

// const Counter = () => {
//     const [ count, setCount ] = useState(0);
//     const prevCount = usePrevious(count);

//     return (
//         <>
//             <p>Current: {count}</p>
//             <p>Previous: {prevCount}</p>

//             <button onClick={() => setCount(c => c + 1)}>
//                 Increment
//             </button>
//         </>
//     )
// }


//Build a useLocalStorage Hook
// const useLocalStorage = (key, initialValue) => {
//     const [ value, setValue ] = useState(() => {
//         const storedValue = localStorage.getItem(key);

//         if(storedValue !== null) {
//             return JSON.parse(storedValue);
//         }

//         return initialValue;
//     })

//     useEffect(() => {
//         localStorage.setItem(key, JSON.stringify(value))
//     }, [key, value])

//     return [ value, setValue ]
// }


// // Build a searchable list with API fetching + debouncing + loading state

// // const debounce = (fn, delay) => {

// //     let timerId;

// //     return function (...args) {
// //         clearTimeout(timerId)

// //         timerId = setTimeout(() => {
// //             fn(...args)
// //         }, delay)

// //     }
// // }

// export const Search = () => {

//     const [ inputValue, setInputValue ] = useState("");
//     const [ debounceValue, setDebounceValue ] = useState("");

//     useEffect(() => {
//         const timer = setTimeout(() => {

//             setDebounceValue(inputValue);
//         }, 3000);

//         return () => clearTimeout(timer)
//     }, [inputValue]);


//     //fetch users from API
//     useEffect(() => {
//         if(!debounceValue) return;

//         async function fetchUsers() {
//             try {
//             const users = await fetch("https://jsonplaceholder.typicode.com/users");

//             const data = await users.json();

//             console.log("Users", data)

//         } catch (error) {
//             console.error(error)
//         }
//         }

//         fetchUsers();
//     }, [debounceValue])


//     return (
//         <>
//             <h2>Search</h2>
//             <input value={inputValue} onClick={(e) => setInputValue(e.target.value)} />
//         </>
//     )
// }


//Truck Load Optimization
const cargo = [
    { id: "A", weight: 4 },
  { id: "B", weight: 8 },
  { id: "C", weight: 1 },
  { id: "D", weight: 2 },
  { id: "E", weight: 6 },
  { id: "F", weight: 5 },
]


//function supposed to return a total weight that is <= truck capacity
// as close as possible to capacity
// total capacity is 26



const optimizeTruck = (cargo, capacity) => {
    let bestWeight = 0;
    let bestLoad = [];

    function backtrack(start, currentLoad, currentWeight) {
        if(currentWeight > capacity) return;

        if(currentWeight > bestWeight) {
            bestWeight = currentWeight;
            bestLoad = [...currentLoad]
        }

        for(let i = start; i < cargo.length; i++) {
            backtrack(
                i + 1,
                [...currentLoad, cargo[i].id],
                currentWeight + cargo[i].weight
            )
        }


    }

    backtrack(0, [], 0)

    return bestLoad;

    

}

optimizeTruck(cargo, 10);




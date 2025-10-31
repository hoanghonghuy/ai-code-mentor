import { LearningPath, LearningPathId } from "./types";

const allPaths: Record<LearningPathId, LearningPath> = {
    'js-basics': {
        id: 'js-basics',
        title: 'JavaScript for Beginners',
        modules: [
            {
                title: 'Module 1: The Basics',
                lessons: [
                    { id: 'js-1-1', title: 'What is JavaScript?', prompt: 'Explain what JavaScript is to a complete beginner. Use a simple analogy.', completed: false },
                    { id: 'js-1-2', title: 'Variables & Data Types', prompt: 'Teach me about JavaScript variables (var, let, const) and common data types (string, number, boolean, null, undefined). Provide code examples for each.', completed: false },
                    { id: 'js-1-3', title: 'Operators', prompt: 'Introduce me to JavaScript operators: arithmetic, assignment, comparison, and logical. Give me a simple example for each category.', completed: false },
                ],
            },
            {
                title: 'Module 2: Control Flow',
                lessons: [
                    { id: 'js-2-1', title: 'Conditional Statements', prompt: 'Explain `if`, `else if`, and `else` statements in JavaScript. Provide a practical code example of checking a user\'s age.', completed: false },
                    { id: 'js-2-2', title: 'Loops', prompt: 'Teach me about `for` and `while` loops in JavaScript. When should I use each one? Show me examples of counting from 1 to 5.', completed: false },
                    { id: 'js-2-3', title: 'Functions', prompt: 'What are functions in JavaScript? Explain how to declare them and call them, including parameters and return values. Create a function that adds two numbers.', completed: false },
                ],
            },
            {
                title: 'Module 3: Data Structures',
                lessons: [
                    { id: 'js-3-1', title: 'Arrays', prompt: 'Introduce me to JavaScript Arrays. How do I create them, access elements by index, and find the length? Show me how to add and remove items.', completed: false },
                    { id: 'js-3-2', title: 'Objects', prompt: 'Explain JavaScript Objects for storing key-value pairs. Show me how to create an object, access properties using dot and bracket notation, and add new properties.', completed: false },
                    { id: 'js-3-3', title: 'Array Methods', prompt: 'Teach me about useful array methods like `forEach`, `map`, and `filter`. Provide a simple example for each to manipulate an array of numbers.', completed: false },
                ]
            },
            {
                title: 'Module 4: The DOM',
                lessons: [
                    { id: 'js-4-1', title: 'What is the DOM?', prompt: 'What is the Document Object Model (DOM)? Explain it like I\'m 10 years old. How does it relate to HTML?', completed: false },
                    { id: 'js-4-2', title: 'Selecting Elements', prompt: 'How do I select HTML elements using JavaScript? Explain `getElementById`, `querySelector`, and `querySelectorAll`.', completed: false },
                    { id: 'js-4-3', title: 'Manipulating Elements', prompt: 'Teach me how to change the content (innerHTML, textContent) and style of an HTML element using JavaScript.', completed: false },
                    { id: 'js-4-4', title: 'Event Handling', prompt: 'What are events in JavaScript? Show me how to use `addEventListener` to run a function when a button is clicked.', completed: false },
                ]
            },
             {
                title: 'Module 5: Asynchronous JavaScript',
                lessons: [
                    { id: 'js-5-1', title: 'Intro to Asynchronicity', prompt: 'What is asynchronous programming in JavaScript? Explain the concept of the event loop and callbacks using a simple analogy.', completed: false },
                    { id: 'js-5-2', title: 'Promises', prompt: 'Teach me about Promises for handling async operations. Explain the `.then()` and `.catch()` methods with a simple `fetch` example.', completed: false },
                    { id: 'js-5-3', title: 'Async/Await', prompt: 'What is `async/await` syntax in JavaScript? Show me how it simplifies working with Promises by rewriting a `.then()` based fetch example.', completed: false },
                ]
            },
            {
                title: 'Project: Build a Todo List App',
                project: {
                    id: 'proj-todo-app',
                    title: 'Project: Build a Todo List App',
                    description: 'Apply your knowledge by building a functional Todo List application from scratch.',
                    steps: [
                        { id: 'proj-todo-1', title: 'Step 1: HTML Structure', prompt: 'Guide me in setting up the basic HTML structure for a Todo List app. I need an input field, a button to add tasks, and an unordered list to display the tasks.', completed: false },
                        { id: 'proj-todo-2', title: 'Step 2: Basic CSS Styling', prompt: 'Help me style the Todo List app with some basic CSS. Let\'s center the main container, style the input/button, and make the task list look clean.', completed: false },
                        { id: 'proj-todo-3', title: 'Step 3: Add New Tasks with JS', prompt: 'Teach me the JavaScript to add a new task. I need to get the value from the input, create a new list item, and append it to the task list when the button is clicked.', completed: false },
                        { id: 'proj-todo-4', title: 'Step 4: Mark Tasks as Complete', prompt: 'How can I add functionality to mark a task as complete? Let\'s make it so clicking on a task toggles a "completed" class that adds a line-through style.', completed: false },
                        { id: 'proj-todo-5', title: 'Step 5: Remove Tasks', prompt: 'I need a way to remove tasks. Help me add a "delete" button to each task item and write the JavaScript to remove the item from the list when its delete button is clicked.', completed: false },
                    ]
                }
            }
        ],
    },
    'python-basics': {
        id: 'python-basics',
        title: 'Python for Beginners',
        modules: [
            {
                title: 'Module 1: Introduction to Python',
                lessons: [
                    { id: 'py-1-1', title: 'What is Python?', prompt: 'Explain what Python is and why it\'s a popular language for beginners. What is it used for?', completed: false },
                    { id: 'py-1-2', title: 'Syntax and Variables', prompt: 'Teach me the basic syntax of Python, including variables and data types like integers, floats, strings, and booleans.', completed: false },
                    { id: 'py-1-3', title: 'Input and Output', prompt: 'Guide me in writing a simple program in Python that takes a user\'s name as input and prints a greeting.', completed: false },
                ],
            },
            {
                title: 'Module 2: Data Structures',
                lessons: [
                    { id: 'py-2-1', title: 'Lists', prompt: 'Introduce me to Lists in Python. How do I create them, access items, and add or remove elements?', completed: false },
                    { id: 'py-2-2', title: 'Tuples', prompt: 'What is a Tuple in Python and how is it different from a List? Provide an example.', completed: false },
                    { id: 'py-2-3', title: 'Dictionaries', prompt: 'Teach me about Dictionaries in Python for key-value storage. How do I create one and access its values?', completed: false },
                ],
            },
            {
                title: 'Module 3: Control Flow',
                lessons: [
                    { id: 'py-3-1', title: 'Conditional Logic', prompt: 'Explain `if`, `elif`, and `else` statements in Python with a code example.', completed: false },
                    { id: 'py-3-2', title: 'For Loops', prompt: 'How do `for` loops work in Python? Show me how to iterate over a list of items.', completed: false },
                    { id: 'py-3-3', title: 'While Loops', prompt: 'Explain `while` loops in Python and provide an example of a loop that counts down from 5.', completed: false },
                ],
            },
             {
                title: 'Module 4: Functions & Modules',
                lessons: [
                    { id: 'py-4-1', title: 'Defining Functions', prompt: 'Teach me how to define and call my own functions in Python using the `def` keyword. Include parameters and return values.', completed: false },
                    { id: 'py-4-2', title: 'Variable Scope', prompt: 'Explain local and global variables in Python. What is the scope of a variable?', completed: false },
                    { id: 'py-4-3', title: 'Importing Modules', prompt: 'How do I use code from other files or libraries? Explain the `import` statement, using the `math` module as an example.', completed: false },
                ],
            },
            {
                title: 'Project: Simple Calculator',
                project: {
                    id: 'proj-py-calculator',
                    title: 'Project: Simple Calculator',
                    description: 'Build a command-line calculator that can perform basic arithmetic.',
                    steps: [
                        { id: 'proj-py-calc-1', title: 'Step 1: Get User Input', prompt: 'Guide me to write Python code that asks the user for two numbers and an operator (+, -, *, /).', completed: false },
                        { id: 'proj-py-calc-2', title: 'Step 2: Perform Calculation', prompt: 'Help me write the logic using `if/elif/else` to check which operator was entered and perform the correct calculation.', completed: false },
                        { id: 'proj-py-calc-3', title: 'Step 3: Handle Division by Zero', prompt: 'What happens if the user tries to divide by zero? Help me add a check to prevent this error and print a warning message.', completed: false },
                        { id: 'proj-py-calc-4', title: 'Step 4: Put it in a Loop', prompt: 'How can I make the calculator run continuously? Guide me to wrap the code in a `while` loop so the user can perform multiple calculations.', completed: false },
                    ]
                }
            }
        ],
    },
    'csharp-basics': {
        id: 'csharp-basics',
        title: 'C# Fundamentals',
        modules: [
            {
                title: 'Module 1: Getting Started with C#',
                lessons: [
                    { id: 'cs-1-1', title: 'Intro to .NET & C#', prompt: 'What is C# and the .NET framework? Explain their relationship to a new programmer.', completed: false },
                    { id: 'cs-1-2', title: 'Basic Types & Variables', prompt: 'Show me how to declare variables in C# with types like `int`, `string`, `double`, and `bool`.', completed: false },
                    { id: 'cs-1-3', title: 'Console I/O', prompt: 'Teach me how to write output to the console with `Console.WriteLine` and read input with `Console.ReadLine` in C#.', completed: false },
                ],
            },
            {
                title: 'Module 2: Control Flow',
                lessons: [
                    { id: 'cs-2-1', title: 'If/Else Statements', prompt: 'Explain `if` and `else` statements in C# for conditional logic.', completed: false },
                    { id: 'cs-2-2', title: 'Switch Statements', prompt: 'What is a `switch` statement in C# and when is it useful? Provide an example.', completed: false },
                    { id: 'cs-2-3', title: 'Loops', prompt: 'Teach me about `for` and `while` loops in C#.', completed: false },
                ],
            },
            {
                title: 'Module 3: Methods and Classes',
                lessons: [
                    { id: 'cs-3-1', title: 'Writing Methods', prompt: 'How do I write my own methods in C#? Explain parameters, return types, and the `static` keyword.', completed: false },
                    { id: 'cs-3-2', title: 'Understanding Classes', prompt: 'What is a class in C#? Explain the concept of a class as a blueprint for objects.', completed: false },
                    { id: 'cs-3-3', title: 'Creating Objects', prompt: 'Show me how to create a simple `Person` class and create an instance (object) of it.', completed: false },
                ],
            },
            {
                title: 'Project: Text Adventure Game',
                project: {
                    id: 'proj-cs-adventure',
                    title: 'Project: Text Adventure Game',
                    description: 'Build the foundation for a simple text-based adventure game.',
                    steps: [
                        { id: 'proj-cs-adv-1', title: 'Step 1: The Game Loop', prompt: 'Guide me to set up a `while` loop that keeps the game running. It should prompt the user for a command each turn.', completed: false },
                        { id: 'proj-cs-adv-2', title: 'Step 2: The Player', prompt: 'Help me create a simple `Player` class in C# that has properties for `Name` and `Health`.', completed: false },
                        { id: 'proj-cs-adv-3', title: 'Step 3: Simple Commands', prompt: 'Teach me how to use an `if/else` or `switch` statement to handle simple commands like "look" and "quit".', completed: false },
                        { id: 'proj-cs-adv-4', title: 'Step 4: A Basic Room', prompt: 'Let\'s create a `Room` class with a `Description`. The "look" command should print the description of the current room.', completed: false },
                    ]
                }
            }
        ],
    },
    'go-basics': {
        id: 'go-basics',
        title: 'Go (Golang) Basics',
        modules: [
            {
                title: 'Module 1: The Go Language',
                lessons: [
                    { id: 'go-1-1', title: 'Why Go?', prompt: 'Explain the main features of the Go language and what it\'s commonly used for, especially in backend development.', completed: false },
                    { id: 'go-1-2', title: 'Packages and Functions', prompt: 'Teach me about packages in Go, starting with `main`, and how to write a simple function using `func`.', completed: false },
                    { id: 'go-1-3', title: 'Variables and Types', prompt: 'Show me how to declare variables in Go using `var` and the `:=` short declaration. Cover basic types like `string`, `int`, `float64`.', completed: false },
                ],
            },
            {
                title: 'Module 2: Data Structures',
                lessons: [
                    { id: 'go-2-1', title: 'Arrays', prompt: 'Explain fixed-size arrays in Go. How are they declared and used?', completed: false },
                    { id: 'go-2-2', title: 'Slices', prompt: 'What are slices in Go? Explain how they are more flexible than arrays. Show me how to create and append to a slice.', completed: false },
                    { id: 'go-2-3', title: 'Maps', prompt: 'Teach me about maps in Go for key-value storage. How do I create a map and add data to it?', completed: false },
                ],
            },
            {
                title: 'Module 3: Control & Concurrency',
                lessons: [
                    { id: 'go-3-1', title: 'Control Flow', prompt: 'Show me how to use `if/else` and `for` loops in Go. How is the `for` loop in Go different from other languages?', completed: false },
                    { id: 'go-3-2', title: 'Functions Deep Dive', prompt: 'Explain how functions in Go can return multiple values. Provide a simple example.', completed: false },
                    { id: 'go-3-3', title: 'Intro to Goroutines', prompt: 'What is a goroutine? Give a very simple explanation of how to start one using the `go` keyword for concurrent execution.', completed: false },
                ],
            },
            {
                title: 'Project: Simple Web Scraper',
                project: {
                    id: 'proj-go-scraper',
                    title: 'Project: Simple Web Scraper',
                    description: 'Build a basic web scraper to fetch the title of a webpage.',
                    steps: [
                        { id: 'proj-go-scr-1', title: 'Step 1: HTTP GET Request', prompt: 'Guide me to write Go code to make an HTTP GET request to a website (e.g., "https://example.com") using the `net/http` package.', completed: false },
                        { id: 'proj-go-scr-2', title: 'Step 2: Error Handling', prompt: 'Help me add error handling to the HTTP request. What should happen if the website is down?', completed: false },
                        { id: 'proj-go-scr-3', title: 'Step 3: Read the Body', prompt: 'Teach me how to read the response body from the HTTP request into a string.', completed: false },
                        { id: 'proj-go-scr-4', title: 'Step 4: Find the Title', prompt: 'How can I find the `<title>` tag in the HTML string? Guide me to use the `strings` package to extract the title.', completed:false },
                    ]
                }
            }
        ],
    },
    'java-basics': {
        id: 'java-basics',
        title: 'Java Essentials',
        modules: [
            {
                title: 'Module 1: Core Java Concepts',
                lessons: [
                    { id: 'java-1-1', title: 'The JVM', prompt: 'What is the Java Virtual Machine (JVM) and why is it important for the Java language? Explain "write once, run anywhere".', completed: false },
                    { id: 'java-1-2', title: 'Classes and Objects', prompt: 'Introduce the fundamental concepts of classes and objects in Java. Provide a simple `Car` class example with fields and a constructor.', completed: false },
                    { id: 'java-1-3', title: 'Control Flow', prompt: 'Teach me about `if/else` statements and `for` loops in Java.', completed: false },
                ],
            },
            {
                title: 'Module 2: Object-Oriented Programming',
                lessons: [
                    { id: 'java-2-1', title: 'Methods', prompt: 'Explain methods in Java. How are they defined within a class and called on an object?', completed: false },
                    { id: 'java-2-2', title: 'Inheritance', prompt: 'What is inheritance in Java? Explain with an example of a `Vehicle` superclass and a `Car` subclass.', completed: false },
                    { id: 'java-2-3', title: 'Polymorphism', prompt: 'Explain the concept of polymorphism in Java. How can an object take many forms?', completed: false },
                ],
            },
            {
                title: 'Module 3: Java Collections',
                lessons: [
                    { id: 'java-3-1', title: 'Arrays', prompt: 'Introduce me to arrays in Java for storing fixed-size lists of elements.', completed: false },
                    { id: 'java-3-2', title: 'ArrayList', prompt: 'What is an `ArrayList` in Java? How is it more flexible than a standard array?', completed: false },
                    { id: 'java-3-3', title: 'HashMap', prompt: 'Teach me how to use a `HashMap` in Java for storing key-value pairs.', completed: false },
                ],
            },
            {
                title: 'Project: Bank Account System',
                project: {
                    id: 'proj-java-bank',
                    title: 'Project: Bank Account System',
                    description: 'Build a simple console application to manage a bank account.',
                    steps: [
                        { id: 'proj-java-bank-1', title: 'Step 1: BankAccount Class', prompt: 'Guide me to create a `BankAccount` class in Java with properties for account number and balance, and methods for `deposit` and `withdraw`.', completed: false },
                        { id: 'proj-java-bank-2', title: 'Step 2: Add Logic', prompt: 'Help me add logic to the `withdraw` method to prevent withdrawing more money than is in the account.', completed: false },
                        { id: 'proj-java-bank-3', title: 'Step 3: Main Application', prompt: 'Teach me how to create a `Main` class to run the application, create a `BankAccount` object, and perform some deposits and withdrawals.', completed: false },
                        { id: 'proj-java-bank-4', title: 'Step 4: User Input', prompt: 'How can I get user input from the console? Guide me to use the `Scanner` class to let a user choose to deposit or withdraw.', completed: false },
                    ]
                }
            }
        ],
    },
    'frontend-basics': {
        id: 'frontend-basics',
        title: 'Web Frontend Basics',
        modules: [
            {
                title: 'Module 1: Building Blocks',
                lessons: [
                    { id: 'fe-1-1', title: 'HTML Structure', prompt: 'Explain the basic structure of an HTML document, including `<!DOCTYPE>`, `<html>`, `<head>`, and `<body>` tags.', completed: false },
                    { id: 'fe-1-2', title: 'CSS Fundamentals', prompt: 'Teach me how to style a simple HTML element using CSS. Explain selectors (tag, class, id), properties, and values.', completed: false },
                    { id: 'fe-1-3', title: 'The CSS Box Model', prompt: 'What is the CSS Box Model? Explain margin, border, padding, and content.', completed: false },
                    { id: 'fe-1-4', title: 'Intro to Flexbox', prompt: 'Introduce me to CSS Flexbox. How can I use it to easily center an item inside a container?', completed: false },
                ],
            },
            {
                title: 'Module 2: JavaScript for the Web',
                lessons: [
                     { id: 'fe-2-1', title: 'DOM Manipulation', prompt: 'Teach me how to use JavaScript to select an HTML element and change its text content.', completed: false },
                     { id: 'fe-2-2', title: 'Event Handling', prompt: 'Show me how to use JavaScript to listen for a button click and log a message to the console.', completed: false },
                     { id: 'fe-2-3', title: 'Fetching Data', prompt: 'How can I fetch data from an API using JavaScript? Show a simple example using the `fetch` function.', completed: false },
                ],
            },
            {
                title: 'Module 3: Introduction to React',
                lessons: [
                    { id: 'fe-3-1', title: 'What is React?', prompt: 'Explain what React is and why it is used for building user interfaces. What is a component?', completed: false },
                    { id: 'fe-3-2', title: 'JSX', prompt: 'What is JSX? Show me a simple example of a React component that renders an `<h1>` tag.', completed: false },
                    { id: 'fe-3-3', title: 'State and Props', prompt: 'Explain the difference between `state` and `props` in React. Provide a simple example of a component with state using the `useState` hook.', completed: false },
                ],
            },
            {
                title: 'Project: Interactive Portfolio Card',
                project: {
                    id: 'proj-fe-card',
                    title: 'Project: Interactive Portfolio Card',
                    description: 'Build a small, interactive card component for a portfolio website.',
                    steps: [
                        { id: 'proj-fe-card-1', title: 'Step 1: HTML & CSS', prompt: 'Guide me to create the HTML structure and basic CSS for a portfolio card, including an image, name, title, and a "Contact" button.', completed: false },
                        { id: 'proj-fe-card-2', title: 'Step 2: Add JavaScript', prompt: 'Help me write JavaScript so that when the "Contact" button is clicked, an alert pops up with an email address.', completed: false },
                        { id: 'proj-fe-card-3', title: 'Step 3: Convert to React', prompt: 'Let\'s rebuild this card as a React component. Guide me in creating a `PortfolioCard.js` file and converting the HTML to JSX.', completed: false },
                        { id: 'proj-fe-card-4', title: 'Step 4: Add State', prompt: 'Teach me how to use the `useState` hook in our React component to show or hide the email address below the card when the button is clicked, instead of using an alert.', completed: false },
                    ]
                }
            }
        ],
    },
    'fullstack-basics': {
        id: 'fullstack-basics',
        title: 'Full-Stack Concepts',
        modules: [
            {
                title: 'Module 1: The Big Picture',
                lessons: [
                    { id: 'fs-1-1', title: 'What is Full-Stack?', prompt: 'Explain what "full-stack development" means. What are the roles of the frontend, backend, and database?', completed: false },
                    { id: 'fs-1-2', title: 'Client-Server Model', prompt: 'Describe the client-server model. How do a browser (client) and a web server communicate using HTTP?', completed: false },
                    { id: 'fs-1-3', title: 'APIs', prompt: 'What is an API? Explain how a frontend application might get data from a backend using a simple analogy of a restaurant menu.', completed: false },
                ],
            },
            {
                title: 'Module 2: Backend Development',
                lessons: [
                    { id: 'fs-2-1', title: 'Backend Languages', prompt: 'What are some popular languages for backend development? Briefly mention Node.js (JavaScript), Python (Django/Flask), and Go.', completed: false },
                    { id: 'fs-2-2', title: 'What is a Server?', prompt: 'Explain what a web server is. Let\'s use Node.js and Express as an example. Show me the minimal code for a "Hello World" server.', completed: false },
                    { id: 'fs-2-3', title: 'REST APIs', prompt: 'What is a REST API? Explain the concepts of resources and HTTP verbs (GET, POST, PUT, DELETE).', completed: false },
                ],
            },
             {
                title: 'Module 3: Databases',
                lessons: [
                    { id: 'fs-3-1', title: 'What is a Database?', prompt: 'Explain the role of a database in a web application. Why not just store data in files?', completed: false },
                    { id: 'fs-3-2', title: 'SQL vs NoSQL', prompt: 'What is the main difference between SQL (like PostgreSQL) and NoSQL (like MongoDB) databases? Use an analogy.', completed: false },
                    { id: 'fs-3-3', title: 'Database Schemas', prompt: 'What is a database schema? Show a simple example of a schema for a `users` table with id, username, and email.', completed: false },
                ],
            },
            {
                title: 'Project: Simple API with Node.js',
                project: {
                    id: 'proj-fs-api',
                    title: 'Project: Simple API with Node.js',
                    description: 'Build a basic REST API that can serve a list of users.',
                    steps: [
                        { id: 'proj-fs-api-1', title: 'Step 1: Setup Express', prompt: 'Guide me to set up a new Node.js project and install Express.js. Create a basic server that listens on a port.', completed: false },
                        { id: 'proj-fs-api-2', title: 'Step 2: In-Memory Data', prompt: 'Let\'s create a simple array of user objects in our code to act as our temporary database.', completed: false },
                        { id: 'proj-fs-api-3', title: 'Step 3: GET Endpoint', prompt: 'Teach me how to create a GET endpoint at `/api/users` that returns the array of users as JSON.', completed: false },
                        { id: 'proj-fs-api-4', title: 'Step 4: POST Endpoint', prompt: 'Now, guide me to create a POST endpoint at `/api/users` that allows adding a new user to our array from the request body.', completed: false },
                    ]
                }
            }
        ],
    },
    'mobile-basics': {
        id: 'mobile-basics',
        title: 'Mobile Development Intro',
        modules: [
            {
                title: 'Module 1: Mobile Landscape',
                lessons: [
                    { id: 'mob-1-1', title: 'Native vs. Cross-Platform', prompt: 'Explain the difference between native mobile development (Swift/Kotlin) and cross-platform development (React Native/Flutter). What are the pros and cons?', completed: false },
                    { id: 'mob-1-2', title: 'UI/UX for Mobile', prompt: 'What are some key UI/UX design principles to keep in mind when building for small screens? Mention touch targets and navigation.', completed: false },
                    { id: 'mob-1-3', title: 'Setting up your Environment', prompt: 'What tools do I need to start mobile development? Explain Expo for React Native as an easy starting point.', completed: false },
                ],
            },
            {
                title: 'Module 2: Building a UI',
                lessons: [
                    { id: 'mob-2-1', title: 'Components', prompt: 'Explain the concept of components in mobile development (e.g., in React Native). What are `View`, `Text`, and `Button`?', completed: false },
                    { id: 'mob-2-2', title: 'Styling', prompt: 'How do you style components in a framework like React Native? Show me a simple example of a styled `View` and `Text`.', completed: false },
                    { id: 'mob-2-3', title: 'Layout with Flexbox', prompt: 'Explain how Flexbox is used for layout in modern mobile development to create responsive UIs.', completed: false },
                ],
            },
            {
                title: 'Module 3: State & Navigation',
                lessons: [
                    { id: 'mob-3-1', title: 'State Management', prompt: 'What is state in a mobile app? Using React Native as an example, explain the `useState` hook.', completed: false },
                    { id: 'mob-3-2', title: 'Handling User Input', prompt: 'Show me how to use a `TextInput` component to get input from a user and store it in state.', completed: false },
                    { id: 'mob-3-3', title: 'Navigation', prompt: 'How do users move between different screens in a mobile app? Briefly explain the concept of a Stack Navigator.', completed: false },
                ],
            },
            {
                title: 'Project: Simple Tip Calculator',
                project: {
                    id: 'proj-mob-tip',
                    title: 'Project: Simple Tip Calculator',
                    description: 'Build a basic tip calculator app using React Native components.',
                    steps: [
                        { id: 'proj-mob-tip-1', title: 'Step 1: The UI Layout', prompt: 'Guide me to create the UI for a tip calculator in React Native. I need a `TextInput` for the bill amount and `Text` components to display the tip and total.', completed: false },
                        { id: 'proj-mob-tip-2', title: 'Step 2: State Management', prompt: 'Help me set up state using `useState` to store the bill amount entered by the user.', completed: false },
                        { id: 'proj-mob-tip-3', title: 'Step 3: Calculation Logic', prompt: 'Teach me how to calculate a 15% tip and the total bill whenever the input amount changes.', completed: false },
                        { id: 'proj-mob-tip-4', title: 'Step 4: Displaying the Result', prompt: 'How do I display the calculated tip and total in the `Text` components? Make sure they are formatted as currency.', completed: false },
                    ]
                }
            }
        ],
    }
};

// Deep copy to prevent state mutation issues
export const learningPaths = JSON.parse(JSON.stringify(allPaths));

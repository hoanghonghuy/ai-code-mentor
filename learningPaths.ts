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
                title: 'Module 6: Modern JavaScript (ES6+)',
                lessons: [
                    { id: 'js-6-1', title: 'Arrow Functions', prompt: 'What are arrow functions in ES6? Explain their syntax and how `this` works differently compared to traditional functions.', completed: false },
                    { id: 'js-6-2', title: 'Destructuring', prompt: 'Teach me about array and object destructuring in ES6. Provide examples for both.', completed: false },
                    { id: 'js-6-3', title: 'Spread & Rest Operators', prompt: 'Explain the spread (`...`) and rest (`...`) operators. Show a practical example for each.', completed: false },
                    { id: 'js-6-4', title: 'Modules', prompt: 'What are JavaScript modules? Explain `import` and `export` syntax for sharing code between files.', completed: false },
                ]
            },
            {
                title: 'Module 7: Error Handling & Storage',
                lessons: [
                    { id: 'js-7-1', title: 'Error Handling', prompt: 'What is error handling in JavaScript? Explain `try...catch...finally` blocks with a practical example of parsing invalid JSON.', completed: false },
                    { id: 'js-7-2', title: 'Browser Storage', prompt: 'Explain the difference between `localStorage` and `sessionStorage`. Show me how to use them to store and retrieve simple string data.', completed: false },
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
                        { id: 'proj-todo-6', title: 'Step 6: Persist with Local Storage', prompt: 'My todos disappear when I refresh the page. Teach me how to use `localStorage` to save the tasks and load them when the app starts.', completed: false },
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
                    { id: 'py-2-2', title: 'Tuples & Sets', prompt: 'What is a Tuple in Python and how is it different from a List? Also, introduce me to Sets for storing unique items.', completed: false },
                    { id: 'py-2-3', title: 'Dictionaries', prompt: 'Teach me about Dictionaries in Python for key-value storage. How do I create one and access its values?', completed: false },
                ],
            },
            {
                title: 'Module 3: Control Flow',
                lessons: [
                    { id: 'py-3-1', title: 'Conditional Logic', prompt: 'Explain `if`, `elif`, and `else` statements in Python with a code example.', completed: false },
                    { id: 'py-3-2', title: 'For Loops', prompt: 'How do `for` loops work in Python? Show me how to iterate over a list of items and use the `range()` function.', completed: false },
                    { id: 'py-3-3', title: 'While Loops', prompt: 'Explain `while` loops in Python and provide an example of a loop that counts down from 5.', completed: false },
                ],
            },
             {
                title: 'Module 4: Functions & Modules',
                lessons: [
                    { id: 'py-4-1', title: 'Defining Functions', prompt: 'Teach me how to define and call my own functions in Python using the `def` keyword. Include parameters and return values.', completed: false },
                    { id: 'py-4-2', title: 'Variable Scope', prompt: 'Explain local and global variables in Python. What is the scope of a variable?', completed: false },
                    { id: 'py-4-3', title: 'Importing Modules', prompt: 'How do I use code from other files or libraries? Explain the `import` statement, using the `math` and `random` modules as examples.', completed: false },
                ],
            },
            {
                title: 'Module 5: Object-Oriented Programming',
                lessons: [
                    { id: 'py-5-1', title: 'Classes and Objects', prompt: 'Introduce me to Object-Oriented Programming in Python. How do I define a class and create an object (instance)?', completed: false },
                    { id: 'py-5-2', title: 'The __init__ Method', prompt: 'What is the `__init__` method (constructor) in a Python class? Show me how to use it to initialize object properties.', completed: false },
                    { id: 'py-5-3', title: 'Inheritance', prompt: 'Explain the concept of inheritance in Python. Create a base class and a subclass that inherits from it.', completed: false },
                ],
            },
            {
                title: 'Module 6: File I/O & Error Handling',
                lessons: [
                    { id: 'py-6-1', title: 'Reading from a File', prompt: 'Show me how to open and read a text file in Python using `with open(...) as f:`.', completed: false },
                    { id: 'py-6-2', title: 'Writing to a File', prompt: 'Teach me how to write and append text to a file in Python.', completed: false },
                    { id: 'py-6-3', title: 'Exception Handling', prompt: 'What are exceptions in Python? Explain `try`, `except`, and `finally` blocks for handling potential errors like `FileNotFoundError`.', completed: false },
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
                        { id: 'proj-py-calc-3', title: 'Step 3: Handle Errors', prompt: 'What happens if the user tries to divide by zero or enters invalid input? Help me add `try-except` blocks to handle these errors gracefully.', completed: false },
                        { id: 'proj-py-calc-4', title: 'Step 4: Refactor into Functions', prompt: 'Let\'s make our code cleaner. Guide me to refactor the calculation logic into its own function.', completed: false },
                        { id: 'proj-py-calc-5', title: 'Step 5: Put it in a Loop', prompt: 'How can I make the calculator run continuously? Guide me to wrap the code in a `while` loop so the user can perform multiple calculations and choose to exit.', completed: false },
                    ]
                }
            }
        ],
    },
    'typescript-basics': {
        id: 'typescript-basics',
        title: 'TypeScript Essentials',
        modules: [
            {
                title: 'Module 1: Why TypeScript?',
                lessons: [
                    { id: 'ts-1-1', title: 'What is TypeScript?', prompt: 'Explain what TypeScript is and how it relates to JavaScript. What are the main benefits of using it?', completed: false },
                    { id: 'ts-1-2', title: 'Setting up a TS Project', prompt: 'Guide me through setting up a basic TypeScript project, including initializing a `tsconfig.json` file and compiling a simple `.ts` file to `.js`.', completed: false },
                    { id: 'ts-1-3', title: 'Type Inference', prompt: 'What is type inference in TypeScript? Show me an example where I don\'t have to explicitly write the type.', completed: false },
                ],
            },
            {
                title: 'Module 2: Basic & Complex Types',
                lessons: [
                    { id: 'ts-2-1', title: 'Basic Types', prompt: 'Teach me about the basic types in TypeScript: `string`, `number`, `boolean`, `null`, `undefined`, and `any`.', completed: false },
                    { id: 'ts-2-2', title: 'Arrays and Tuples', prompt: 'How do I type arrays in TypeScript? Also, explain what a Tuple is and how it differs from a regular array.', completed: false },
                    { id: 'ts-2-3', title: 'Objects & Enums', prompt: 'Show me how to define the shape of an object using type annotations. Also introduce me to `enum` for named constants.', completed: false },
                    { id: 'ts-2-4', title: 'Union & Intersection Types', prompt: 'Explain union types (`|`) for variables that can be one of several types, and intersection types (`&`) for combining multiple types.', completed: false },
                ],
            },
            {
                title: 'Module 3: Interfaces and Functions',
                lessons: [
                    { id: 'ts-3-1', title: 'Type Aliases vs Interfaces', prompt: 'What are `type` aliases and `interface`s? Explain the differences and when I should use each one.', completed: false },
                    { id: 'ts-3-2', title: 'Typing Functions', prompt: 'Show me how to add types to function parameters and return values. Explain the `void` and `never` return types.', completed: false },
                    { id: 'ts-3-3', title: 'Optional & Default Parameters', prompt: 'How do I create functions with optional parameters (`?`) or parameters with default values in TypeScript?', completed: false },
                ]
            },
            {
                title: 'Module 4: Advanced Concepts',
                lessons: [
                    { id: 'ts-4-1', title: 'Generics', prompt: 'What are Generics in TypeScript? Explain how they allow us to create reusable components with a simple function or class example.', completed: false },
                    { id: 'ts-4-2', title: 'Using Types from Libraries', prompt: 'How do I use types from third-party libraries? Explain DefinitelyTyped and how to install type declaration files (e.g., `@types/node`).', completed: false },
                    { id: 'ts-4-3', title: 'Type Narrowing', prompt: 'Explain type narrowing using `typeof` and `instanceof` guards inside conditional blocks.', completed: false },
                ]
            },
            {
                title: 'Project: Refactor a JS App to TS',
                project: {
                    id: 'proj-ts-refactor',
                    title: 'Project: Refactor a JS App to TS',
                    description: 'Take a simple JavaScript To-Do list application and convert it to TypeScript, adding strong types for better safety and readability.',
                    steps: [
                        { id: 'proj-ts-ref-1', title: 'Step 1: The JS Codebase', prompt: 'Provide me with a simple, functional JavaScript To-Do list app. It should have functions to add, remove, and toggle tasks.', completed: false },
                        { id: 'proj-ts-ref-2', title: 'Step 2: Setup & First Types', prompt: 'Guide me to set up the TypeScript project. Let\'s start by creating an `interface` for a `Todo` item and typing the initial array of todos.', completed: false },
                        { id: 'proj-ts-ref-3', title: 'Step 3: Typing Functions', prompt: 'Help me add type annotations to all the functions (e.g., `addTodo`, `toggleTodo`). Ensure parameters and return values are correctly typed.', completed: false },
                        { id: 'proj-ts-ref-4', title: 'Step 4: DOM Interaction', prompt: 'Teach me how to correctly type DOM elements in TypeScript, such as `HTMLInputElement`, and handle potential `null` values when selecting elements.', completed: false },
                        { id: 'proj-ts-ref-5', title: 'Step 5: Final Review', prompt: 'Let\'s review the final TypeScript code. Explain the benefits we gained from this refactoring, like catching potential bugs and improving developer experience.', completed: false },
                    ]
                }
            }
        ],
    },
    'sql-basics': {
        id: 'sql-basics',
        title: 'SQL & Database Fundamentals',
        modules: [
            {
                title: 'Module 1: Introduction to Databases',
                lessons: [
                    { id: 'sql-1-1', title: 'What is a Relational Database?', prompt: 'Explain what a relational database is. Use an analogy of a spreadsheet with multiple sheets to explain tables, rows, and columns.', completed: false },
                    { id: 'sql-1-2', title: 'The SQL Language', prompt: 'What is SQL? Explain the different categories of SQL commands (DDL, DML, DQL).', completed: false },
                    { id: 'sql-1-3', title: 'Primary & Foreign Keys', prompt: 'Explain the concepts of Primary Keys for unique identification and Foreign Keys for linking tables together.', completed: false },
                ],
            },
            {
                title: 'Module 2: Querying Data (DQL)',
                lessons: [
                    { id: 'sql-2-1', title: 'The SELECT Statement', prompt: 'Teach me the basic `SELECT` statement. Show me how to select all columns (`*`) and specific columns from a table.', completed: false },
                    { id: 'sql-2-2', title: 'Filtering with WHERE', prompt: 'How do I filter rows? Explain the `WHERE` clause with operators like `=`, `!=`, `>`, `<`, `AND`, `OR`, and `IN`.', completed: false },
                    { id: 'sql-2-3', title: 'Sorting with ORDER BY', prompt: 'Teach me how to sort results using `ORDER BY`. Show me how to sort in ascending (`ASC`) and descending (`DESC`) order.', completed: false },
                    { id: 'sql-2-4', title: 'Aggregate Functions', prompt: 'What are aggregate functions? Explain `COUNT`, `SUM`, `AVG`, `MIN`, and `MAX` with examples.', completed: false },
                    { id: 'sql-2-5', title: 'Grouping with GROUP BY', prompt: 'Teach me how to use `GROUP BY` with aggregate functions to group rows that have the same values.', completed: false },
                ],
            },
            {
                title: 'Module 3: Manipulating Data (DML)',
                lessons: [
                    { id: 'sql-3-1', title: 'Inserting Data', prompt: 'Show me how to add a new row to a table using the `INSERT INTO` statement.', completed: false },
                    { id: 'sql-3-2', title: 'Updating Data', prompt: 'Teach me how to modify existing rows using the `UPDATE` statement. Emphasize the importance of the `WHERE` clause.', completed: false },
                    { id: 'sql-3-3', title: 'Deleting Data', prompt: 'How do I remove rows from a table? Explain the `DELETE` statement and the importance of the `WHERE` clause.', completed: false },
                ]
            },
            {
                title: 'Module 4: Joining Tables',
                lessons: [
                    { id: 'sql-4-1', title: 'INNER JOIN', prompt: 'Explain what an `INNER JOIN` is and how it\'s used to combine rows from two or more tables based on a related column.', completed: false },
                    { id: 'sql-4-2', title: 'LEFT & RIGHT JOIN', prompt: 'What is the difference between an `INNER JOIN`, a `LEFT JOIN`, and a `RIGHT JOIN`? Provide a simple example.', completed: false },
                ]
            },
            {
                title: 'Project: Design a Blog Database',
                project: {
                    id: 'proj-sql-blog',
                    title: 'Project: Design a Blog Database',
                    description: 'Design and write SQL queries for a simple blog with users, posts, and comments.',
                    steps: [
                        { id: 'proj-sql-blog-1', title: 'Step 1: Data Definition (DDL)', prompt: 'Guide me to write the `CREATE TABLE` statements for three tables: `users` (id, username, email), `posts` (id, user_id, title, body), and `comments` (id, post_id, user_id, text). Define primary and foreign keys.', completed: false },
                        { id: 'proj-sql-blog-2', title: 'Step 2: Insert Sample Data (DML)', prompt: 'Help me write `INSERT INTO` statements to populate the tables with some sample data: at least 2 users, 3 posts, and 5 comments.', completed: false },
                        { id: 'proj-sql-blog-3', title: 'Step 3: Basic Queries', prompt: 'Guide me to write a SQL query to select all posts. Then write another query to find all posts written by a specific user.', completed: false },
                        { id: 'proj-sql-blog-4', title: 'Step 4: Joining Tables', prompt: 'Teach me how to write a query that joins `posts` and `users` to show each post\'s title and the username of its author.', completed: false },
                        { id: 'proj-sql-blog-5', title: 'Step 5: Complex Query', prompt: 'Let\'s write a more complex query. Guide me to find a specific post, and show its title, author\'s username, and all the comments on it along with the commenter\'s username. This will require multiple joins.', completed: false },
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
                    { id: 'cs-2-3', title: 'Loops', prompt: 'Teach me about `for`, `while`, and `do-while` loops in C#.', completed: false },
                ],
            },
            {
                title: 'Module 3: Data Structures',
                lessons: [
                    { id: 'cs-3-1', title: 'Arrays', prompt: 'Introduce me to single-dimensional and multi-dimensional arrays in C#.', completed: false },
                    { id: 'cs-3-2', title: 'Lists', prompt: 'What is a `List<T>` in C#? How is it different from an array, and how do I use it?', completed: false },
                    { id: 'cs-3-3', title: 'Dictionaries', prompt: 'Teach me how to use a `Dictionary<TKey, TValue>` in C# to store key-value pairs.', completed: false },
                ],
            },
            {
                title: 'Module 4: Methods and Classes (OOP)',
                lessons: [
                    { id: 'cs-4-1', title: 'Writing Methods', prompt: 'How do I write my own methods in C#? Explain parameters, return types, and the `static` keyword.', completed: false },
                    { id: 'cs-4-2', title: 'Classes & Objects', prompt: 'Explain classes as blueprints for objects. Show me how to create a simple `Person` class with fields.', completed: false },
                    { id: 'cs-4-3', title: 'Constructors & Properties', prompt: 'What are constructors? And how do I use Properties (getters/setters) to encapsulate data in C#?', completed: false },
                    { id: 'cs-4-4', title: 'Inheritance', prompt: 'Teach me about inheritance in C#. Create a base class and a derived class.', completed: false },
                ],
            },
            {
                title: 'Module 5: Advanced C#',
                lessons: [
                    { id: 'cs-5-1', title: 'LINQ', prompt: 'What is LINQ? Show me a simple example of how to use it to query a `List` of objects.', completed: false },
                    { id: 'cs-5-2', title: 'Exception Handling', prompt: 'Introduce me to `try-catch-finally` blocks for handling errors in C#.', completed: false },
                    { id: 'cs-5-3', title: 'Async/Await', prompt: 'Explain the basics of asynchronous programming in C# using `async` and `await` with a simple example.', completed: false },
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
                        { id: 'proj-cs-adv-2', title: 'Step 2: The Player Class', prompt: 'Help me create a `Player` class in C# that has properties for `Name` and `Health`.', completed: false },
                        { id: 'proj-cs-adv-3', title: 'Step 3: The Room Class', prompt: 'Let\'s create a `Room` class with a `Description` and `Name`. The "look" command should print the description of the current room.', completed: false },
                        { id: 'proj-cs-adv-4', title: 'Step 4: Simple Commands', prompt: 'Teach me how to use a `switch` statement to handle simple commands like "look" and "quit".', completed: false },
                        { id: 'proj-cs-adv-5', title: 'Step 5: Moving Between Rooms', prompt: 'How can the player move? Modify the `Room` class to have exits (e.g., North, South). Help me implement a "go north" command.', completed: false },
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
                    { id: 'go-2-1', title: 'Arrays vs. Slices', prompt: 'Explain fixed-size arrays and flexible slices in Go. Show me how to create and append to a slice.', completed: false },
                    { id: 'go-2-2', title: 'Maps', prompt: 'Teach me about maps in Go for key-value storage. How do I create a map, add data, and check if a key exists?', completed: false },
                    { id: 'go-2-3', title: 'Structs', prompt: 'What are structs in Go? Show me how to define a custom data structure, like a `user` struct.', completed: false },
                ],
            },
            {
                title: 'Module 3: Control Flow & Functions',
                lessons: [
                    { id: 'go-3-1', title: 'Control Flow', prompt: 'Show me how to use `if/else` and `for` loops in Go. How is the `for` loop in Go used for `while` and infinite loops?', completed: false },
                    { id: 'go-3-2', title: 'Functions Deep Dive', prompt: 'Explain how functions in Go can return multiple values, especially for error handling. Provide a simple example.', completed: false },
                    { id: 'go-3-3', title: 'Pointers', prompt: 'What are pointers in Go? Explain when and why you would use them with a simple example.', completed: false },
                ],
            },
            {
                title: 'Module 4: Concurrency & Advanced Topics',
                lessons: [
                    { id: 'go-4-1', title: 'Methods on Structs', prompt: 'How do I define a method for a struct I created? Show an example.', completed: false },
                    { id: 'go-4-2', title: 'Interfaces', prompt: 'What are interfaces in Go? Explain their purpose with a common example like the `io.Reader` interface.', completed: false },
                    { id: 'go-4-3', title: 'Intro to Goroutines', prompt: 'What is a goroutine? Give a very simple explanation of how to start one using the `go` keyword for concurrent execution.', completed: false },
                    { id: 'go-4-4', title: 'Intro to Channels', prompt: 'What are channels in Go? Explain how they are used for communication between goroutines with a simple example.', completed: false },
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
                        { id: 'proj-go-scr-2', title: 'Step 2: Error Handling', prompt: 'Help me add proper error handling to the HTTP request. What should happen if the website is down?', completed: false },
                        { id: 'proj-go-scr-3', title: 'Step 3: Read the Body', prompt: 'Teach me how to read the response body using `io.ReadAll` and close the body to prevent resource leaks.', completed: false },
                        { id: 'proj-go-scr-4', title: 'Step 4: Find the Title', prompt: 'How can I find the `<title>` tag in the HTML string? Guide me to use the `strings` package to extract the title.', completed:false },
                        { id: 'proj-go-scr-5', title: 'Step 5: Scrape Multiple Sites', prompt: 'Let\'s make this concurrent. Guide me in creating a function to scrape a single site, then use goroutines to scrape a list of URLs at the same time.', completed:false },
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
                    { id: 'java-1-3', title: 'Data Types & Control Flow', prompt: 'Teach me about primitive data types, `if/else` statements, and `for` loops in Java.', completed: false },
                ],
            },
            {
                title: 'Module 2: Object-Oriented Programming',
                lessons: [
                    { id: 'java-2-1', title: 'Methods', prompt: 'Explain methods in Java. How are they defined within a class and called on an object? Cover method overloading.', completed: false },
                    { id: 'java-2-2', title: 'Encapsulation', prompt: 'What is encapsulation? Explain getters and setters and the `private` access modifier.', completed: false },
                    { id: 'java-2-3', title: 'Inheritance', prompt: 'What is inheritance in Java? Explain with an example of a `Vehicle` superclass and a `Car` subclass using the `extends` keyword.', completed: false },
                    { id: 'java-2-4', title: 'Polymorphism & Abstraction', prompt: 'Explain polymorphism and abstract classes in Java. How can an object take many forms?', completed: false },
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
                title: 'Module 4: Exception Handling & File I/O',
                lessons: [
                    { id: 'java-4-1', title: 'Try-Catch Blocks', prompt: 'Introduce me to exception handling in Java using `try` and `catch` blocks.', completed: false },
                    { id: 'java-4-2', title: 'Checked vs. Unchecked', prompt: 'What is the difference between checked and unchecked exceptions in Java?', completed: false },
                    { id: 'java-4-3', title: 'Reading a File', prompt: 'Show me how to read a text file line by line in Java using `BufferedReader`.', completed: false },
                ],
            },
            {
                title: 'Project: Bank Account System',
                project: {
                    id: 'proj-java-bank',
                    title: 'Project: Bank Account System',
                    description: 'Build a simple console application to manage a bank account.',
                    steps: [
                        { id: 'proj-java-bank-1', title: 'Step 1: BankAccount Class', prompt: 'Guide me to create a `BankAccount` class in Java with private fields for account number and balance, and a constructor.', completed: false },
                        { id: 'proj-java-bank-2', title: 'Step 2: Add Methods', prompt: 'Help me add public methods for `deposit`, `withdraw`, and `getBalance`. Implement logic in `withdraw` to prevent overdrawing.', completed: false },
                        { id: 'proj-java-bank-3', title: 'Step 3: Main Application', prompt: 'Teach me how to create a `Main` class to run the application, create a `BankAccount` object, and perform some deposits and withdrawals.', completed: false },
                        { id: 'proj-java-bank-4', title: 'Step 4: User Input', prompt: 'How can I get user input from the console? Guide me to use the `Scanner` class to let a user choose to deposit, withdraw, or check balance.', completed: false },
                        { id: 'proj-java-bank-5', title: 'Step 5: Error Handling', prompt: 'Improve the application by adding exception handling for invalid user input (e.g., entering text instead of a number).', completed: false },
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
                    { id: 'fe-1-4', title: 'Flexbox & Grid', prompt: 'Introduce me to CSS Flexbox for 1D layouts and CSS Grid for 2D layouts. Show a simple example for each.', completed: false },
                ],
            },
            {
                title: 'Module 2: JavaScript for the Web',
                lessons: [
                     { id: 'fe-2-1', title: 'DOM Manipulation', prompt: 'Teach me how to use JavaScript to select an HTML element and change its text content or attributes.', completed: false },
                     { id: 'fe-2-2', title: 'Event Handling', prompt: 'Show me how to use JavaScript to listen for a button click and log a message to the console.', completed: false },
                     { id: 'fe-2-3', title: 'Fetching Data (APIs)', prompt: 'How can I fetch data from a remote API using the `fetch` function and Promises in JavaScript?', completed: false },
                ],
            },
            {
                title: 'Module 3: Introduction to React',
                lessons: [
                    { id: 'fe-3-1', title: 'What is React?', prompt: 'Explain what React is and why it is used for building user interfaces. What is a component?', completed: false },
                    { id: 'fe-3-2', title: 'JSX and Props', prompt: 'What is JSX? Show me how to create a reusable component that accepts `props`.', completed: false },
                    { id: 'fe-3-3', title: 'State & Events', prompt: 'Explain component state using the `useState` hook. Show how to update state when a button is clicked.', completed: false },
                    { id: 'fe-3-4', title: 'Conditional Rendering', prompt: 'How do I show or hide components in React? Explain conditional rendering using the ternary operator or `&&`.', completed: false },
                ],
            },
             {
                title: 'Module 4: Intermediate React',
                lessons: [
                    { id: 'fe-4-1', title: 'Rendering Lists', prompt: 'How do I render a list of items from an array in React? Explain the use of `.map()` and the `key` prop.', completed: false },
                    { id: 'fe-4-2', title: 'The useEffect Hook', prompt: 'What is the `useEffect` hook for? Explain its use for side effects, like fetching data when a component mounts.', completed: false },
                    { id: 'fe-4-3', title: 'Handling Forms', prompt: 'Teach me the basics of handling forms in React, including controlled components.', completed: false },
                ],
            },
            {
                title: 'Module 5: Accessibility & Responsive Design',
                lessons: [
                    { id: 'fe-5-1', title: 'Web Accessibility (A11y)', prompt: 'What is web accessibility? Explain its importance and give three practical tips, like using semantic HTML and `alt` text for images.', completed: false },
                    { id: 'fe-5-2', title: 'Responsive Design', prompt: 'What is responsive design? Explain the concept of mobile-first and how to use CSS media queries with a simple example.', completed: false },
                ],
            },
            {
                title: 'Project: Simple Weather App',
                project: {
                    id: 'proj-fe-card',
                    title: 'Project: Simple Weather App',
                    description: 'Build a weather app that fetches and displays data from a public API.',
                    steps: [
                        { id: 'proj-fe-card-1', title: 'Step 1: Basic React Setup', prompt: 'Guide me to set up a basic React component for a weather app. It should have an input for a city name and a button.', completed: false },
                        { id: 'proj-fe-card-2', title: 'Step 2: State Management', prompt: 'Help me add state to store the city input and the fetched weather data.', completed: false },
                        { id: 'proj-fe-card-3', title: 'Step 3: Fetching API Data', prompt: 'Let\'s use a free weather API. Teach me how to fetch data for the entered city when the button is clicked.', completed: false },
                        { id: 'proj-fe-card-4', title: 'Step 4: Displaying Weather', prompt: 'Guide me to conditionally render the weather data (temperature, description) after it has been fetched. Also, handle loading and error states.', completed: false },
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
                title: 'Module 2: Backend with Node.js & Express',
                lessons: [
                    { id: 'fs-2-1', title: 'Intro to Node.js', prompt: 'What is Node.js and why is it used for backend development? Explain its event-driven, non-blocking nature.', completed: false },
                    { id: 'fs-2-2', title: 'Building a Server with Express', prompt: 'Explain what Express.js is. Show me the minimal code for a "Hello World" server.', completed: false },
                    { id: 'fs-2-3', title: 'REST APIs & Routing', prompt: 'What is a REST API? Explain resources, HTTP verbs (GET, POST), and how to set up basic routes in Express.', completed: false },
                ],
            },
             {
                title: 'Module 3: Databases',
                lessons: [
                    { id: 'fs-3-1', title: 'What is a Database?', prompt: 'Explain the role of a database in a web application. Why not just store data in files?', completed: false },
                    { id: 'fs-3-2', title: 'SQL vs NoSQL', prompt: 'What is the main difference between SQL (like PostgreSQL) and NoSQL (like MongoDB) databases? Use an analogy.', completed: false },
                    { id: 'fs-3-3', title: 'Connecting to a DB', prompt: 'Conceptually, how does a backend server connect to and query a database? Explain the role of a database driver or an ORM/ODM.', completed: false },
                ],
            },
             {
                title: 'Module 4: Connecting Frontend & Backend',
                lessons: [
                    { id: 'fs-4-1', title: 'CORS', prompt: 'What is Cross-Origin Resource Sharing (CORS) and why is it a common issue in full-stack development? How do you fix it on an Express server?', completed: false },
                    { id: 'fs-4-2', title: 'Fetching from React', prompt: 'Show me how to make a `fetch` request from a React frontend to a local Express backend API.', completed: false },
                    { id: 'fs-4-3', title: 'Environment Variables', prompt: 'What are environment variables and why are they important for security and configuration? Show a basic example with `.env` files in a Node.js app.', completed: false },
                ],
            },
            {
                title: 'Module 5: Authentication & Deployment',
                lessons: [
                    { id: 'fs-5-1', title: 'Authentication Concepts', prompt: 'Explain the basic concept of authentication. What is the difference between stateful (sessions) and stateless (JWT) authentication?', completed: false },
                    { id: 'fs-5-2', title: 'Password Hashing', prompt: 'Why should I never store passwords in plain text? Explain the concept of password hashing using a library like bcrypt.', completed: false },
                    { id: 'fs-5-3', title: 'Deployment Concepts', prompt: 'What does it mean to "deploy" an application? Briefly explain the role of a platform like Vercel or Heroku.', completed: false },
                ]
            },
            {
                title: 'Project: Full-Stack To-Do List',
                project: {
                    id: 'proj-fs-api',
                    title: 'Project: Full-Stack To-Do List',
                    description: 'Build a full-stack To-Do list with a React frontend and a Node.js/Express backend.',
                    steps: [
                        { id: 'proj-fs-api-1', title: 'Step 1: Setup Express API', prompt: 'Guide me to set up a new Node.js project and install Express.js. Create a basic server that listens on a port and has CORS enabled.', completed: false },
                        { id: 'proj-fs-api-2', title: 'Step 2: To-Do API Endpoints', prompt: 'Let\'s create an in-memory array for todos. Guide me to create two API endpoints: `GET /api/todos` to get all todos, and `POST /api/todos` to add a new one.', completed: false },
                        { id: 'proj-fs-api-3', title: 'Step 3: Setup React Frontend', prompt: 'Now, let\'s create a basic React app. It should have an input field to add a todo and a list to display them.', completed: false },
                        { id: 'proj-fs-api-4', title: 'Step 4: Connect React to API', prompt: 'Teach me how to use `useEffect` to fetch the list of todos from our backend when the component loads, and how to POST a new todo when the user submits the form.', completed: false },
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
                    { id: 'mob-1-3', title: 'Setting up with Expo', prompt: 'What tools do I need to start mobile development? Explain Expo for React Native as an easy starting point.', completed: false },
                ],
            },
            {
                title: 'Module 2: Building a UI with React Native',
                lessons: [
                    { id: 'mob-2-1', title: 'Core Components', prompt: 'Explain the basic components in React Native. What are `View`, `Text`, `Button`, and `StyleSheet`?', completed: false },
                    { id: 'mob-2-2', title: 'Layout with Flexbox', prompt: 'Explain how Flexbox is used for layout in React Native to create responsive UIs. Show me how to center an item.', completed: false },
                    { id: 'mob-2-3', title: 'Handling User Input', prompt: 'Show me how to use a `TextInput` component to get input from a user and an `TouchableOpacity` for custom buttons.', completed: false },
                ],
            },
            {
                title: 'Module 3: State & Navigation',
                lessons: [
                    { id: 'mob-3-1', title: 'State Management', prompt: 'What is state in a mobile app? Using React Native as an example, explain the `useState` hook.', completed: false },
                    { id: 'mob-3-2', title: 'Lists of Data', prompt: 'How do I render a list of items? Introduce the `FlatList` component for displaying scrollable lists efficiently.', completed: false },
                    { id: 'mob-3-3', title: 'Navigation', prompt: 'How do users move between different screens in a mobile app? Briefly explain React Navigation and the concept of a Stack Navigator.', completed: false },
                ],
            },
             {
                title: 'Module 4: Working with Data & Device APIs',
                lessons: [
                    { id: 'mob-4-1', title: 'Fetching API Data', prompt: 'How do I fetch data from a remote server in a React Native app? Show an example using `fetch` and `useEffect`.', completed: false },
                    { id: 'mob-4-2', title: 'Device Storage', prompt: 'How can I save data permanently on the user\'s device? Explain the basics of using a library like `AsyncStorage`.', completed: false },
                    { id: 'mob-4-3', title: 'Device Permissions', prompt: 'How do I ask for device permissions, for example, to use the Camera or Location? Briefly explain the concept.', completed: false },
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
                        { id: 'proj-mob-tip-3', title: 'Step 3: Calculation Logic', prompt: 'Teach me how to calculate a 15% tip and the total bill whenever the input amount changes. Handle cases where the input is not a valid number.', completed: false },
                        { id: 'proj-mob-tip-4', title: 'Step 4: Displaying the Result', prompt: 'How do I display the calculated tip and total in the `Text` components? Make sure they are formatted as currency.', completed: false },
                        { id: 'proj-mob-tip-5', title: 'Step 5: Add Tip Buttons', prompt: 'Let\'s add buttons (e.g., 10%, 15%, 20%) to let the user select a tip percentage quickly. Update the calculation logic to use the selected percentage.', completed: false },
                    ]
                }
            }
        ],
    }
};

// Deep copy to prevent state mutation issues
export const learningPaths = JSON.parse(JSON.stringify(allPaths));
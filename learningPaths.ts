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
                    { id: 'js-1-2', title: 'Variables & Data Types', prompt: 'Teach me about JavaScript variables (var, let, const) and common data types (string, number, boolean). Provide code examples for each.', completed: false },
                    { id: 'js-1-3', title: 'Operators', prompt: 'Introduce me to JavaScript operators: arithmetic, assignment, comparison, and logical. Give me a simple example for each category.', completed: false },
                ],
            },
            {
                title: 'Module 2: Control Flow',
                lessons: [
                    { id: 'js-2-1', title: 'Conditional Statements', prompt: 'Explain `if`, `else if`, and `else` statements in JavaScript. Provide a practical code example.', completed: false },
                    { id: 'js-2-2', title: 'Loops', prompt: 'Teach me about `for` and `while` loops in JavaScript. When should I use each one? Show me examples.', completed: false },
                    { id: 'js-2-3', title: 'Functions', prompt: 'What are functions in JavaScript? Explain how to declare them and call them, including parameters and return values.', completed: false },
                ],
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
                    { id: 'py-1-1', title: 'What is Python?', prompt: 'Explain what Python is and why it\'s a popular language for beginners.', completed: false },
                    { id: 'py-1-2', title: 'Syntax and Variables', prompt: 'Teach me the basic syntax of Python, including variables and data types like integers, floats, and strings.', completed: false },
                    { id: 'py-1-3', title: 'Your First Program', prompt: 'Guide me in writing a simple "Hello, World!" program in Python and explain how to run it.', completed: false },
                ],
            },
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
                    { id: 'cs-1-2', title: 'Basic Types & Variables', prompt: 'Show me how to declare variables in C# with types like `int`, `string`, and `bool`.', completed: false },
                ],
            },
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
                    { id: 'go-1-2', title: 'Packages and Functions', prompt: 'Teach me about packages in Go, starting with `main`, and how to write a simple function.', completed: false },
                ],
            },
        ],
    },
    'java-basics': {
        id: 'java-basics',
        title: 'Java Essentials',
        modules: [
            {
                title: 'Module 1: Core Java Concepts',
                lessons: [
                    { id: 'java-1-1', title: 'The JVM', prompt: 'What is the Java Virtual Machine (JVM) and why is it important for the Java language?', completed: false },
                    { id: 'java-1-2', title: 'Classes and Objects', prompt: 'Introduce the fundamental concepts of classes and objects in Java. Provide a simple `Car` class example.', completed: false },
                ],
            },
        ],
    },
    'frontend-basics': {
        id: 'frontend-basics',
        title: 'Web Frontend Basics',
        modules: [
            {
                title: 'Module 1: Building Blocks',
                lessons: [
                    { id: 'fe-1-1', title: 'HTML Structure', prompt: 'Explain the basic structure of an HTML document, including `<html>`, `<head>`, and `<body>` tags.', completed: false },
                    { id: 'fe-1-2', title: 'CSS Fundamentals', prompt: 'Teach me how to style a simple HTML element using CSS. Explain selectors, properties, and values.', completed: false },
                    { id: 'fe-1-3', title: 'Intro to Tailwind CSS', prompt: 'What is Tailwind CSS and how does it differ from regular CSS? Show me a simple example of styling a button.', completed: false },
                ],
            },
        ],
    },
    'fullstack-basics': {
        id: 'fullstack-basics',
        title: 'Full-Stack Concepts',
        modules: [
            {
                title: 'Module 1: The Big Picture',
                lessons: [
                    { id: 'fs-1-1', title: 'What is Full-Stack?', prompt: 'Explain what "full-stack development" means. What are the roles of the frontend and backend?', completed: false },
                    { id: 'fs-1-2', title: 'Client-Server Model', prompt: 'Describe the client-server model. How do a browser and a web server communicate?', completed: false },
                    { id: 'fs-1-3', title: 'APIs and Data', prompt: 'What is an API? Explain how a frontend application might get data from a backend using a simple analogy.', completed: false },
                ],
            },
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
                    { id: 'mob-1-2', title: 'UI/UX for Mobile', prompt: 'What are some key UI/UX design principles to keep in mind when building for small screens?', completed: false },
                ],
            },
        ],
    }
};

// Deep copy to prevent state mutation issues
export const learningPaths = JSON.parse(JSON.stringify(allPaths));
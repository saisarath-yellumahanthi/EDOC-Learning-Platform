export interface TheoryChapter {
  id: string;
  moduleNumber: number;
  title: string;
  categoryLabel: string;
  topics: string[];
  markdownContent: string;
  codeLanguage: string;
  codeFilename: string;
  codeExample: string;
  terminalCommand: string;
  terminalOutput: string[];
}

export interface LanguageTheoryTrack {
  id: 'c' | 'cpp' | 'java' | 'python';
  name: string;
  badge: string;
  compilerTag: string;
  description: string;
  chapters: TheoryChapter[];
}

export const PROGRAMMING_LANGUAGE_TRACKS: LanguageTheoryTrack[] = [
  {
    id: 'c',
    name: 'C',
    badge: '6 Modules',
    compilerTag: 'GCC 13.2 · ISO C17',
    description:
      'Structured systems programming, pointer arithmetic, manual memory management, structures, and low-level file I/O.',
    chapters: [
      {
        id: 'c-mod-1',
        moduleNumber: 1,
        title: 'Module 1: Introduction to C',
        categoryLabel: 'C Language · Module 1',
        topics: [
          'Language development',
          'Structured Programming',
          'Problem Solving Methodology',
          'Algorithms',
          'List of C standards',
          'Introduction to C',
          'C Character Set',
          'Identifiers and Keywords',
          'Variables and Constants',
          'Data Types',
          'Expressions',
          'Statements',
          'Compilation and Execution of C Programs',
        ],
        markdownContent: `### 1. Evolution & Structured Programming in C
Developed by Dennis Ritchie at Bell Labs, **C** is a general-purpose, procedural, imperative computer programming language that underpins modern operating systems kernels, embedded firmware, and language runtimes.

#### Core Topics Covered
- **Structured Programming & Problem Solving**: Top-down decomposition using functions, sequence, selection, and iteration constructs, supported by step-by-step **Algorithms**.
- **ISO C Standards**: Evolution from K&R C to **ANSI C (C89/C90)**, **C99**, **C11**, **C17**, and **C23**.
- **Tokens, Character Set, Identifiers & Keywords**: The C character set includes letters, digits, and special symbols. Reserved keywords (\`int\`, \`return\`, \`sizeof\`, \`struct\`, \`volatile\`) cannot be used as identifiers.
- **Variables, Constants & Data Types**: Primitive types include \`char\` (1 byte), \`int\` (4 bytes), \`float\` (4 bytes), and \`double\` (8 bytes), alongside qualifiers (\`signed\`, \`unsigned\`, \`short\`, \`long\`).
- **Compilation Pipeline**: Preprocessor (\`cpp\`) $\\rightarrow$ Compiler (\`cc1\`) $\\rightarrow$ Assembler (\`as\`) $\\rightarrow$ Linker (\`ld\`).`,
        codeLanguage: 'c',
        codeFilename: 'c_intro.c',
        codeExample: `#include <stdio.h>

int main(void) {
    const int c_standard = 2017;
    int width = 16, height = 4;
    int area = width * height;

    printf("Language: ISO C (Standard %d)\\n", c_standard);
    printf("Computed Area: %d bytes (sizeof int = %zu)\\n", area, sizeof(int));
    return 0;
}`,
        terminalCommand: 'gcc -std=c17 c_intro.c -o c_intro && ./c_intro',
        terminalOutput: [
          'Language: ISO C (Standard 2017)',
          'Computed Area: 64 bytes (sizeof int = 4)',
        ],
      },
      {
        id: 'c-mod-2',
        moduleNumber: 2,
        title: 'Module 2: Operators, Input/Output and Decision Making',
        categoryLabel: 'C Language · Module 2',
        topics: [
          'Arithmetic Operators',
          'Unary Operators',
          'Relational Operators',
          'Logical Operators',
          'Assignment Operators',
          'Conditional Operator',
          'Standard Library Functions',
          'Data Input and Output: getchar(), putchar(), scanf(), printf()',
          'Control Statements: if, if-else, Nested if-else, switch',
          'Loops: while, do-while, for',
          'Jump Statements: break, continue, goto',
          'Comma operator',
          'Debugging Techniques',
        ],
        markdownContent: `### 2. Operators, Formatted I/O & Control Flow
C provides rich operator precedence rules, standard I/O library routines in \`<stdio.h>\`, and deterministic branching constructs.

#### Core Topics Covered
- **Operators**: Arithmetic (\`+\`, \`-\`, \`*\`, \`/\`, \`%\`), Unary (\`++\`, \`--\`, \`!\`), Relational (\`<=\`, \`>=\`, \`==\`, \`!=\`), Logical (\`&&\`, \`||\`), Conditional ternary (\`? :\`), and the Comma operator (\`,\`).
- **Standard I/O**: Character-oriented \`getchar()\` / \`putchar()\` and formatted \`scanf()\` / \`printf()\`.
- **Decision & Looping**: \`if\`, \`if-else\`, nested \`if-else\`, multi-way \`switch\`, and iterative \`while\`, \`do-while\`, and \`for\` loops with \`break\`, \`continue\`, and \`goto\`.`,
        codeLanguage: 'c',
        codeFilename: 'c_control_io.c',
        codeExample: `#include <stdio.h>

int main(void) {
    int sum = 0;
    for (int i = 1; i <= 10; ++i) {
        if (i % 2 != 0) continue; // skip odd numbers
        sum += i;
    }
    const char *status = (sum >= 30) ? "PASS" : "CHECK";
    printf("Even sum [1..10] = %d | Status: %s\\n", sum, status);
    return 0;
}`,
        terminalCommand: 'gcc c_control_io.c -o c_control_io && ./c_control_io',
        terminalOutput: ['Even sum [1..10] = 30 | Status: PASS'],
      },
      {
        id: 'c-mod-3',
        moduleNumber: 3,
        title: 'Module 3: Arrays, Strings and Pointers',
        categoryLabel: 'C Language · Module 3',
        topics: [
          'Defining and Processing an array',
          'One-dimensional Arrays',
          'Two-dimensional Arrays',
          'Character Arrays',
          'Defining Strings',
          'Initialization of strings',
          'Reading and writing strings',
          'String Library Functions',
          'Pointer Basics',
          'Pointer Arithmetic',
          'Pointers and Arrays',
          'Arrays of Pointers',
          'Dynamic Memory Allocation',
        ],
        markdownContent: `### 3. Contiguous Arrays, Null-Terminated Strings & Pointers
In C, arrays decay to pointers to their first element, and strings are contiguous character arrays terminated by the null byte \`'\\0'\`.

#### Core Topics Covered
- **1D & 2D Arrays**: Contiguous row-major memory layout and indexing.
- **Strings & \`<string.h>\`**: \`strlen()\`, \`strcpy()\`, \`strcat()\`, and \`strcmp()\`.
- **Pointers & Dynamic Memory**: Address-of (\`&\`), dereference (\`*\`), pointer arithmetic (\`*(ptr + i)\`), arrays of pointers, and heap allocation via \`malloc()\`, \`calloc()\`, \`realloc()\`, and \`free()\`.`,
        codeLanguage: 'c',
        codeFilename: 'c_pointers.c',
        codeExample: `#include <stdio.h>
#include <stdlib.h>

int main(void) {
    int n = 4;
    int *arr = (int *)malloc(n * sizeof(int));
    for (int i = 0; i < n; ++i) {
        *(arr + i) = (i + 1) * 10;
    }
    printf("Pointer arithmetic *(arr + 2) = %d\\n", *(arr + 2));
    free(arr);
    return 0;
}`,
        terminalCommand: 'gcc c_pointers.c -o c_pointers && ./c_pointers',
        terminalOutput: ['Pointer arithmetic *(arr + 2) = 30'],
      },
      {
        id: 'c-mod-4',
        moduleNumber: 4,
        title: 'Module 4: Functions and Program Organization',
        categoryLabel: 'C Language · Module 4',
        topics: [
          'Defining a function',
          'Accessing a function',
          'Function Prototypes',
          'Function Calls',
          'Parameter passing',
          'Recursion',
          'Storage Classes',
          'Scope and Lifetime of Variables',
          'Static Variables',
          'Global Variables',
        ],
        markdownContent: `### 4. Modular Functions, Recursion & Storage Classes
Functions encapsulate reusable logic with explicit prototypes and well-defined variable lifetimes.

#### Core Topics Covered
- **Prototypes & Parameter Passing**: Pass-by-value versus simulated pass-by-reference using pointer parameters.
- **Recursion**: Base case and recursive step on the call stack.
- **Storage Classes**: \`auto\`, \`register\`, \`static\` (persistent state across calls), and \`extern\` (cross-translation-unit linkage).`,
        codeLanguage: 'c',
        codeFilename: 'c_functions.c',
        codeExample: `#include <stdio.h>

long factorial(int n) {
    return (n <= 1) ? 1 : n * factorial(n - 1);
}

int next_counter(void) {
    static int count = 0;
    return ++count;
}

int main(void) {
    printf("5! = %ld | Calls: %d, %d\\n", factorial(5), next_counter(), next_counter());
    return 0;
}`,
        terminalCommand: 'gcc c_functions.c -o c_functions && ./c_functions',
        terminalOutput: ['5! = 120 | Calls: 1, 2'],
      },
      {
        id: 'c-mod-5',
        moduleNumber: 5,
        title: 'Module 5: Structures and Unions',
        categoryLabel: 'C Language · Module 5',
        topics: [
          'Defining a structure',
          'Processing a Structure',
          'Arrays of Structures',
          'Nested Structures',
          'typedef',
          'Structures and Functions',
          'Structures and Pointers',
          'Self-Referential Structures',
          'Unions',
        ],
        markdownContent: `### 5. Composite Data Types: Structures, typedef & Unions
Structures (\`struct\`) group heterogeneous variables under a single aggregate record, while \`union\` shares the same memory location across members.

#### Core Topics Covered
- **Structures & Pointers**: Accessing members via the dot (\`.\`) operator and arrow (\`->\`) pointer operator.
- **Self-Referential Structures**: Building linked lists, trees, and graphs where a \`struct\` holds a pointer to its own type.`,
        codeLanguage: 'c',
        codeFilename: 'c_structs.c',
        codeExample: `#include <stdio.h>

typedef struct Node {
    int id;
    double score;
    struct Node *next;
} Node;

int main(void) {
    Node n2 = {102, 98.5, NULL};
    Node n1 = {101, 94.0, &n2};
    Node *curr = &n1;
    while (curr != NULL) {
        printf("Node #%d -> Score: %.1f\\n", curr->id, curr->score);
        curr = curr->next;
    }
    return 0;
}`,
        terminalCommand: 'gcc c_structs.c -o c_structs && ./c_structs',
        terminalOutput: [
          'Node #101 -> Score: 94.0',
          'Node #102 -> Score: 98.5',
        ],
      },
      {
        id: 'c-mod-6',
        moduleNumber: 6,
        title: 'Module 6: File Handling, Low Level Programming and Additional Features',
        categoryLabel: 'C Language · Module 6',
        topics: [
          'Why Files',
          'Opening and Closing a Data File',
          'Reading and Writing a Data File',
          'Processing a data File',
          'Register variables',
          'Bitwise Operations',
          'Bit Fields',
          'Enumerations',
          'Command Line Arguments',
          'More about Library functions',
          'Macros',
          'The C Preprocessor',
          "Brief overview of the difference's standards of C Language",
        ],
        markdownContent: `### 6. File Streams, Bitwise Manipulation & The C Preprocessor
Low-level systems programming relies on direct bit manipulation, \`FILE *\` stream descriptors, and preprocessor directives.

#### Core Topics Covered
- **File I/O**: \`fopen()\`, \`fclose()\`, \`fprintf()\`, \`fscanf()\`, \`fread()\`, \`fwrite()\`, and \`fseek()\`.
- **Bitwise Operations & Bit Fields**: \`&\`, \`|\`, \`^\`, \`~\`, \`<<\`, \`>>\`, compact struct bit-fields, \`enum\`, \`argc\` / \`argv\`, and \`#define\` macros.`,
        codeLanguage: 'c',
        codeFilename: 'c_bitwise.c',
        codeExample: `#include <stdio.h>
#define FLAG_READ  (1u << 0)
#define FLAG_WRITE (1u << 1)
#define FLAG_EXEC  (1u << 2)

int main(void) {
    unsigned int perms = FLAG_READ | FLAG_EXEC;
    printf("Permissions mask: 0x%02X | Writable: %s\\n",
           perms, (perms & FLAG_WRITE) ? "YES" : "NO");
    return 0;
}`,
        terminalCommand: 'gcc c_bitwise.c -o c_bitwise && ./c_bitwise',
        terminalOutput: ['Permissions mask: 0x05 | Writable: NO'],
      },
    ],
  },
  {
    id: 'cpp',
    name: 'C++',
    badge: '6 Sections',
    compilerTag: 'G++ 13.2 · ISO C++23',
    description:
      'Object-Oriented Programming, references, RAII classes, operator overloading, templates, STL containers, and file streams.',
    chapters: [
      {
        id: 'cpp-sec-1',
        moduleNumber: 1,
        title: 'Section 1: Language Development & C++ Foundations',
        categoryLabel: 'C++ Syllabus · Section 1',
        topics: [
          'Language development',
          'Object-Oriented Programming paradigm',
          'Problem Solving Methodology',
          'Algorithms',
          'List of C++ standards (C++98 to C++23)',
          'Introduction to C++',
          'C++ Character Set',
          'Identifiers and Keywords',
          'Variables and Constants',
          'Data Types',
          'Expressions',
          'Statements',
          'Compilation and Execution of C++ Programs',
        ],
        markdownContent: `### 1. Object-Oriented Paradigm & Evolution of C++ (C++98 to C++23)
Created by Bjarne Stroustrup, **C++** combines C's low-level hardware efficiency with zero-overhead Object-Oriented and Generic Programming abstractions.

#### Core Topics Covered
- **OOP Principles**: Encapsulation, Abstraction, Inheritance, and Polymorphism.
- **C++ Standards Progression**: From **C++98/C++03** to modern **C++11** (move semantics, \`auto\`, lambdas), **C++14**, **C++17** (\`std::optional\`, structured bindings), **C++20** (Concepts, Ranges, Coroutines), and **C++23**.
- **Character Set, Identifiers, Data Types & Compilation**: Strong static type checking, \`bool\`, \`constexpr\` constants, and compilation into native machine code.`,
        codeLanguage: 'cpp',
        codeFilename: 'cpp_foundations.cpp',
        codeExample: `#include <iostream>

int main() {
    constexpr int standard = 2023;
    std::cout << "C++ Standard: C++" << (standard % 100) << "\\n";
    std::cout << "Zero-cost abstractions active.\\n";
    return 0;
}`,
        terminalCommand: 'g++ -std=c++20 cpp_foundations.cpp -o cpp_foundations && ./cpp_foundations',
        terminalOutput: [
          'C++ Standard: C++23',
          'Zero-cost abstractions active.',
        ],
      },
      {
        id: 'cpp-sec-2',
        moduleNumber: 2,
        title: 'Section 2: Operators, I/O Streams & Decision Making',
        categoryLabel: 'C++ Syllabus · Section 2',
        topics: [
          'Operators',
          'Input/Output and Decision Making',
          'Arithmetic Operators',
          'Unary Operators',
          'Relational Operators',
          'Logical Operators',
          'Assignment Operators',
          'Conditional Operator',
          'Scope Resolution Operator',
          'Standard Library I/O streams (cin, cout)',
          'Data Input and Output',
          'Stream manipulators',
          'if, if-else, Nested if-else, switch',
          'while, do-while, for, range-based for loop',
          'break, continue, goto',
          'Debugging Techniques',
        ],
        markdownContent: `### 2. Scope Resolution, I/O Streams & Range-Based Iteration
C++ introduces the scope resolution operator (\`::\`), type-safe stream I/O (\`std::cin\`, \`std::cout\`), and the modern range-based \`for\` loop.

#### Core Topics Covered
- **Scope Resolution (\`::\`)**: Accessing global variables, namespaces, and class static/member definitions.
- **Stream Manipulators**: Formatting output via \`std::endl\`, \`std::setw\`, \`std::fixed\`, and \`std::setprecision\`.
- **Range-Based \`for\` Loop**: Iterating cleanly over arrays and STL containers (\`for (const auto& item : container)\`).`,
        codeLanguage: 'cpp',
        codeFilename: 'cpp_streams.cpp',
        codeExample: `#include <iostream>
#include <iomanip>

int metric = 100;

int main() {
    int metric = 42;
    int latencies[] = {4, 8, 12, 16};
    int total = 0;
    for (int ms : latencies) total += ms;

    std::cout << "Local metric: " << metric << " | Global ::metric: " << ::metric << "\\n";
    std::cout << "Avg latency: " << std::fixed << std::setprecision(1) << (total / 4.0) << "ms\\n";
    return 0;
}`,
        terminalCommand: 'g++ -std=c++20 cpp_streams.cpp -o cpp_streams && ./cpp_streams',
        terminalOutput: [
          'Local metric: 42 | Global ::metric: 100',
          'Avg latency: 10.0ms',
        ],
      },
      {
        id: 'cpp-sec-3',
        moduleNumber: 3,
        title: 'Section 3: Arrays, std::string, Pointers and References',
        categoryLabel: 'C++ Syllabus · Section 3',
        topics: [
          'Arrays, Strings, Pointers and References',
          'Defining and Processing an array',
          'One-dimensional Arrays',
          'Two-dimensional Arrays',
          'C-style Strings',
          'Introduction to std::string',
          'Initialization of strings',
          'Reading and writing strings',
          'String Library Functions',
          'Pointer Basics',
          'Pointer Arithmetic',
          'Pointers and Arrays',
          'References',
          'Dynamic Memory Allocation (new and delete)',
        ],
        markdownContent: `### 3. std::string, Lvalue References & Dynamic Memory (new / delete)
Unlike raw C character arrays, \`std::string\` manages its own heap buffer automatically. C++ also introduces **references** (\`T&\`) as non-null aliases to existing objects.

#### Core Topics Covered
- **\`std::string\` Operations**: Concatenation, \`.length()\`, \`.substr()\`, \`.find()\`, and safe bounds access.
- **References vs. Pointers**: A reference must be initialized when declared and cannot be rebound.
- **\`new\` and \`delete\`**: Allocating and deallocating dynamic objects and arrays (\`new T[n]\` / \`delete[] ptr\`).`,
        codeLanguage: 'cpp',
        codeFilename: 'cpp_strings_refs.cpp',
        codeExample: `#include <iostream>
#include <string>

void appendTag(std::string& target, const std::string& tag) {
    target += " [" + tag + "]";
}

int main() {
    std::string title = "EDOC Kernel";
    appendTag(title, "Verified");
    std::cout << title << " (Length: " << title.length() << ")\\n";
    return 0;
}`,
        terminalCommand: 'g++ -std=c++20 cpp_strings_refs.cpp -o cpp_strings_refs && ./cpp_strings_refs',
        terminalOutput: ['EDOC Kernel [Verified] (Length: 22)'],
      },
      {
        id: 'cpp-sec-4',
        moduleNumber: 4,
        title: 'Section 4: Functions, Overloading & Namespaces',
        categoryLabel: 'C++ Syllabus · Section 4',
        topics: [
          'Functions and Program Organization',
          'Defining a function',
          'Accessing a function',
          'Function Prototypes',
          'Function Calls',
          'Parameter Passing (Value, Reference, Pointer)',
          'Inline Functions',
          'Default Arguments',
          'Function Overloading',
          'Recursion',
          'Namespaces',
          'Storage Classes',
          'Scope and Lifetime of Variables',
        ],
        markdownContent: `### 4. Function Overloading, Default Arguments & Namespaces
C++ supports compile-time polymorphism via **Function Overloading** (multiple functions sharing the same name with distinct parameter types) and avoids naming collisions with \`namespace\`.`,
        codeLanguage: 'cpp',
        codeFilename: 'cpp_overloading.cpp',
        codeExample: `#include <iostream>

namespace math_ops {
    inline int compute(int a, int b = 10) { return a + b; }
    inline double compute(double a, double b) { return a * b; }
}

int main() {
    std::cout << "Int overload (default b=10): " << math_ops::compute(25) << "\\n";
    std::cout << "Double overload: " << math_ops::compute(2.5, 4.0) << "\\n";
    return 0;
}`,
        terminalCommand: 'g++ -std=c++20 cpp_overloading.cpp -o cpp_overloading && ./cpp_overloading',
        terminalOutput: [
          'Int overload (default b=10): 35',
          'Double overload: 10',
        ],
      },
      {
        id: 'cpp-sec-5',
        moduleNumber: 5,
        title: 'Section 5: Classes and Object-Oriented Programming',
        categoryLabel: 'C++ Syllabus · Section 5',
        topics: [
          'Classes and Object-Oriented Programming',
          'Defining a class',
          'Access Specifiers',
          'Constructors and Destructors',
          'Copy Constructor',
          'this pointer',
          'Friend Functions and Classes',
          'Operator Overloading',
          'Inheritance',
          'Polymorphism',
          'Virtual Functions',
          'Abstract Classes',
          'Unions',
        ],
        markdownContent: `### 5. Classes, Constructors, Virtual Functions & Polymorphism
Classes bind state and behavior under \`public\`, \`protected\`, and \`private\` access specifiers. Virtual functions (\`virtual\`) and pure virtual methods (\`= 0\`) enable dynamic dispatch via the vtable.`,
        codeLanguage: 'cpp',
        codeFilename: 'cpp_oop.cpp',
        codeExample: `#include <iostream>

class Engine {
public:
    virtual void status() const = 0; // Pure virtual -> Abstract class
    virtual ~Engine() = default;
};

class SandboxEngine : public Engine {
    int nodes;
public:
    explicit SandboxEngine(int n) : nodes(n) {}
    void status() const override {
        std::cout << "SandboxEngine active across " << nodes << " nodes.\\n";
    }
};

int main() {
    SandboxEngine eng(8);
    const Engine& ref = eng;
    ref.status();
    return 0;
}`,
        terminalCommand: 'g++ -std=c++20 cpp_oop.cpp -o cpp_oop && ./cpp_oop',
        terminalOutput: ['SandboxEngine active across 8 nodes.'],
      },
      {
        id: 'cpp-sec-6',
        moduleNumber: 6,
        title: 'Section 6: Templates, STL and File Handling',
        categoryLabel: 'C++ Syllabus · Section 6',
        topics: [
          'Templates, STL and File Handling',
          'Function Templates',
          'Class Templates',
          'Introduction to Standard Template Library (STL)',
          'Containers',
          'Iterators',
          'Algorithms',
          'Exception Handling (try, catch, throw)',
          'File Handling',
          'File Streams (ifstream, ofstream, fstream)',
          'Opening and Closing a Data File',
          'Reading and Writing Data Files',
          'Additional Features of C++',
          'Enumerations',
          'Command Line Arguments',
          'Macros',
          'The C++ Preprocessor',
          'Brief overview of the differences in standards of the C++ Language',
        ],
        markdownContent: `### 6. Generic Templates, STL Containers & Exception Handling
Templates enable compile-time generic programming. The **Standard Template Library (STL)** pairs **Containers** (\`std::vector\`, \`std::map\`), **Iterators**, and **Algorithms** (\`std::sort\`, \`std::lower_bound\`).`,
        codeLanguage: 'cpp',
        codeFilename: 'cpp_stl.cpp',
        codeExample: `#include <iostream>
#include <vector>
#include <algorithm>

template <typename T>
T max_element_val(const std::vector<T>& v) {
    return *std::max_element(v.begin(), v.end());
}

int main() {
    std::vector<int> scores = {84, 92, 79, 98, 91};
    std::sort(scores.begin(), scores.end());
    std::cout << "Sorted peak score: " << max_element_val(scores) << "\\n";
    return 0;
}`,
        terminalCommand: 'g++ -std=c++20 cpp_stl.cpp -o cpp_stl && ./cpp_stl',
        terminalOutput: ['Sorted peak score: 98'],
      },
    ],
  },
  {
    id: 'java',
    name: 'Java',
    badge: '9 Modules',
    compilerTag: 'OpenJDK 21 LTS · JVM',
    description:
      'JVM architecture, bytecode, OOP fundamentals, inheritance, interfaces, exception handling, multithreading, generics, and collections.',
    chapters: [
      {
        id: 'java-mod-1',
        moduleNumber: 1,
        title: 'Module 1: JVM Architecture, Bytecode & Language Fundamentals',
        categoryLabel: 'JAVA · Module 1',
        topics: [
          'Evolution of Java',
          'Java Buzzwords',
          'JVM Architecture',
          'Bytecode',
          'JDK and JRE',
          'Problem Solving Methodology in OOP',
          'Algorithms',
          'Java Standards',
          'Basic Structure of a Java Program',
          'Data Types',
          'Variables',
          'Type Casting',
          'Operators (Arithmetic, Relational, Logical, Assignment, Bitwise, Ternary, Scope Resolution)',
          'Expressions',
          'Control Statements (if, if-else, switch)',
          'Iterative Statements (while, do-while, for, for-each loop)',
          'Branching (break, continue, goto-equivalent labels)',
          'Debugging Techniques',
        ],
        markdownContent: `### 1. JVM Architecture, Bytecode & Java Buzzwords
Java achieves platform independence ("Write Once, Run Anywhere") by compiling source files (\`.java\`) into portable **Bytecode** (\`.class\`) executed by the **Java Virtual Machine (JVM)** via the ClassLoader, Bytecode Verifier, Interpreter, and JIT Compiler.`,
        codeLanguage: 'java',
        codeFilename: 'Main.java',
        codeExample: `public class Main {
    public static void main(String[] args) {
        int[] marks = {88, 92, 95, 100};
        int sum = 0;
        for (int m : marks) {
            sum += m;
        }
        double avg = (double) sum / marks.length;
        System.out.println("JVM Runtime Ready | Average Score: " + avg);
    }
}`,
        terminalCommand: 'javac Main.java && java Main',
        terminalOutput: ['JVM Runtime Ready | Average Score: 93.75'],
      },
      {
        id: 'java-mod-2',
        moduleNumber: 2,
        title: 'Module 2: Classes, Objects, Constructors & Garbage Collection',
        categoryLabel: 'JAVA · Module 2',
        topics: [
          'Class Fundamentals',
          'Declaring Objects',
          'Assigning Object Reference Variables',
          'Methods',
          'Constructors',
          'Parameter Passing (Pass-by-Value)',
          'this Keyword',
          'Garbage Collection',
          'static Members',
          'final Keyword',
          'Nested and Inner Classes',
          'Command Line Arguments',
        ],
        markdownContent: `### 2. Class Fundamentals, Reference Variables & Garbage Collection
Objects in Java are allocated on the heap and accessed through reference variables. Constructors initialize new instances, \`this\` refers to the current object, and automatic **Garbage Collection** reclaims unreachable heap memory.`,
        codeLanguage: 'java',
        codeFilename: 'StudentRecord.java',
        codeExample: `public class StudentRecord {
    private final String name;
    private static int activeCount = 0;

    public StudentRecord(String name) {
        this.name = name;
        activeCount++;
    }

    public static void main(String[] args) {
        StudentRecord s1 = new StudentRecord("Alex Rivera");
        StudentRecord s2 = new StudentRecord("Priya Nair");
        System.out.println("Created: " + s1.name + ", " + s2.name + " | Active: " + activeCount);
    }
}`,
        terminalCommand: 'javac StudentRecord.java && java StudentRecord',
        terminalOutput: ['Created: Alex Rivera, Priya Nair | Active: 2'],
      },
      {
        id: 'java-mod-3',
        moduleNumber: 3,
        title: 'Module 3: Arrays, String, StringBuffer, and StringBuilder',
        categoryLabel: 'JAVA · Module 3',
        topics: [
          'Arrays and Strings: Defining and Processing One-dimensional and Two-dimensional Arrays',
          'C-style vs. Java Arrays',
          'Introduction to String, StringBuffer, and StringBuilder',
          'Initialization of Strings',
          'Reading and Writing Strings',
          'String Library Functions',
        ],
        markdownContent: `### 3. Java Bounds-Checked Arrays & Immutable vs. Mutable Strings
Unlike C arrays, Java arrays are first-class objects with a \`.length\` field and runtime bounds checking. \`String\` is immutable, whereas \`StringBuffer\` (thread-safe) and \`StringBuilder\` (non-synchronized, fast) provide mutable character buffers.`,
        codeLanguage: 'java',
        codeFilename: 'StringDemo.java',
        codeExample: `public class StringDemo {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder("EDOC");
        sb.append(" :: ").append("Java 21 LTS");
        System.out.println(sb.toString() + " (Length: " + sb.length() + ")");
    }
}`,
        terminalCommand: 'javac StringDemo.java && java StringDemo',
        terminalOutput: ['EDOC :: Java 21 LTS (Length: 19)'],
      },
      {
        id: 'java-mod-4',
        moduleNumber: 4,
        title: 'Module 4: Inheritance, Dynamic Method Dispatch & Abstract Classes',
        categoryLabel: 'JAVA · Module 4',
        topics: [
          'Inheritance Basics',
          'Member Access and Inheritance',
          'Using super',
          'Multilevel Inheritance',
          'Method Overriding',
          'Dynamic Method Dispatch',
          'Abstract Classes',
          'Using final with Inheritance',
          'The Object Class',
        ],
        markdownContent: `### 4. Inheritance Hierarchy, super & Dynamic Method Dispatch
Every class in Java implicitly extends \`java.lang.Object\`. Subclasses use \`super\` to invoke parent constructors and overridden methods, resolved at runtime via **Dynamic Method Dispatch**.`,
        codeLanguage: 'java',
        codeFilename: 'DispatchDemo.java',
        codeExample: `abstract class ComputeNode {
    abstract String role();
}

class EdgeWorker extends ComputeNode {
    @Override
    String role() { return "AP-SOUTH-EDGE Worker Online"; }
}

public class DispatchDemo {
    public static void main(String[] args) {
        ComputeNode node = new EdgeWorker();
        System.out.println(node.role());
    }
}`,
        terminalCommand: 'javac DispatchDemo.java && java DispatchDemo',
        terminalOutput: ['AP-SOUTH-EDGE Worker Online'],
      },
      {
        id: 'java-mod-5',
        moduleNumber: 5,
        title: 'Module 5: Packages, Access Protection & Interfaces',
        categoryLabel: 'JAVA · Module 5',
        topics: [
          'Packages and Interfaces: Defining a Package',
          'Access Protection (public, private, protected, default)',
          'Importing Packages',
          'Interfaces (Defining and Implementing Interfaces, Nested Interfaces, Default and Static Methods in Interfaces)',
        ],
        markdownContent: `### 5. Packages, Visibility Scopes & Modern Interfaces
Packages partition namespaces and work with four access levels (\`private\`, default package-private, \`protected\`, \`public\`). Modern Java interfaces support \`default\` and \`static\` methods alongside abstract contracts.`,
        codeLanguage: 'java',
        codeFilename: 'InterfaceDemo.java',
        codeExample: `interface Evaluable {
    int evaluate(int input);
    default String label() { return "Standard Evaluator"; }
}

public class InterfaceDemo implements Evaluable {
    public int evaluate(int input) { return input * input; }
    public static void main(String[] args) {
        InterfaceDemo d = new InterfaceDemo();
        System.out.println(d.label() + " -> " + d.evaluate(12));
    }
}`,
        terminalCommand: 'javac InterfaceDemo.java && java InterfaceDemo',
        terminalOutput: ['Standard Evaluator -> 144'],
      },
      {
        id: 'java-mod-6',
        moduleNumber: 6,
        title: 'Module 6: Exception-Handling Fundamentals',
        categoryLabel: 'JAVA · Module 6',
        topics: [
          'Exception-Handling Fundamentals',
          'Exception Types',
          'Uncaught Exceptions',
          'Using try and catch',
          'Multiple catch Clauses',
          'Nested try Statements',
          'throw',
          'throws',
          'finally',
          'Creating Custom/User-Defined Exceptions',
        ],
        markdownContent: `### 6. Checked vs. Unchecked Exceptions & try-catch-finally
Java separates \`Throwable\` into \`Error\` and \`Exception\` (including checked exceptions that must be declared via \`throws\` and unchecked \`RuntimeException\` subclasses).`,
        codeLanguage: 'java',
        codeFilename: 'ExceptionDemo.java',
        codeExample: `public class ExceptionDemo {
    public static void main(String[] args) {
        try {
            int result = 100 / 4;
            System.out.println("Result: " + result);
        } catch (ArithmeticException e) {
            System.out.println("Division by zero caught");
        } finally {
            System.out.println("Finally block executed cleanly.");
        }
    }
}`,
        terminalCommand: 'javac ExceptionDemo.java && java ExceptionDemo',
        terminalOutput: ['Result: 25', 'Finally block executed cleanly.'],
      },
      {
        id: 'java-mod-7',
        moduleNumber: 7,
        title: 'Module 7: Multithreaded Programming & Synchronization',
        categoryLabel: 'JAVA · Module 7',
        topics: [
          'Multithreaded Programming: Java Thread Model',
          'Main Thread',
          'Creating a Thread (Thread class and Runnable interface)',
          'Thread Priorities',
          'Synchronization',
          'Inter-thread Communication',
          'Deadlock',
        ],
        markdownContent: `### 7. Java Thread Model, Runnable & Monitor Synchronization
Threads allow concurrent execution within a single process. Mutual exclusion is enforced with \`synchronized\` blocks/methods and coordinated via \`wait()\`, \`notify()\`, and \`notifyAll()\`.`,
        codeLanguage: 'java',
        codeFilename: 'ThreadDemo.java',
        codeExample: `public class ThreadDemo {
    public static void main(String[] args) throws InterruptedException {
        Thread worker = new Thread(() -> System.out.println("Worker Runnable active on: " + Thread.currentThread().getName()));
        worker.start();
        worker.join();
        System.out.println("Main thread joined worker.");
    }
}`,
        terminalCommand: 'javac ThreadDemo.java && java ThreadDemo',
        terminalOutput: [
          'Worker Runnable active on: Thread-0',
          'Main thread joined worker.',
        ],
      },
      {
        id: 'java-mod-8',
        moduleNumber: 8,
        title: 'Module 8: Generics & Collections Framework',
        categoryLabel: 'JAVA · Module 8',
        topics: [
          'Generics: Generic Classes',
          'Generic Methods',
          'Bounded Types',
          'Collections Framework: Overview',
          'Collection Interfaces (List, Set, Map, Queue)',
          'Collection Classes (ArrayList, LinkedList, HashSet, TreeSet, HashMap, TreeMap)',
          'Iterators (Iterator, ListIterator)',
          'Comparable and Comparator',
        ],
        markdownContent: `### 8. Parameterized Generics & The Collections Framework
Generics enforce compile-time type safety across \`List\` (\`ArrayList\`, \`LinkedList\`), \`Set\` (\`HashSet\`, \`TreeSet\`), \`Map\` (\`HashMap\`, \`TreeMap\`), and custom sorting with \`Comparable\` and \`Comparator\`.`,
        codeLanguage: 'java',
        codeFilename: 'CollectionsDemo.java',
        codeExample: `import java.util.*;

public class CollectionsDemo {
    public static void main(String[] args) {
        Map<String, Integer> xpMap = new TreeMap<>();
        xpMap.put("Alex", 1420);
        xpMap.put("Priya", 1940);
        System.out.println("Sorted TreeMap: " + xpMap);
    }
}`,
        terminalCommand: 'javac CollectionsDemo.java && java CollectionsDemo',
        terminalOutput: ['Sorted TreeMap: {Alex=1420, Priya=1940}'],
      },
      {
        id: 'java-mod-9',
        moduleNumber: 9,
        title: 'Module 9: File Handling, Streams & Object Serialization',
        categoryLabel: 'JAVA · Module 9',
        topics: [
          'File Handling: Stream Classes (Byte Streams and Character Streams)',
          'Reading and Writing Data Files (FileInputStream, FileOutputStream, FileReader, FileWriter, BufferedReader, BufferedWriter)',
          'Introduction to Object Serialization',
        ],
        markdownContent: `### 9. Byte/Character Streams & Object Serialization
Java I/O provides **Byte Streams** (\`FileInputStream\`, \`FileOutputStream\`), **Character Streams** (\`FileReader\`, \`FileWriter\`, \`BufferedReader\`), and **Object Serialization** (\`Serializable\`) to persist object graphs.`,
        codeLanguage: 'java',
        codeFilename: 'FileStreamDemo.java',
        codeExample: `import java.io.*;

public class FileStreamDemo {
    public static void main(String[] args) throws IOException {
        BufferedReader reader = new BufferedReader(new StringReader("Line 1: Stream Ready\\nLine 2: EOF"));
        System.out.println(reader.readLine());
        System.out.println(reader.readLine());
    }
}`,
        terminalCommand: 'javac FileStreamDemo.java && java FileStreamDemo',
        terminalOutput: ['Line 1: Stream Ready', 'Line 2: EOF'],
      },
    ],
  },
  {
    id: 'python',
    name: 'Python',
    badge: '4 Modules',
    compilerTag: 'Python 3.12.4 · CPython',
    description:
      'Dynamic typing, data structures, list comprehensions, generator pipelines, OOP, functional paradigms, and standard library modules.',
    chapters: [
      {
        id: 'py-mod-1',
        moduleNumber: 1,
        title: 'Module 1: Python Foundations, Dynamic Typing & Control Flow',
        categoryLabel: 'PYTHON · Module 1',
        topics: [
          'CPython Bytecode & Interpreter Model',
          'Dynamic Typing & Object References',
          'Numeric Types, Strings & Slicing',
          'Conditional Branching (if / elif / else & match-case)',
          'Iterative Loops (for, while, enumerate, zip)',
        ],
        markdownContent: `### 1. Python Interpreter Model, Slicing & Structural Pattern Matching
Python compiles source code into bytecode executed by the CPython virtual machine. Every value in Python is a first-class heap object with automatic reference counting and cyclic garbage collection.`,
        codeLanguage: 'python',
        codeFilename: 'py_foundations.py',
        codeExample: `languages = ["C", "C++", "Java", "Python"]
for idx, lang in enumerate(languages, start=1):
    print(f"Track {idx}: {lang} (slice check: {lang[:2]})")`,
        terminalCommand: 'python3 py_foundations.py',
        terminalOutput: [
          'Track 1: C (slice check: C)',
          'Track 2: C++ (slice check: C+)',
          'Track 3: Java (slice check: Ja)',
          'Track 4: Python (slice check: Py)',
        ],
      },
      {
        id: 'py-mod-2',
        moduleNumber: 2,
        title: 'Module 2: Core Data Structures — Lists, Tuples, Sets & Dicts',
        categoryLabel: 'PYTHON · Module 2',
        topics: [
          'Mutable Lists & Dynamic Array Resizing',
          'Immutable Tuples & Unpacking',
          'Hash Tables: Dictionaries (dict) & Sets (set)',
          'Time Complexity of Membership & Lookup O(1)',
        ],
        markdownContent: `### 2. High-Performance Built-in Containers
Python's \`dict\` and \`set\` are backed by compact open-addressed hash tables providing $O(1)$ average-case lookup, insertion, and deletion.`,
        codeLanguage: 'python',
        codeFilename: 'py_containers.py',
        codeExample: `scores = {"Alex": 1420, "Priya": 1940, "Elena": 1780}
top_user = max(scores, key=scores.get)
print(f"Top Performer: {top_user} with {scores[top_user]} XP")`,
        terminalCommand: 'python3 py_containers.py',
        terminalOutput: ['Top Performer: Priya with 1940 XP'],
      },
      {
        id: 'py-mod-3',
        moduleNumber: 3,
        title: 'Module 3: Comprehensions, Generators & Decorators',
        categoryLabel: 'PYTHON · Module 3',
        topics: [
          'List, Set & Dictionary Comprehensions',
          'Lazy Evaluation with Generators (yield)',
          'First-Class Functions, Closures & Decorators (@)',
          'Itertools & Functional Primitives (map, filter)',
        ],
        markdownContent: `### 3. Lazy Generator Pipelines & Function Decorators
Generator functions using \`yield\` produce items on demand in $O(1)$ auxiliary memory, while decorators wrap functions to add logging, caching (\`@functools.lru_cache\`), or timing.`,
        codeLanguage: 'python',
        codeFilename: 'py_generators.py',
        codeExample: `def fib_stream(limit: int):
    a, b = 0, 1
    for _ in range(limit):
        yield a
        a, b = b, a + b

print("Fibonacci stream (8):", list(fib_stream(8)))`,
        terminalCommand: 'python3 py_generators.py',
        terminalOutput: ['Fibonacci stream (8): [0, 1, 1, 2, 3, 5, 8, 13]'],
      },
      {
        id: 'py-mod-4',
        moduleNumber: 4,
        title: 'Module 4: Classes, Dunder Methods & Context Managers',
        categoryLabel: 'PYTHON · Module 4',
        topics: [
          'Classes, __init__, and Instance Attributes',
          'Magic / Dunder Methods (__repr__, __len__, __eq__)',
          'Inheritance & Method Resolution Order (MRO)',
          'Context Managers (with statement, __enter__, __exit__)',
        ],
        markdownContent: `### 4. Object-Oriented Python & Special Dunder Protocols
Python's data model uses double-underscore ("dunder") methods such as \`__init__\`, \`__repr__\`, and \`__enter__\` / \`__exit__\` so custom objects integrate seamlessly with built-in syntax.`,
        codeLanguage: 'python',
        codeFilename: 'py_oop.py',
        codeExample: `class Vector2D:
    def __init__(self, x: float, y: float):
        self.x, self.y = x, y
    def __add__(self, other: "Vector2D") -> "Vector2D":
        return Vector2D(self.x + other.x, self.y + other.y)
    def __repr__(self) -> str:
        return f"Vector2D({self.x}, {self.y})"

print("Vector sum:", Vector2D(3, 4) + Vector2D(1, 2))`,
        terminalCommand: 'python3 py_oop.py',
        terminalOutput: ['Vector sum: Vector2D(4, 6)'],
      },
    ],
  },
];

// ============================================================================
// CURRICULUM TOOL 2: WEB DEVELOPMENT (HTML, CSS, JAVASCRIPT JSON SYLLABI)
// ============================================================================
export interface WebTheoryTrack {
  id: 'html' | 'css' | 'javascript';
  name: string;
  title: string;
  badge: string;
  chapters: TheoryChapter[];
}

export const WEB_DEVELOPMENT_TRACKS: WebTheoryTrack[] = [
  {
    id: 'html',
    name: 'HTML5',
    title: 'Master Syllabus: Comprehensive HTML5 Learning Path',
    badge: '6 Modules',
    chapters: [
      {
        id: 'html-mod-1',
        moduleNumber: 1,
        title: 'Module 1: Foundations & Semantic Page-Structure',
        categoryLabel: 'HTML5 · LO 1, LO 3',
        topics: [
          '1. Introduction to HTML5 & Document Skeleton',
          '2. Modern HTML5 Page-Structure Elements (Semantic Layout)',
          '3. Development Setup, Validation & Quality Assurance',
        ],
        markdownContent: `### Module 1: Foundations & Semantic Page-Structure

#### 1. Introduction to HTML5 & Document Skeleton
- **The Evolution of HTML**: From rigid legacy HTML/XHTML specs to modern HTML5 (cleaner syntax, native multimedia, and semantic tags).
- **The Boilerplate Structure**: \`<!DOCTYPE html>\` (standard mode), \`<html>\`, \`<head>\`, and \`<body>\` (core containers).

#### 2. Modern HTML5 Page-Structure Elements (Semantic Layout)
- **Moving Beyond \`<div>\` Soup**: Why semantic elements matter for SEO, screen readers, and code readability.
- **Core Structural Tags**: \`<header>\`, \`<nav>\`, \`<main>\`, \`<section>\`, \`<article>\`, \`<aside>\`, \`<footer>\`.

#### 3. Development Setup, Validation & Quality Assurance
- **Tools**: Setting up Visual Studio Code with Live Server extensions.
- **W3C HTML5 Validation Service**: Checking code against the official W3C parser to catch unclosed tags, syntax bugs, and accessibility gaps.`,
        codeLanguage: 'html',
        codeFilename: 'semantic_layout.html',
        codeExample: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>EDOC Semantic Document</title>
</head>
<body>
  <header><nav>Primary Navigation</nav></header>
  <main>
    <article><h1>Semantic HTML5 Architecture</h1></article>
  </main>
  <footer>© 2026 EDOC Platform</footer>
</body>
</html>`,
        terminalCommand: 'cat semantic_layout.html',
        terminalOutput: [
          'W3C HTML5 Validator: Document checking completed. No errors or warnings to show.',
          'Detected semantic landmarks: <header>, <nav>, <main>, <article>, <footer>',
        ],
      },
      {
        id: 'html-mod-2',
        moduleNumber: 2,
        title: 'Module 2: Typography, Content Formatting & Navigation',
        categoryLabel: 'HTML5 · LO 2',
        topics: [
          '1. Headings, Text Formatting, and Special Characters',
          '2. Lists & Hyperlinks',
        ],
        markdownContent: `### Module 2: Typography, Content Formatting & Navigation

#### 1. Headings, Text Formatting, and Special Characters
- **Document Outlines**: Using hierarchical headings (\`<h1>\` to \`<h6>\`) correctly.
- **Inline Text Styling**: \`<strong>\`, \`<em>\`, \`<mark>\`, \`<del>\`, \`<sup>\`, and \`<sub>\`.
- **Entities & Symbols**: Handling reserved characters securely (\`&amp;\`, \`&lt;\`, \`&gt;\`, \`&quot;\`, \`&nbsp;\`).
- **Visual Dividers**: Horizontal rules (\`<hr>\`) and line breaks (\`<br>\`).

#### 2. Lists & Hyperlinks
- **List Structures**: Unordered (\`<ul>\`), Ordered (\`<ol>\` with \`type\` and \`start\` attributes), and Description Lists (\`<dl>\`, \`<dt>\`, \`<dd>\`).
- **Hyperlinks (\`<a>\`)**: Linking external sites with \`href\` and opening in new tabs using \`target="_blank"\`.
- **Internal Anchors**: Creating smooth in-page navigation using \`id\` attributes and hash fragments (\`href="#section-id"\`).`,
        codeLanguage: 'html',
        codeFilename: 'typography_nav.html',
        codeExample: `<section id="overview">
  <h2>Typography &amp; Navigation</h2>
  <p>Use <strong>strong emphasis</strong> and <mark>highlighted terms</mark>.</p>
  <ol start="1" type="1">
    <li><a href="#overview">Internal Anchor Link</a></li>
    <li><a href="https://edoc.dev" target="_blank">External Resource</a></li>
  </ol>
</section>`,
        terminalCommand: 'cat typography_nav.html',
        terminalOutput: [
          'Parsed heading hierarchy: <h2>',
          'Verified HTML entities (&amp;) and ordered list <ol start="1">',
        ],
      },
      {
        id: 'html-mod-3',
        moduleNumber: 3,
        title: 'Module 3: Rich Media Integration',
        categoryLabel: 'HTML5 · LO 2',
        topics: [
          '1. Images (<img>)',
          '2. Audio (<audio>) and Video (<video>)',
        ],
        markdownContent: `### Module 3: Rich Media Integration

#### 1. Images (\`<img>\`)
- **Attributes**: \`src\`, \`alt\` (essential for accessibility/SEO), \`width\`, and \`height\`.
- **Responsive Best Practices**: Utilizing modern image handling techniques.

#### 2. Audio (\`<audio>\`) and Video (\`<video>\`)
- **Native Streaming**: Removing third-party plugins.
- **Attributes**: \`controls\`, \`autoplay\`, \`loop\`, \`muted\`, \`poster\`, and \`preload\`.
- **Fallback Sources**: Nesting multiple \`<source>\` elements (\`mp4\`, \`webm\`) inside media tags for universal browser support.`,
        codeLanguage: 'html',
        codeFilename: 'media.html',
        codeExample: `<figure>
  <img src="architecture.svg" alt="System Architecture Diagram" width="640" height="360" />
  <video controls preload="metadata" poster="poster.jpg">
    <source src="lecture.webm" type="video/webm" />
    <source src="lecture.mp4" type="video/mp4" />
  </video>
</figure>`,
        terminalCommand: 'cat media.html',
        terminalOutput: [
          'Accessibility Check: <img> contains descriptive alt attribute.',
          'Media Stream Check: <video> provides both video/webm and video/mp4 sources.',
        ],
      },
      {
        id: 'html-mod-4',
        moduleNumber: 4,
        title: 'Module 4: Structured Data with Tables',
        categoryLabel: 'HTML5 · LO 3',
        topics: ['1. Basic & Advanced Table Layouts'],
        markdownContent: `### Module 4: Structured Data with Tables

#### 1. Basic & Advanced Table Layouts
- **Core Elements**: \`<table>\`, \`<tr>\`, \`<th>\`, and \`<td>\`.
- **Semantic Grouping**: Separating headers, bodies, and footers using \`<thead>\`, \`<tbody>\`, and \`<tfoot>\`.
- **Span Controls**: Merging cells horizontally (\`colspan\`) and vertically (\`rowspan\`).
- **Accessibility**: Using \`<caption>\` and \`scope="col"\` / \`scope="row"\` attributes.`,
        codeLanguage: 'html',
        codeFilename: 'tables.html',
        codeExample: `<table>
  <caption>Benchmark Latency Summary</caption>
  <thead>
    <tr>
      <th scope="col">Node</th>
      <th scope="col">Latency (ms)</th>
    </tr>
  </thead>
  <tbody>
    <tr><td>AP-SOUTH-1</td><td>14ms</td></tr>
  </tbody>
</table>`,
        terminalCommand: 'cat tables.html',
        terminalOutput: [
          'Table Accessibility Verified: <caption> and <th scope="col"> present.',
        ],
      },
      {
        id: 'html-mod-5',
        moduleNumber: 5,
        title: 'Module 5: Modern HTML5 Forms, Input Types, Datalist & Autocomplete',
        categoryLabel: 'HTML5 · LO 1, LO 2',
        topics: [
          '1. Introduction to HTML5 Forms',
          '2. New HTML5 Form Input Types',
          '3. The <datalist> Element & Autocomplete Attribute',
          '4. Built-in Form Validation Attributes',
        ],
        markdownContent: `### Module 5: Modern HTML5 Forms, Input Types, Datalist & Autocomplete

#### 1. Introduction to HTML5 Forms
- **The \`<form>\` Container**: Managing data submission via \`action\` and \`method\` (\`GET\` vs. \`POST\`).
- **Form Labels & Fieldsets**: Grouping controls with \`<fieldset>\` and \`<legend>\`, and tying labels to inputs via \`for\` and \`id\` attributes.

#### 2. New HTML5 Form Input Types
- **Replacing Generic Text Boxes**: \`type="email"\`, \`type="url"\`, \`type="tel"\`, \`type="number"\`, \`type="range"\`, date/time pickers, \`type="color"\`, \`type="search"\`.

#### 3. The \`<datalist>\` Element & Autocomplete Attribute
- **The \`<datalist>\` Element**: Combines text input flexibility with dropdown convenience.
- **The \`autocomplete\` Attribute**: Controls browser auto-completion with values like \`on\`, \`off\`, or semantic tokens.

#### 4. Built-in Form Validation Attributes
- \`required\`: Prevents submission if field is empty.
- \`pattern\`: Enforces custom RegEx matching.
- \`minlength\` & \`maxlength\`: Character count limits.`,
        codeLanguage: 'html',
        codeFilename: 'forms.html',
        codeExample: `<form action="/submit" method="POST">
  <fieldset>
    <legend>Student Registration</legend>
    <label for="stu-email">University Email:</label>
    <input id="stu-email" type="email" required autocomplete="email" list="domains" />
    <datalist id="domains">
      <option value="you@stanford.edu"></option>
      <option value="you@mit.edu"></option>
    </datalist>
  </fieldset>
</form>`,
        terminalCommand: 'cat forms.html',
        terminalOutput: [
          'HTML5 Form Validation: required, type="email", and <datalist> bound cleanly.',
        ],
      },
      {
        id: 'html-mod-6',
        moduleNumber: 6,
        title: 'Module 6: Document Metadata & Web Resources',
        categoryLabel: 'HTML5 · LO 3',
        topics: [
          '1. Meta Elements (<meta>)',
          '2. Web Resources & Best Practices',
        ],
        markdownContent: `### Module 6: Document Metadata & Web Resources

#### 1. Meta Elements (\`<meta>\`)
- **Viewport Configuration**: \`<meta name="viewport" content="width=device-width, initial-scale=1.0">\`
- **SEO & Character Encoding**: \`<meta charset="UTF-8">\`, \`<meta name="description" content="...">\`

#### 2. Web Resources & Best Practices
- Leveraging official documentation channels (MDN Web Docs, W3C Specifications) and clean formatting standards.`,
        codeLanguage: 'html',
        codeFilename: 'meta_head.html',
        codeExample: `<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="description" content="EDOC Interactive Developer Sandbox" />
</head>`,
        terminalCommand: 'cat meta_head.html',
        terminalOutput: [
          'SEO & Viewport Check: UTF-8 encoding and responsive viewport meta configured.',
        ],
      },
    ],
  },
  {
    id: 'css',
    name: 'CSS3',
    title: 'Master Syllabus: Cascading Style Sheets (CSS) Fundamentals',
    badge: '3 Modules',
    chapters: [
      {
        id: 'css-mod-1',
        moduleNumber: 1,
        title: 'Module 1: Methods of Applying CSS Styles',
        categoryLabel: 'CSS Fundamentals · LO 1',
        topics: [
          'Inline Styles',
          'Embedded (Internal) Style Sheets',
          'Linking External Style Sheets (Industry Standard)',
        ],
        markdownContent: `### Module 1: Methods of Applying CSS Styles
CSS can be integrated into your web documents in three distinct ways, ranging from localized overrides to global project sheets:

1. **Inline Styles**: Applying CSS rules directly to an individual HTML element using the \`style\` attribute.
   - *Scope*: Affects only that specific tag.
   - *Use Case*: Quick, temporary testing or dynamic overrides via JavaScript.
   - *Drawback*: Violates the principle of separation of concerns (mixing structure with presentation) and makes large-scale maintenance difficult.
2. **Embedded (Internal) Style Sheets**: Placing CSS rules within a \`<style>\` element inside the \`<head>\` section of an HTML document.
   - *Scope*: Affects all matching elements within that single HTML page.
3. **Linking External Style Sheets (Industry Standard)**: Writing CSS rules in a separate file with a \`.css\` extension and linking it to HTML documents using the \`<link>\` tag inside the \`<head>\`.
   - *Benefits*: Faster page load times (via browser caching), cleaner HTML markup, and centralized maintenance.`,
        codeLanguage: 'html',
        codeFilename: 'css_methods.html',
        codeExample: `<!-- 1. External Stylesheet Link inside <head> -->
<link rel="stylesheet" href="styles.css">

<!-- 2. Embedded Style Sheet -->
<style>
  body {
    background-color: #f7fafc;
    font-family: Arial, sans-serif;
    color: #2d3748;
  }
  h2 {
    border-bottom: 2px solid #cbd5e0;
    padding-bottom: 8px;
  }
</style>

<!-- 3. Inline Style -->
<h1 style="color: #2b6cb0; font-family: 'Segoe UI', sans-serif;">Welcome to My Styled Page</h1>`,
        terminalCommand: 'cat css_methods.html',
        terminalOutput: [
          'CSS Injection Analysis: External (<link>), Embedded (<style>), and Inline (style="...") verified.',
        ],
      },
      {
        id: 'css-mod-2',
        moduleNumber: 2,
        title: 'Module 2: The Cascade & Conflicting Styles',
        categoryLabel: 'CSS Fundamentals · LO 1',
        topics: [
          'The Cascade Hierarchy (Specificity Score)',
          'Source Order Rule',
        ],
        markdownContent: `### Module 2: The Cascade & Conflicting Styles
When multiple style rules target the same HTML element, the browser determines which rule wins through **The Cascade** mechanism, governed by **Specificity** and **Source Order**.

#### 1. The Cascade Hierarchy (Specificity Score)
Rules are weighted and prioritized from lowest to highest priority:
1. **Browser Default Styles**: The baseline styling built into Chrome, Firefox, or Safari.
2. **External & Embedded Style Sheets**: Rules defined in \`.css\` files or \`<style>\` blocks.
3. **Inline Styles**: Defined directly on the element via the \`style="..."\` attribute (overrides external/embedded styles unless \`!important\` is used).
4. **The \`!important\` Declaration**: Overrides all normal rules, but should be used sparingly because it makes debugging difficult.

#### 2. Source Order Rule
If two conflicting rules have the exact same specificity (e.g., two class selectors applied to the same element), the **rule written last** in the stylesheet takes precedence.`,
        codeLanguage: 'css',
        codeFilename: 'cascade_specificity.css',
        codeExample: `/* Specificity & Source Order Demonstration */
.alert-box {
    color: #94a3b8;
}

/* Written later with identical specificity -> wins via Source Order Rule */
.alert-box {
    color: #22d3ee;
}

/* ID selector (0,1,0,0) overrides class selector (0,0,1,0) */
#primary-alert {
    color: #f59e0b;
}`,
        terminalCommand: 'cat cascade_specificity.css',
        terminalOutput: [
          'Cascade Resolver: #primary-alert (1,0,0) > .alert-box [2nd rule] (0,1,0) > .alert-box [1st rule]',
        ],
      },
      {
        id: 'css-mod-3',
        moduleNumber: 3,
        title: 'Module 3: Backgrounds',
        categoryLabel: 'CSS Fundamentals · LO 1',
        topics: [
          'Background Color (background-color)',
          'Background Images (background-image)',
          'Controlling Background Behavior (background-size, background-repeat, background-position, background-attachment)',
        ],
        markdownContent: `### Module 3: Backgrounds
CSS provides rich properties to style element backgrounds, transforming flat layouts into visually engaging interfaces:

- **Background Color (\`background-color\`)**: Sets a solid color background using names (\`tomato\`), HEX codes (\`#ff5733\`), RGB (\`rgb(255, 87, 51)\`), or HSL.
- **Background Images (\`background-image\`)**: Applies raster graphics or SVGs to an element's background.
- **Controlling Background Behavior**:
  - \`background-size\`: Controls image scaling (\`cover\` scales the image to completely cover the container; \`contain\` scales the image to fit entirely inside without cropping).
  - \`background-repeat\`: Controls tiling (\`no-repeat\`, \`repeat-x\`, \`repeat-y\`).
  - \`background-position\`: Controls alignment (\`center\`, \`top right\`, \`bottom left\`).
  - \`background-attachment\`: Determines if the background scrolls with the page (\`scroll\`) or stays fixed in place (\`fixed\`).`,
        codeLanguage: 'css',
        codeFilename: 'backgrounds.css',
        codeExample: `.card {
    background-color: #edf2f7;
}

header {
    background-image: url('images/hero-banner.jpg');
}

/* Shorthand Background Declaration */
.hero-section {
    background: #1a202c url('banner.jpg') no-repeat center center / cover;
}`,
        terminalCommand: 'cat backgrounds.css',
        terminalOutput: [
          'CSS Background Shorthand Validated: color=#1a202c, repeat=no-repeat, position=center, size=cover',
        ],
      },
    ],
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    title: 'UNIT-IV: JavaScript Concepts, Control Structures & Functions',
    badge: '3 Modules',
    chapters: [
      {
        id: 'js-mod-1',
        moduleNumber: 1,
        title: 'Module 1: Introduction, Input Dialogs & Operators',
        categoryLabel: 'JavaScript UNIT-IV · LO 1',
        topics: [
          '1. Introduction to JavaScript (Role in Web Architecture, Embedding JS)',
          '2. Obtaining User Input with Prompt Dialogs (alert, confirm, prompt)',
          '3. JavaScript Operators (Assignment, Increment/Decrement, Logical)',
        ],
        markdownContent: `### Module 1: Introduction, Input Dialogs & Operators

#### 1. Introduction to JavaScript
- **Role in Web Architecture**: JavaScript is a lightweight, interpreted, or JIT-compiled programming language that adds interactivity, dynamic content validation, and behavior to static HTML/CSS webpages.
- **Embedding JS**: Using the \`<script>\` tag in HTML documents (inline, embedded, or linked via external \`.js\` files).

#### 2. Obtaining User Input with Prompt Dialogs
- \`alert("Message");\`: Displays an informational popup message.
- \`confirm("Are you sure?");\`: Displays a modal dialog with OK/Cancel buttons, returning a boolean (\`true\`/\`false\`).
- \`prompt("Enter your name:");\`: Captures string input from the user via a text box dialog.

#### 3. JavaScript Operators
- **Assignment Operators (\`=\`, \`+=\`, \`-=\`, \`*=\`, \`/=\`)**: Assigns or modifies values in variables.
- **Increment (\`++\`) and Decrement (\`--\`) Operators**: Prefix (\`++x\`) increments before evaluating; Postfix (\`x++\`) increments after evaluating.
- **Logical Operators (\`&&\`, \`||\`, \`!\`)**: Combines boolean expressions.`,
        codeLanguage: 'javascript',
        codeFilename: 'js_operators.js',
        codeExample: `let score = 10;
score += 5; // Equivalent to score = score + 5 (score is now 15)
let bonus = ++score; // Prefix increment -> 16
const isPassing = score >= 15 && bonus > 0;
console.log("Score:", score, "| Passing:", isPassing);`,
        terminalCommand: 'node js_operators.js',
        terminalOutput: ['Score: 16 | Passing: true'],
      },
      {
        id: 'js-mod-2',
        moduleNumber: 2,
        title: 'Module 2: Control & Repetition Statements',
        categoryLabel: 'JavaScript UNIT-IV · LO 2',
        topics: [
          '1. Control Statements (if, else if, else, switch Statement)',
          '2. Repetition Statements (while, do-while, for Loops)',
          '3. Loop Control with break and continue',
        ],
        markdownContent: `### Module 2: Control & Repetition Statements

#### 1. Control Statements (Decision Making)
- **\`if\`, \`else if\`, and \`else\`**: Executes blocks of code conditionally based on evaluated boolean expressions.
- **\`switch\` Statement**: Evaluates an expression against multiple \`case\` clauses, cleanly handling multi-way branching without long \`else-if\` chains.

#### 2. Repetition Statements & Loop Control
- **Loops**: Counter-controlled \`for\` loops, sentinel-controlled \`while\` loops, and post-test \`do...while\` loops.
- **\`break\` & \`continue\`**: \`break\` exits the enclosing loop or \`switch\` immediately; \`continue\` skips the remaining body of the current iteration.`,
        codeLanguage: 'javascript',
        codeFilename: 'js_control.js',
        codeExample: `let day = "Monday";
switch (day) {
    case "Monday":
        console.log("Start of the work week.");
        break;
    default:
        console.log("Mid-week or weekend.");
}`,
        terminalCommand: 'node js_control.js',
        terminalOutput: ['Start of the work week.'],
      },
      {
        id: 'js-mod-3',
        moduleNumber: 3,
        title: 'Module 3: Functions, Scope Rules & Global Functions',
        categoryLabel: 'JavaScript UNIT-IV · LO 3',
        topics: [
          '1. Programmer-Defined Functions (Parameters, Return Values)',
          '2. Scope Rules (Global vs. Local / Block Scope with let & const)',
          '3. JavaScript Global Functions (parseInt, parseFloat, isNaN, encodeURI)',
        ],
        markdownContent: `### Module 3: Functions, Scope Rules & Global Functions

#### 1. Programmer-Defined Functions
Functions modularize logic into reusable blocks invoked with arguments and returning computed results via \`return\`.

#### 2. Lexical Scope Rules
Variables declared outside any function have **Global Scope**, whereas variables declared inside a function or block (\`let\`, \`const\`) have **Local / Block Scope**.

#### 3. Built-in Global Functions
- \`parseInt()\`, \`parseFloat()\`, \`isNaN()\`, \`isFinite()\`, \`encodeURIComponent()\`, and \`decodeURIComponent()\`.`,
        codeLanguage: 'javascript',
        codeFilename: 'js_functions.js',
        codeExample: `const globalMultiplier = 2;

function computeXP(rawInput) {
    const parsed = parseInt(rawInput, 10);
    if (isNaN(parsed)) return 0;
    return parsed * globalMultiplier;
}

console.log("Computed XP:", computeXP("710"));`,
        terminalCommand: 'node js_functions.js',
        terminalOutput: ['Computed XP: 1420'],
      },
    ],
  },
];

// ============================================================================
// CURRICULUM TOOL 3: SQL THEORY SYLLABUS
// ============================================================================
export const SQL_THEORY_CHAPTERS: TheoryChapter[] = [
  {
    id: 'sql-mod-1',
    moduleNumber: 1,
    title: 'Module 1: Relational Model, Schemas & DDL Statements',
    categoryLabel: 'SQL Curriculum · Module 1',
    topics: [
      'Relational Algebra & E.F. Codd Model (Tables, Tuples, Attributes)',
      'Data Definition Language (DDL): CREATE, ALTER, DROP, TRUNCATE',
      'Integrity Constraints: PRIMARY KEY, FOREIGN KEY, UNIQUE, NOT NULL, CHECK',
      'SQL Data Types (INT, VARCHAR, DECIMAL, TIMESTAMP, BOOLEAN)',
    ],
    markdownContent: `### Module 1: Relational Model, Schemas & DDL Statements
Structured Query Language (**SQL**) is the standard declarative language for managing relational database management systems (RDBMS).

#### Core Concepts
- **DDL (Data Definition Language)**: Defines table schemas and enforce referential integrity via **Primary Keys (\`PK\`)** and **Foreign Keys (\`FK\`)**.
- **Domain & Entity Integrity**: Guarantees every row is uniquely identifiable and column values adhere to declared types and \`CHECK\` constraints.`,
    codeLanguage: 'sql',
    codeFilename: 'schema_ddl.sql',
    codeExample: `CREATE TABLE students (
    id INT PRIMARY KEY,
    name VARCHAR(64) NOT NULL,
    major VARCHAR(32) DEFAULT 'Computer Science',
    level INT CHECK (level >= 1),
    xp INT NOT NULL DEFAULT 0
);

SELECT id, name, major, level, xp FROM students ORDER BY xp DESC;`,
    terminalCommand: 'sqlite3 edoc.db < schema_ddl.sql',
    terminalOutput: [
      '104 | Priya Nair       | Computer Science    | 31 | 1940',
      '102 | Elena Rostova    | Systems Engineering | 29 | 1780',
      '106 | Sofia Lindqvist  | Distributed Systems | 27 | 1650',
      '101 | Alex Rivera      | Computer Science    | 24 | 1420',
    ],
  },
  {
    id: 'sql-mod-2',
    moduleNumber: 2,
    title: 'Module 2: DML & Declarative SELECT Queries',
    categoryLabel: 'SQL Curriculum · Module 2',
    topics: [
      'Data Manipulation Language (DML): INSERT, UPDATE, DELETE',
      'Projection & Filtering: SELECT, DISTINCT, WHERE',
      'Logical & Pattern Predicates: AND, OR, IN, BETWEEN, LIKE',
      'Sorting & Pagination: ORDER BY (ASC/DESC), LIMIT, OFFSET',
    ],
    markdownContent: `### Module 2: DML & Declarative SELECT Queries
**DML (Data Manipulation Language)** inserts, modifies, and retrieves records. A \`SELECT\` query evaluates logically in the order: \`FROM\` $\\rightarrow$ \`WHERE\` $\\rightarrow$ \`GROUP BY\` $\\rightarrow$ \`HAVING\` $\\rightarrow$ \`SELECT\` $\\rightarrow$ \`ORDER BY\` $\\rightarrow$ \`LIMIT\`.`,
    codeLanguage: 'sql',
    codeFilename: 'select_filter.sql',
    codeExample: `SELECT id, name, major, xp
FROM students
WHERE xp > 1400
ORDER BY xp DESC
LIMIT 4;`,
    terminalCommand: 'sqlite3 edoc.db < select_filter.sql',
    terminalOutput: [
      '104 | Priya Nair       | Computer Science    | 1940',
      '102 | Elena Rostova    | Systems Engineering | 1780',
      '106 | Sofia Lindqvist  | Distributed Systems | 1650',
      '101 | Alex Rivera      | Computer Science    | 1420',
    ],
  },
  {
    id: 'sql-mod-3',
    moduleNumber: 3,
    title: 'Module 3: Aggregate Functions, GROUP BY & HAVING',
    categoryLabel: 'SQL Curriculum · Module 3',
    topics: [
      'Aggregate Functions: COUNT(), SUM(), AVG(), MIN(), MAX()',
      'Grouping Rows with GROUP BY',
      'Filtering Grouped Aggregates with HAVING vs. WHERE',
      'Handling NULL Values with COALESCE()',
    ],
    markdownContent: `### Module 3: Aggregate Functions, GROUP BY & HAVING
Aggregate functions summarize multiple rows into a single metric per group. Remember:
- \`WHERE\` filters individual rows **before** grouping.
- \`HAVING\` filters aggregated groups **after** \`GROUP BY\`.`,
    codeLanguage: 'sql',
    codeFilename: 'group_by_major.sql',
    codeExample: `SELECT major,
       COUNT(*) AS student_count,
       AVG(xp) AS avg_xp,
       MAX(level) AS top_level
FROM students
GROUP BY major;`,
    terminalCommand: 'sqlite3 edoc.db < group_by_major.sql',
    terminalOutput: [
      'Computer Science    | 2 | 1680 | 31',
      'Systems Engineering | 1 | 1780 | 29',
      'Data Science        | 1 | 1310 | 22',
      'Cybersecurity       | 1 | 1120 | 19',
      'Distributed Systems | 1 | 1650 | 27',
    ],
  },
  {
    id: 'sql-mod-4',
    moduleNumber: 4,
    title: 'Module 4: Relational Joins (INNER, LEFT, RIGHT, FULL)',
    categoryLabel: 'SQL Curriculum · Module 4',
    topics: [
      'Relational Join Mechanics & Foreign Key Matching',
      'INNER JOIN: Matching Rows Across Both Tables',
      'LEFT OUTER JOIN & Preserving Unmatched Left Rows',
      'Self Joins & Multi-Table Join Pipelines',
    ],
    markdownContent: `### Module 4: Relational Joins (INNER, LEFT, RIGHT, FULL)
Joins combine columns from two or more tables based on a related key column between them (such as \`students.id = submissions.student_id\`).`,
    codeLanguage: 'sql',
    codeFilename: 'joins_query.sql',
    codeExample: `SELECT students.name,
       submissions.problem_slug,
       submissions.language,
       submissions.status,
       submissions.runtime_ms
FROM students
JOIN submissions ON students.id = submissions.student_id
WHERE status = 'Accepted';`,
    terminalCommand: 'sqlite3 edoc.db < joins_query.sql',
    terminalOutput: [
      'Priya Nair      | merge-intervals   | Rust       | Accepted | 1ms',
      'Sofia Lindqvist | two-sum           | C++        | Accepted | 2ms',
      'Elena Rostova   | lru-cache         | C++        | Accepted | 3ms',
      'Alex Rivera     | two-sum           | Python     | Accepted | 4ms',
      'Marcus Vance    | valid-parentheses | TypeScript | Accepted | 6ms',
    ],
  },
  {
    id: 'sql-mod-5',
    moduleNumber: 5,
    title: 'Module 5: Subqueries, B-Tree Indexes & ACID Transactions',
    categoryLabel: 'SQL Curriculum · Module 5',
    topics: [
      'Scalar & Correlated Subqueries (IN, EXISTS)',
      'Common Table Expressions (WITH ... AS)',
      'B-Tree Indexing & EXPLAIN QUERY PLAN',
      'ACID Transactions (Atomicity, Consistency, Isolation, Durability)',
    ],
    markdownContent: `### Module 5: Subqueries, B-Tree Indexes & ACID Transactions
- **B-Tree Indexes**: Reduce table scan complexity from $O(N)$ full sequential scan to $O(\\log N)$ index lookup.
- **ACID Transactions**: Guarantee database reliability across \`BEGIN TRANSACTION\`, \`COMMIT\`, and \`ROLLBACK\`.`,
    codeLanguage: 'sql',
    codeFilename: 'transactions_index.sql',
    codeExample: `SELECT course_id, title, category, difficulty, enrolled
FROM courses
ORDER BY enrolled DESC;`,
    terminalCommand: 'sqlite3 edoc.db < transactions_index.sql',
    terminalOutput: [
      'SYS-108 | POSIX Shell & Linux Kernel Primitives    | Terminal | Easy   | 640',
      'WEB-210 | Modern DOM Architecture & CSS Grid       | Web Dev  | Medium | 510',
      'CS-301  | Advanced Data Structures & Graphs        | DSA      | Hard   | 420',
    ],
  },
];

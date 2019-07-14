# Statux [![npm install statux](https://img.shields.io/badge/npm%20install-statux-blue.svg)](https://www.npmjs.com/package/statux) [![gzip size](https://img.badgesize.io/franciscop/statux/master/index.min.js.svg?compression=gzip)](https://github.com/franciscop/statux/blob/master/index.min.js)

A straightforward React state management library with [hooks](https://reactjs.org/docs/hooks-overview.html) and [frozen state](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/freeze):

```js
import Store, { useStore, useSelector, useActions } from 'statux';

<Store user={false} books={[]}>...</Store>

const [state, setState] = useStore();
const [user, setUser] = useStore('user');

const state = useSelector();
const books = useSelector('books');
const books = useSelector(state => state.books);

const setState = useActions();
const setBooks = useActions('books');
const { append, prepend, ...actions } = useActions('books');
```

Jump to docs for [`<Store>`](#store), [`useStore()`](#usestore), [`useSelector()`](#useselector), [`useActions()`](#useactions),  [*examples*](#examples).



## Getting started

First create a React project (try [Create-React-App](https://github.com/facebook/create-react-app)) and install `statux`:

```
npm install statux
```

Now we are going to initialize our store at the App root level with a couple of initial values:

```js
// src/App.js
import React from 'react';
import Store from 'statux'; // This library
import Website from './Website'; // Your code

// Initial state is { user: null, books: [] }
export default () => (
  <Store user={null} books={[]}>
    <Website />
  </Store>
);
```

Finally, use and update these values wherever you want:

```js
// src/pages/User.js
import React from 'react';
import { useStore } from 'statux';

export default () => {
  const [user, setUser] = useStore('user');
  return (
    <div>
      Hello {user ? user.name : (
        <button onClick={e => setUser({ name: 'Maria' })}>Login</button>
      )}
    </div>
  )
};
```



## Why?

There are few reasons why I created this instead of using `useState()` or `redux`:

- **Direct manipulation**: change the state without going through reducers, actions, action creators, thunk action creators, etc. Still immutable, but statux removes [a full layer of indirection](https://twitter.com/dan_abramov/status/802564042648944642). The catch? refactoring a large codebase is more expensive since your actions are coupled to the state.
- **Frozen solid**: `Object.freeze()` is used internally, so you _cannot_ accidentally mutate the state. Beginners and experienced devs benefit from this avoiding common bugs.
- **Semantic React**: with [*react hooks*](https://reactjs.org/docs/hooks-overview.html) and [*statux actions*](#useactions), creating components and modifying state feel right at home.

Statux fits somewhere between React's local state and a fully fledged redux store. It's perfect for indie devs and small sized teams and projects.



## API

There are four pieces exported from the library:

- [**`<Store>`**](#store): the default export that should wrap your whole App. Its props define the store structure.
- [**`useStore(selector)`**](#usestore): extracts a part of the store for data retrieval and manipulation. Accepts a parameter to specify what subtree of the state to use.
- [**`useSelector(selector)`**](#useselector): retrieve a specific part of the store state based on the selector or the whole state if none was given.
- [**`useActions(selector)`**](#useactions): generate actions to modify the state while avoiding mutations. Includes default actions and can be extended.



### \<Store>

This should wrap your whole project, ideally in `src/App.js` or similar. You define the structure of all of your state within the `<Store>`:

```js
// src/App.js
import Store from 'statux';
import Navigation from './Navigation';

// state = { id: null, friends: [] }
export default () => (
  <Store id={null} friends={[]}>
    <Navigation />
  </Store>
);
```

It is highly recommended that your state tree, especially on the root, has the basic empty structure from the get-go:

```js
const BookList = () => {
  const [books] = useStore('books');
  if (!books.length) return 'No books yet';
  return books.map(book => <Book {...book} />);
};

// RECOMMENDED
export default () => (
  <Store books={[]}>
    <BookList />
  </Store>
);

// NOT RECOMMENDED
export default () => (
  <Store books={null}>
    <BookList />
  </Store>
);
```

When your state starts to grow - but not before - it is also recommended to split it into a separated variable for clarity:

```js
// src/App.js
import Store from 'statux';
import Navigation from './Navigation';

const initialState = {
  id: null,
  friends: [],
  // ...
};

export default () => (
  <Store {...initialState}>
    <Navigation />
  </Store>
);
```

That's all you need to know for creating your state. When your app starts to grow, best-practices of redux like normalizing your state are recommended.



### useStore()

This is a [React hook](https://reactjs.org/docs/hooks-overview.html) to handle a state subtree. It accepts **a selector** and returns an array similar to [React's `useState()`](https://reactjs.org/docs/hooks-state.html):

```js
import { useStore } from 'statux';

export default () => {
  const [user, setUser] = useStore('user');
  return (
    <div onClick={e => setUser({ name: 'Maria' })}>
      {user ? user.name : 'Anonymous'}
    </div>
  );
};
```

You can access deeper items and properties within your state through the selector:

```js
import { useStore } from 'statux';

export default () => {
  // If `user` is null, this will throw an error
  const [name = 'Anonymous', setName] = useStore('user.name');
  return (
    <div onClick={e => setName('John')}>
      {name}
    </div>
  );
};
```

It accepts a *string* selector that will find the corresponding state subtree, and also return a modifier for that subtree. `useStore()` behaves as the text-based selector for `useSelector()` and `useActions()` together:

```js
const [user, setUser] = useStore('user');
// Same as
const user = useSelector('user');
const setUser = useActions('user');
```

> Note: useStore() **only** accepts either a string selector or no selector at all; it **does not** accept ~functions~ or ~objects~ as parameters.

The first returned parameter is the frozen selected state subtree, and the second parameter is the setter. This setter is quite flexible:

```js
// Plain object to update it
setUser({ ...user, name: 'Francisco' });

// Function that accepts the current user
setUser(user => ({ ...user, name: 'Francisco' }));

// Modify only the specified props
setUser.assign({ name: 'Francisco' });
```

See the details and list of helpers on [the `useActions()` section](#useactions).



### useSelector()

This React hook retrieves a frozen (read-only) fragment of the state:

```js
import { useSelector } from 'statux';

export default () => {
  const user = useSelector('user');
  return <div>{user ? user.name : 'Anonymous'}</div>;
};
```

You can access deeper objects with the dot selector, which works both on objects and array indexes:

```js
import { useStore } from 'statux';

export default () => {
  const title = useSelector('books.0.title');
  const name = useSelector('user.name');
  return <div>{title} - by {name}</div>;
};
```

It accepts both a *string selector* and a *function selector* to find the state that we want:

```js
const user = useSelector('user');
const user = useSelector(({ user }) => user);
const user = useSelector(state => state.user);
```

You can dig for nested state, but if any of the intermediate trees is missing then it will fail:

```js
// Requires `user` to be an object
const name = useSelector('user.name');

// Can accept no user at all:
const user = useSelector(({ user }) => user ? user.name : 'Anonymous');

// This will dig the array friends -> 0
const bestFriend = useSelector('friends.0');
```



### useActions()

This React hook is used to modify the state in some way. Pass a selector to specify what state fragment to modify:

```js
const setState = useActions();
const setUser = useActions('user');
const setName = useActions('user.name');

// Update in multiple ways
setName('Francisco');
setName(name => 'San ' + name);
setName((name, key, state) => { ... });
```

These actions must be  executed within the appropriate callback:

```js
import { useActions } from 'statux';
import Form from 'your-form-library';

const ChangeName = () => {
  const setName = useActions('user.name');
  const onSubmit = ({ name }) => setName(name);
  return <Form onSubmit={onSubmit}>...</Form>;
};
```

It also returns helpers for immutable state as properties:

```js
// For Arrays: books = ['a', 'b', 'c']
const { fill, pop, push, ...actions } = useActions('books');

// Array methods made immutable
const onClick = e => fill(1);  // [1, 1, 1]
const onClick = e => pop(); // ['a', 'b']
const onClick = e => push('d'); // ['a', 'b', 'c', 'd']
const onClick = e => actions.reverse(); // ['c', 'b', 'a']
const onClick = e => actions.shift(); // ['b', 'c']
const onClick = e => actions.sort(); // ['a', 'b', 'c']
const onClick = e => actions.splice(1, 1, 'x'); // ['a', 'x', 'c']
const onClick = e => actions.unshift('x'); // ['x', 'a', 'b', 'c']

// Aliases
const onClick = e => actions.append('x');  // ['a', 'b', 'c', 'x']
const onClick = e => actions.prepend('x');  // ['x', 'a', 'b', 'c']
```

These do not mutate; but the helper is still convenient:

```js
// books = ['a', 'b', 'c']
const setBooks = useActions('books');
const onClick => setBooks(books => books.concat('d'));  // ['a', 'b', 'c', 'd']

const { concat, slice, filter, map, reduce, reduceRight } = useActions('books');
const onClick => concat('d', 'e');  // ['a', 'b', 'c', 'd', 'e']
const onClick => slice(1, 1);  // ['b']
const onClick => filter(item => /^(a|b)$/.test(item)); // ['a', 'b']
const onClick => map(book => book + '!'); // ['a!', 'b!', 'c!']
const onClick => reduce((all, book) => [...all, book + 'x'], []); // ['ax', 'bx', 'cx']
const onClick => reduceRight((all, book) => [...all, book], []); // ['c', 'b', 'a']
```

These methods can be extracted right in the actions or used as a method:

```js
const BookForm = () => {
  const setBooks = useActions('books');
  const onSubmit = book => setBooks.append(book);
  // OR
  const { append } = useActions('books');
  const onSubmit = book => append(book);

  return <Form onSubmit={onSubmit}>...</Form>;
};
```



## Examples

Help me write these? :)

### Todo list

A TODO list in 30 lines. See [the **working demo**](https://codesandbox.io/s/elegant-tdd-c8jlq):

```js
// App.js
export default () => (
  <Store todo={[]}>
    <h1>TODO List:</h1>
    <TodoList />
    <AddTodo />
  </Store>
);
```

```js
// TodoList.js
import { useStore } from "statux";
import React from "react";
import forn from "forn";

const Todo = ({ index }) => {
  // destructuring of "[item, setItem]":
  const [{ text, done }, { assign }] = useStore(`todo.${index}`);
  return (
    <li onClick={() => assign({ done: !done })}>
      {done ? <strike>{text}</strike> : text}
    </li>
  );
};

export default () => {
  const [todo, { append }] = useStore("todo");
  return (
    <ul>
      {todo.map((item, i) => (
        <Todo key={i + "-" + item.text} index={i} />
      ))}
      <li>
        <form onSubmit={forn(append, { reset: true })}>
          <input name="text" placeholder="Add item" />
          <button>Add</button>
        </form>
      </li>
    </ul>
  );
};
```

### Initial data loading

### Login and localStorage

### API calls

### Reset initial state

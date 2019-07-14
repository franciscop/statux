# Statux [![npm install statux](https://img.shields.io/badge/npm%20install-statux-blue.svg)](https://www.npmjs.com/package/statux) [![gzip size](https://img.badgesize.io/franciscop/statux/master/index.min.js.svg?compression=gzip)](https://github.com/franciscop/statux/blob/master/index.min.js)

An semantic and straightforward React state management library with [hooks](https://reactjs.org/docs/hooks-overview.html):

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

- **Direct manipulation**: change the state without going through reducers, actions, action creators, thunk action creators, etc. Still immutable, but statux removes [a full layer of indirection](https://twitter.com/dan_abramov/status/802564042648944642). There is a cost though; refactoring a large codebase is more expensive since your actions depend on the state.
- **Frozen solid**: `Object.freeze()` is used internally, so you _cannot_ accidentally mutate the state. Beginners and experienced devs benefit from this avoiding common bugs.
- **Semantic React**: with [*react hooks*](https://reactjs.org/docs/hooks-overview.html) and [*statux actions*](#useactions), creating components and modifying state feel right at home.

Statux sits somewhere between React's local state and a fully fledged redux store. It's perfect for indie-devs and small-sized teams and projects.



## API

There are four pieces exported from the library:

- [**`<Store>`**](#store): the default export that should wrap your whole App. Its props define the store structure.
- [**`useStore(selector)`**](#usestore): extracts a part of the store for data retrieval and manipulation. Accepts a parameter to specify what fragment of the store to use.
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

When your state starts to grow - but not before - it is recommended to split it into a separated variable:

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



### useStore()

This is a [React hook](https://reactjs.org/docs/hooks-overview.html) to handle a fragment of state. It returns an array [similar to React's `useState()`](https://reactjs.org/docs/hooks-state.html):

```js
import { useStore } from 'statux';

export default () => {
  const [user, setUser] = useStore('user');
  return () => (
    <div onClick={e => setUser({ name: 'Maria' })}>
      {user ? user.name : 'Anonymous'}
    </div>
  );
};
```

You can access deeper objects, but then make sure that their parent exists:

```js
import { useStore } from 'statux';

export default () => {
  // If `user` is null, this will throw an error
  const [name, setName] = useStore('user.name');
  return () => (
    <div onClick={e => setName('John')}>
      {name ? name : 'Anonymous'}
    </div>
  );
};
```

It accepts a *string* selector that will find the fragment of state desired, and also return a modifier for it. This hook behaves as the basic `useSelector()` and `useActions()` together:

```js
const [user, setUser] = useStore('user');
// Same as
const user = useSelector('user');
const setUser = useActions('user');
```

> Note: useStore() **only** accepts either a string selector or no selector at all; it **does not** accept ~functions~ or ~objects~ as parameters.

The first returned parameter is the current value of that object in the store, and the second parameter is the setter. This setter is quite flexible:

```js
// Plain object to update it
setUser({ ...user, name: 'Francisco' });

// Function that accepts the current user
setUser(current => ({ ...current, name: 'Francisco' }));

// Modify only the specified props
setUser.assign({ name: 'Francisco' });
```

See all the helpers of the setter on [the `useActions()` section](#useactions).



### useSelector()

This React hook retrieves a fragment of the state:

```js
import { useSelector } from 'statux';

export default () => {
  const user = useSelector('user');
  return () => (
    <div>{user ? user.name : 'Anonymous'}</div>
  );
};
```

You can access deeper objects, but then make sure that their parent exists:

```js
import { useStore } from 'statux';

export default () => {
  // If `user` is null, this will throw an error
  const name = useSelector('user.name');
  return () => (
    <div>
      {name || 'Anonymous'}
    </div>
  );
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
const setBooks = useActions('books');

// Array methods made immutable
setBooks.fill(1);  // [1, 1, 1]
setBooks.pop(); // ['a', 'b']
setBooks.push('d'); // ['a', 'b', 'c', 'd']
setBooks.reverse(); // ['c', 'b', 'a']
setBooks.shift(); // ['b', 'c']
setBooks.sort(); // ['a', 'b', 'c']
setBooks.splice(1, 1, 'x'); // ['a', 'x', 'c']
setBooks.unshift('x'); // ['x', 'a', 'b', 'c']

// Aliases
setBooks.append('x');  // ['a', 'b', 'c', 'x']
setBooks.prepend('x');  // ['x', 'a', 'b', 'c']
```

For immutable methods, provide helpers though you can also use the normal syntax:

```js
// books = ['a', 'b', 'c']
const setBooks = useActions('books');
setBooks(books => books.concat('d', 'e'));  // ['a', 'b', 'c', 'd', 'e']
setBooks.concat('d', 'e');  // ['a', 'b', 'c', 'd', 'e']
setBooks.slice(1, 1);  // ['b']
setBooks.filter(item => /^(a|b)$/.test(item)); // ['a', 'b']
setBooks.map(book => book + '!'); // ['a!', 'b!', 'c!']
setBooks.reduce((all, book) => [...all, book + 'x'], []); // ['ax', 'bx', 'cx']
setBooks.reduceRight((all, book) => [...all, book], []); // ['c', 'b', 'a']
```

These methods can be extracted right in the actions:

```js
const BookForm = () => {
  const { append } = useActions('books');
  const onSubmit = book => append(book);
  return <Form onSubmit={onSubmit}>...</Form>;
};
```



## Examples

Help me write these? :)

### Todo list

See [the demo]():

```js
// App.js
export default () => (
  <Store todo={[]}>
    <TodoList />
    <AddTodo/ >
  </Store>
);
```

```js
// TodoList.js
export default () => {
  const list = useSelector('todo');
  return (
    <ul>
      {list.map(item => <Item done={item.done}>{item.text}</Item>)}
    </ul>
  );
};
```

### Initial data loading

### Login and localStorage

### API calls

### Reset initial state

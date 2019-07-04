# Statux [![npm install statux](https://img.shields.io/badge/npm%20install-statux-blue.svg)](https://www.npmjs.com/package/statux) [![gzip size](https://img.badgesize.io/franciscop/statux/master/index.min.js.svg?compression=gzip)](https://github.com/franciscop/statux/blob/master/index.min.js)

A React state management library with hooks:

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

Jump to [`<Store>`](#store), [`useStore()`](#usestore), [`useSelector()`](#useselector), [`useActions()`](#useactions).

## Getting started

First create a React project ([Create-React-App](https://github.com/facebook/create-react-app) is recommended) and install `statux`:

```
npm install statux
```

Now we are going to initialize our store at the App root level with a couple of default values:

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
      Hello  {user ? user.name : (
        <button onClick={e => setUser({ name: 'Maria' })}>Login</button>
      )}
    </div>
  )
};
```


## API

There are four pieces exported from the library:

- [**`<Store>`**](#store): the default export that should wrap your whole App. Its props define the store structure.
- [**`useStore()`**](#usestore): extracts a part of the store for data retrieval and manipulation. Accepts a parameter to specify what fragment of the store to use.
- [**`useSelector()`**](#useselector): accepts a selector that will receive the current state and return a single value. Returns the whole state if no selector was given.
- [**`useActions()`**](#useactions): some default actions that you can use straight away to simplify your code and avoid mutations.



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

When your state starts to grow, we recommend splitting it into a separated variable:

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

This is a React hook to handle a fragment of state. It returns an array similar to React's `useState()`:

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
  // If `user` is null, this will fail
  const [name, setName] = useStore('user.name');
  return () => (
    <div onClick={e => setName('John')}>
      {name ? name : 'Anonymous'}
    </div>
  );
};
```

It accepts a *string* selector that will find the fragment of state desired, and also return a modifier for it. This hook behaves as `useSelector()` and `useActions()` together:

```js
const [user, setUser] = useStore('user');
// Same as
const user = useSelector('user');
const setUser = useActions('user');
```

> Note: useStore() only accepts either a string selector or no selector at all; it **does not** accept ~functions~ or ~objects~ as parameters.

The first returned parameter is the current value of that object in the store, and the second parameter is the setter. This setter is quite flexible:

```js
// Plain object to update it
setUser({ ...user, name: 'Francisco' });

// Function that accepts the current user
setUser(current => ({ ...current, name: 'Francisco' }));

// Modify only the specified props
setUser.assign({ name: 'Francisco' });
```

See a full description of how the setter works on [the `useActions()` section](useactions).


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
  // If `user` is null, this will fail
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

```js
const setState = useActions();
const setUser = useActions('user');
const setName = useActions('user.name');

setName('Francisco');
setName(name => 'San ' + name);
setName((name, key, state) => { ... });
```


## Examples

### Initial data loading

### Login and localStorage

### API calls

## Tutorial - Pokemon Website

In this example we are going to build a fully working pokedex! It will show a list of pokemon, and whether the user has captured them or not. It will include authentication and asynchronously loading the data.

We are going to see each section individually, but first let's see the base of our App:

```js
// src/App.js
export default () => (
  <Store user={false} pokemon={false}>
    <Router>
      <Switch>
        <Route exact to="/" component={PokemonList} />
        <Route exact to="/login" component={Auth} />
        <Route exact to="/user" component={User} />
        <Route exact to="/:id" component={Pokemon} />
      </Switch>
    </Router>
  </Store>
);
```

### Auth

How to authenticate the user with an API that returns a user:

```js
// src/Auth.js
import { useActions } from 'statux';
import axios from 'axios';
import Form from 'your-favourite-form-library';
import { Redirect } from 'react-router';

export default () => {
  const setUser = useActions('user');
  const login = async ({ email, password }) => {
    const { data } = await axios.post('/login', { email, password });
    setUser(user);
  };
  if (user) return <Redirect to="/user" />;
  return (
    <Form onSubmit={login}>
      Email: <input name="email" type="email" />
      Password: <input name="password" type="password" />
      <button>Send</button>
    </Form>
  );
};
```


### Loading pokemons async

Now let's load the list of pokemon asynchronously:

```js
// src/PokemonList.js
import { useStore } from 'statux';
import React, { useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router';

const url = 'https://pokeapi.co/api/v2/pokemon/1';

export default () => {
  const [pokemon, setPokemon] = useStore('pokemon');
  useEffect(() => {
    (async () => {
      const { data } = await axios.get(url);
      setPokemon(data);
    })();
  }, []);
  if (!pokemon) return 'Loading...';
  return (
    <div>
      <h2>Pokemon list:</h2>
      <ul>
        {pokemon.map(({ id, name }) => (
          <li>
            <Link to={`/${id}`}>{name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};
```

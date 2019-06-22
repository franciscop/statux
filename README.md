# Statux [![npm install statux](https://img.shields.io/badge/npm%20install-statux-blue.svg)](https://www.npmjs.com/package/statux) [![gzip size](https://img.badgesize.io/franciscop/statux/master/index.min.js.svg?compression=gzip)](https://github.com/franciscop/statux/blob/master/index.min.js)

A React state management store with hooks:

```js
import Store, { useSelector } from  'statux';

// App.js
export default () => {
  <Store user={false}>
    ...
  </Store>
};

// User.js
export default () => {
  const user = useSelector('user');
  return <div>Hello {user ? user.name : 'Anonymous'}</div>;
};
```

## Getting started

First create a React project (we recommend using [Create-React-App](https://github.com/facebook/create-react-app) for this). Then install `statux`:

```
npm install statux
```

Now we are going to initialize our store at the App root level with the default values:

```js
// src/App.js
import React from 'react';
import Store from 'statux'; // This library
import Website from './Website'; // Your code

export default () => (
  <Store user={false} books={[]} {...}>
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

```js
import Store, { useSelector, useActions, useStore } from 'statux';
```

- **`Store`**: the main wrapper, every other component should be used within the tree of this. Its keys define the store structure.
- **`useStore()`**: returns a fragment of the store when passing a parameter or the whole store otherwise.
- **`useSelector()`**: accepts a selector that will receive the current state and return a single value. Returns the whole state if no selector was given.
- **`useActions()`**: some default actions that you can use straight away to simplify your code and avoid mutations.

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
const { append, prepend } = useActions('books');
```



## Example - Pokemon Website

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

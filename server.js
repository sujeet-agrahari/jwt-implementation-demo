const express = require('express');

const app = express();

const moment = require('dayjs');

const uuid = require('uuid').v4;

const jwt = require('jsonwebtoken');

const secretKey = 'nBrvwTw4KHlgIkt7ho55caWBQcp5ahOH';

const db = {
  users: {},
  refreshTokens: {},
  posts: {},
};

app.use(express.json());

app.post('/register', (req, res) => {
  try {
    const { username, password } = req.body;
    if (db.users[username]) {
      return res.status(400).send('User already exist!')
    }
    db.users[username] = {
      username,
      password // use bcryptjs to store hashed password
    };
    return res.status(200).send('Registered successfully!');
  } catch (error) {
    return res.status(500).send(error.message);
  }
})

app.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.users[username];
    if (!user) {
      return res.status(404).send('User not found!');
    }
    if (user.password !== password) {
      return res.status(401).send('Access denied!');
    }
    const accessToken = jwt.sign({ username }, secretKey, { algorithm: 'HS256', expiresIn: '1m' });
    const refreshToken = uuid();
    const csrf = uuid();
    db.refreshTokens[username] = {
      refreshToken, //use bcryptjs to store hashed refreshToken
      expiresOn: moment().add('hours', 1).format('YYYY-MM-DD'),
    }
    res.cookie(
      'auth',
      {
        csrf,
        accessToken,
        refreshToken,
      },
      {
        httpOnly: true,
      }
    )
    return res.status(200).send('Logged in successfully!');
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

app.post('/posts', (req, res) => {
  try {
    const accessToken = (JSON.parse(req.cookies.auth)).accessToken;
    if (!accessToken) {
      return res.status(401).send('Access denied!');
    }
    const user = jwt.verify(accessToken, secretKey, { algorithm: 'HS256', expiresIn: '1m' });

    const { title, body } = req.body;

    const userPosts = db.posts[user.username];
    const post = {
      postId: uuid(),
      title,
      body,
    }
    if (!userPosts) {
      db.posts[username] = [post]
    }
    userPosts.push(post);
    return res.status(201).send(post);
  } catch (error) {
    return res.status(500).send(error.message);
  }
});

app.get('/posts', (req, res) => {
  try {
    const accessToken = (JSON.parse(req.cookies.auth)).accessToken;
    if (!accessToken) {
      return res.status(401).send('Access denied!');
    }
    const user = jwt.verify(accessToken, secretKey, { algorithm: 'HS256', expiresIn: '1m' });
    const userPosts = db.posts[user.username];
    return res.status(200).send(userPosts);
  } catch (error) {
    return res.status(500).send(error.message);
  }
})

app.post('/refresh-token', (req, res) => {
  try {
    const authCookie = (JSON.parse(req.cookies.auth));
    const { accessToken, refreshToken } = authCookie;
    if (!accessToken || !refreshToken) {
      return res.status(401).send('Access denied!');
    };
    const payload = jwt.decode(accessToken);
    const user = db.users[payload.username];
    if (!user) {
      return res.status(404).send('User not found!');
    }
    const storedRefreshToken = db.refreshTokens[refreshToken];
    if (!storedRefreshToken) {
      return res.status(401).send('Access denied!');
    }
    if (moment(storedRefreshToken.expiresOn).isBefore(moment())) {
      return res.status(401).send('Access denied!');
    }
    const newAccessToken = jwt.sign({ username: db.payload[username] }, secretKey, { algorithm: 'HS256', expiresIn: '1m' });
    const newCsrf = uuid();
    db.refreshTokens[username] = {
      refreshToken, //use bcryptjs to store hashed refreshToken
      expiresOn: moment().add('hours', 1).format('YYYY-MM-DD'),
    }
    res.cookie(
      'auth',
      {
        csrf: newCsrf,
        refreshToken,
        accessToken: newAccessToken,
      },
      {
        httpOnly: true,
      }
    )
    return res.status(200).send('Logged in successfully!');
  } catch (error) {
    return res.status(500).send(error.message);
  }
});
app.listen(3000, () => {
  console.log('Listening on port 3000...');
})
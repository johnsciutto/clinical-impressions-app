const express = require('express');

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const PORT = process.env.PORT || 3000;

const ConditionsAPI = express.Router();
require('./routes/conditions-route')(ConditionsAPI);

const TestsAPI = express.Router();
require('./routes/tests-route')(TestsAPI);

app.use('/api/v1/condition', ConditionsAPI);
app.use('/api/v1/test', TestsAPI);

app.listen(PORT, () => console.log(`Listening on port ${PORT}...`));

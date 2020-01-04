/* eslint-disable no-undef */
// nodejs module for making api requests
const request = require('request');
// pg for postgres db transactions
const { Pool } = require('pg');
// bcrypt for password hashing
const bcrypt = require('bcrypt');

// load .env
require('dotenv').config('../.env');

// api url
const url = process.env.API_URL;

// pool of connections to avoid re-connections to postgres with each request
const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PORT,
});

// employee details
const employeeDetails = {
  name: 'Marie Mwende',
  email: 'mwendeJ@test.com',
  password: 'password',
};

// parse body to JSON
const parseToJson = (body) => JSON.parse(body);

// const handle errors
const handleError = (error) => {
  if (error) {
    throw error;
  }
};

// declare global vars
let token;
let employeeId;

// global vars array
const globals = [
  'token',
  'employeeId',
];

// reset global vars to undefined
const resetGlobals = (vars) => {
  vars.forEach(
    // eslint-disable-next-line no-unused-vars
    (variable) => {
      // eslint-disable-next-line no-param-reassign
      variable = undefined;
    },
  );
};

// create && login employee
const createAndAuthenticateEmployee = (detailsObject, callback) => {
  bcrypt.hash(detailsObject.password, 10, (error, hash) => {
    // handle error
    handleError(error);
    // create employee
    pool.query('INSERT INTO employees (name, email, password) VALUES ($1, $2, $3)',
      [detailsObject.name, detailsObject.email, hash], (error1) => {
        // handle error
        handleError(error1);
        // get the newly created employeee id
        pool.query('SELECT id FROM employees WHERE email = $1', [detailsObject.email],
          (error2, result) => {
          // handle error
            handleError(error2);
            // employee id
            employeeId = result.rows[0].id;
            // login the newly created employee
            request.post({
              uri: `${url}/employees/login`,
              form: detailsObject,
            }, (error3, _response, body) => {
            // handle error
              handleError(error3);
              // employee issued auth token
              const jsonBody = parseToJson(body);
              token = jsonBody.data;

              // callback for the action by authenticated employee
              callback(token);
            });
          });
      });
  });
};

// test api can handle wild GET requests
describe('API', () => {
  let getWildRequestStatus;
  beforeAll((done) => {
    // given an employee
    createAndAuthenticateEmployee(employeeDetails, (empToken) => {
      // when they hit the endpoint GET /* (any undefined endpoint)
      request.get({
        uri: `${url}/anything-wild`,
        headers: {
          Authorization: `bearer ${empToken}`,
        },
        form: {
          id: employeeId,
        },
      }, (error, response, body) => {
      // handle error
        handleError(error);
        getWildRequestStatus = parseToJson(body).status;
        done();
      });
    });
  });

  // then the get a message that there request didn't match any endpoint
  it('can handle wild GET requests', () => {
    expect(getWildRequestStatus).toEqual('success');
  });

  // clean up db after test
  afterAll((done) => {
  // delete employee
    pool.query('DELETE FROM employees WHERE email = $1', [employeeDetails.email], (error) => {
      // handle error
      handleError(error);
      // reset globals
      resetGlobals(globals);
      done();
    });
  });
});

// test api can handle wild POST requests
describe('API', () => {
  let postWildRequestStatus;
  beforeAll((done) => {
    // given an employee
    createAndAuthenticateEmployee(employeeDetails, (empToken) => {
      // when they hit the endpoint POST /* (any undefined endpoint)
      request.post({
        uri: `${url}/anything-wild`,
        headers: {
          Authorization: `bearer ${empToken}`,
        },
        form: {
          id: employeeId,
        },
      }, (error, response, body) => {
      // handle error
        handleError(error);
        postWildRequestStatus = parseToJson(body).status;
        done();
      });
    });
  });

  // then the get a message that there request didn't match any endpoint
  it('can handle wild POST requests', () => {
    expect(postWildRequestStatus).toEqual('success');
  });

  // clean up db after test
  afterAll((done) => {
  // delete employee
    pool.query('DELETE FROM employees WHERE email = $1', [employeeDetails.email], (error) => {
      // handle error
      handleError(error);
      // reset globals
      resetGlobals(globals);
      done();
    });
  });
});

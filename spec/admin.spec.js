/* eslint-disable no-undef */
// nodejs module for making api requests
const request = require('request');
// faker for generating fake data
const faker = require('faker');
// pg for postgres db transactions
const { Pool } = require('pg');


// load .env
require('dotenv').config('../.env');

// api url
const url = process.env.API_URL;

// pool of connections to avoid re-connections to postgres with each request
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});


// admin details
const adminDetails = {
  email: process.env.DB_ADMIN,
  password: process.env.DB_PASSWORD,
};

// employee details
const employeeDetails = {
  name: faker.name.findName(),
  email: faker.internet.email(),
  password: faker.internet.password(),
};


// parse body to JSON
const parseToJson = (body) => JSON.parse(body);

// const handle errors
const handleError = (error) => {
  if (error) {
    throw error;
  }
};

// admin login test
describe('Admin', () => {
  let status;

  beforeAll((done) => {
    // attempt admin login
    request.post({
      uri: `${url}/admin/login`,
      form: adminDetails,
    }, (error, response, body) => {
      handleError(error);

      const bodyJson = parseToJson(body);
      status = bodyJson.status;
      done();
    });
  });

  it('can login', () => {
    expect(status).toEqual('success');
  });
});

// admin create employee test
describe('Admin ', () => {
  let token; let
    status;

  beforeAll((done) => {
    // login admin
    request.post({
      uri: `${url}/admin/login`,
      form: adminDetails,
    }, (error, response, body) => {
      handleError(error);

      const bodyJson = parseToJson(body);
      token = bodyJson.data;

      done();
    });
  });

  beforeEach((done) => {
    // admin attempts creating employee
    request.post({
      headers: {
        Authorization: `bearer ${token}`,
      },
      uri: `${url}/admin/employees`,
      form: employeeDetails,
    }, (error, response, body) => {
      handleError(error);

      const bodyJson = parseToJson(body);
      status = bodyJson.status;
      done();
    });
  });

  afterAll((done) => {
    pool.query('DELETE FROM employees WHERE email = $1', [employeeDetails.email], (error, result) => {
      handleError(error);
    });
    done();
  });

  it('can create employee', () => {
    expect(status).toEqual('success');
  });
});

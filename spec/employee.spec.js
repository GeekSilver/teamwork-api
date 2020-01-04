/* eslint-disable no-undef */
// nodejs module for making api requests
const request = require('request');
// pg for postgres db transactions
const { Pool } = require('pg');
// bcrypt for password hashing
const bcrypt = require('bcrypt');
// faker for generating fake data
const faker = require('faker');
// node filesystem
const fs = require('fs');
// cloudinary for cloud file storage
const cloudinary = require('cloudinary');


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

// cloudinary config
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// second employee details
const secondEmployee = {
  name: 'emp',
  email: 'pope@test.com',
  password: 'password',
};

// employee details
const employeeDetails = {
  name: 'Marie Mwende',
  email: 'mwendeJ@test.com',
  password: 'password',
};

// article details
const articleDetails = {
  title: 'Afternoon Coffee!',
  body: 'drink re-fill drink repeat',
  category: 'romance',
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
let loginStatus;

// global vars array
const globals = [
  'token',
  'employeeId',
  'loginStatus',
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
              loginStatus = jsonBody.status;

              // callback for the action by authenticated employee
              callback(token);
            });
          });
      });
  });
};

// delete an employee and tables that reference the employee
const delEmployeeAndReferences = (employeeEmail, table, callback) => {
  // delete the table that references the employee
  pool.query(`DELETE FROM ${table} WHERE employee_id = $1`, [employeeId], (error) => {
    handleError(error);
    // then delete employee created
    pool.query('DELETE FROM employees WHERE email = $1', [employeeEmail], (error1) => {
    // handle error
      handleError(error1);
      // callback 'done' to ensure excution completes before next segment
      callback();
    });
  });
};

// login test
describe('Employee', () => {
  beforeAll((done) => {
    // create employee & attempt sign in
    createAndAuthenticateEmployee(employeeDetails, () => {
      done();
    });
  });


  it('can login', () => {
    expect(loginStatus).toEqual('success');
  });

  afterAll((done) => {
    // reset global vars
    resetGlobals(globals);
    // delete employee created
    pool.query('DELETE FROM employees WHERE email=$1', [employeeDetails.email], (error) => {
      handleError(error);
      // delete article created
      done();
    });
  });
});

// post articles test
describe('Employee', () => {
  let postArticleStatus;
  beforeAll((done) => {
    // given an authenticated employee
    createAndAuthenticateEmployee(employeeDetails, (empToken) => {
      // and an article
      request.post({
        uri: `${url}/articles`,
        headers: {
          Authorization: `bearer ${empToken}`,
        },
        form: {
          id: employeeId,
          ...articleDetails,
        },
      }, (error4, _response1, body1) => {
        // handle error
        handleError(error4);
        const bodyJson = parseToJson(body1);
        postArticleStatus = bodyJson.status;
        done();
      });
    });
  });

  // destroy created employee
  afterAll((done) => {
    // reset globals
    resetGlobals(globals);
    // delete article & employee
    delEmployeeAndReferences(employeeDetails.email, 'articles', done);
  });


  // an article gets created
  // eslint-disable-next-line no-undef
  it('can post articles', () => {
    expect(postArticleStatus).toEqual('success');
  });
});

// edit articles test
describe('Employee', () => {
  let editArticleStatus;
  // given an authenticated employee and their article
  beforeAll((done) => {
    createAndAuthenticateEmployee(employeeDetails, (empToken) => {
      request.post({
        uri: `${url}/articles`,
        headers: {
          Authorization: `bearer ${empToken}`,
        },
        form: {
          id: employeeId,
          ...articleDetails,
        },
      }, (error) => {
      // handle error
        handleError(error);
        pool.query('SELECT id FROM articles WHERE employee_id = $1', [employeeId],
          (error1, result) => {
          // handleError
            handleError(error1);
            const articleId = result.rows[0].id;
            // when the employee hits the endpoint /articles/:id
            request.put({
              uri: `${url}/articles/${articleId}`,
              headers: {
                Authorization: `bearer ${empToken}`,
              },
              form: {
                ...articleDetails,
                id: employeeId,
                title: 'updated title',
              },
            }, (error2, _response1, updateBody) => {
              // handle error
              handleError(error2);
              // extract status
              editArticleStatus = parseToJson(updateBody).status;

              done();
            });
          });
      });
    });
  });

  // then the article gets edited
  it('can edit their article', () => {
    expect(editArticleStatus).toEqual('success');
  });

  // destroy created employee
  afterAll((done) => {
    // reset globals
    resetGlobals(globals);
    // delete article & employee
    delEmployeeAndReferences(employeeDetails.email, 'articles', done);
  });
});

// delete article test
describe('Employee', () => {
  let deleteArticleStatus;
  // given an authenticated employee and their article
  // given an authenticated employee and their article
  beforeAll((done) => {
    createAndAuthenticateEmployee(employeeDetails, (empToken) => {
      request.post({
        uri: `${url}/articles`,
        headers: {
          Authorization: `bearer ${empToken}`,
        },
        form: {
          id: employeeId,
          ...articleDetails,
        },
      }, (error) => {
        // handle error
        handleError(error);
        pool.query('SELECT id FROM articles WHERE employee_id = $1', [employeeId],
          (error1, result) => {
            // handleError
            handleError(error1);
            const articleId = result.rows[0].id;
            // when they hit the endpoint [DELETE] /articles/:id
            request.delete({
              uri: `${url}/articles/${articleId}`,
              headers: {
                Authorization: `bearer ${empToken}`,
              },
              form: {
                id: employeeId,
              },
            }, (error2, _response1, deleteBody) => {
            // handle error
              handleError(error2);
              // extract status
              deleteArticleStatus = parseToJson(deleteBody).status;
              done();
            });
          });
      });
    });
  });

  // the article gets deleted
  // then the article gets edited
  it('can delete their article', () => {
    expect(deleteArticleStatus).toEqual('success');
  });
  // destroy created employee
  afterAll((done) => {
    // reset globals
    resetGlobals(globals);
    // delete article & employee
    delEmployeeAndReferences(employeeDetails.email, 'articles', done);
  });
});

// comment on other employees article's test
describe('Employee ', () => {
  let articleId;
  let commentArticleStatus;
  beforeAll((done) => {
    // given a user & a different user's article
    createAndAuthenticateEmployee(employeeDetails, (empToken) => {
      // creating the article
      request.post({
        uri: `${url}/articles`,
        headers: {
          Authorization: `bearer ${empToken}`,
        },
        form: {
          id: employeeId,
          ...articleDetails,
        },
      }, (error4) => {
        // handle error
        handleError(error4);
        // get article id
        pool.query('SELECT id FROM articles WHERE employee_id = $1', [employeeId],
          (error, result) => {
          // handle any error
            handleError(error);
            articleId = result.rows[0].id;
            // create the second employee
            createAndAuthenticateEmployee(secondEmployee, (empToken1) => {
              // when second employee hits the endpoint POST /articles/:id/comments
              request.post({
                uri: `${url}/articles/${articleId}/comments`,
                headers: {
                  Authorization: `bearer ${empToken1}`,
                },
                form: {
                  id: employeeId,
                  comment: 'When you hit push --force on Friday:)',
                },
              }, (error1, _response, body) => {
                // handle any errors
                handleError(error1);
                commentArticleStatus = parseToJson(body).status;
                done();
              });
            });
          });
      });
    });
  });

  // then a comment is added to the article comments
  it('can comment on other employee\'s articles ', () => {
    expect(commentArticleStatus).toEqual('success');
  });

  // clean up after test
  afterAll((done) => {
    // delete comment & the employee who posted it
    delEmployeeAndReferences(secondEmployee.email, 'comments', () => {
      // delete article
      pool.query(`DELETE FROM articles WHERE employee_id = 
      (SELECT id FROM employees WHERE email = $1)`, [employeeDetails.email], (error) => {
        // handle error
        handleError(error);
        // delete the employee who wrote the article
        pool.query('DELETE FROM employees WHERE email = $1', [employeeDetails.email], (error1) => {
          // handle error
          handleError(error1);
          done();
        });
      });
    });
    // reset globals
    resetGlobals(globals);
  });
});

// view all articles test
describe('Employee', () => {
  let viewAllArticlesStatus;
  beforeAll((done) => {
    // given a user & articles
    createAndAuthenticateEmployee(employeeDetails, (empToken) => {
      // creating the first article
      request.post({
        uri: `${url}/articles`,
        headers: {
          Authorization: `bearer ${empToken}`,
        },
        form: {
          id: employeeId,
          ...articleDetails,
        },
      }, (error4) => {
        // handle error
        handleError(error4);
        // the second article
        request.post({
          uri: `${url}/articles`,
          headers: {
            Authorization: `bearer ${empToken}`,
          },
          form: {
            id: employeeId,
            title: 'second article',
            body: 'Monday\'s are made from hell!',
            category: 'horror',
          },
        }, (error) => {
          // handle error
          handleError(error);
          // when the user hits the endpoint GET /articles
          request.get({
            uri: `${url}/articles`,
            headers: {
              Authorization: `bearer ${empToken}`,
            },
            form: {
              id: employeeId,
            },
          }, (error1, _response1, body1) => {
            viewAllArticlesStatus = parseToJson(body1).status;
            done();
          });
        });
      });
    });
  });

  // then they view all articles
  it('can view all articles', () => {
    expect(viewAllArticlesStatus).toEqual('success');
  });

  // cleanup db after test
  afterAll((done) => {
    // reset globals
    resetGlobals(globals);
    // delete articles and employee
    pool.query(`DELETE FROM articles WHERE employee_id = (
      SELECT id FROM employees WHERE email = $1
    )`, [employeeDetails.email], (error) => {
      // handle error
      handleError(error);
      // delete the employee
      pool.query('DELETE FROM employees WHERE email = $1', [employeeDetails.email], (error1) => {
        // handle error
        handleError(error1);
        done();
      });
    });
  });
});

// view a specific article test
describe('Employee', () => {
  // given an article and an employee
  let articleId;
  let viewSpecificArticleStatus;
  beforeAll((done) => {
    // given a user & an article
    createAndAuthenticateEmployee(employeeDetails, (empToken) => {
      // creating the article
      request.post({
        uri: `${url}/articles`,
        headers: {
          Authorization: `bearer ${empToken}`,
        },
        form: {
          id: employeeId,
          ...articleDetails,
        },
      }, (error4) => {
        // handle error
        handleError(error4);
        // get article id
        pool.query('SELECT id FROM articles WHERE employee_id = $1', [employeeId],
          (error, result) => {
          // handle any error
            handleError(error);
            articleId = result.rows[0].id;
            // when they hit the endpoint GET /articles/:id
            request.get({
              uri: `${url}/articles/${articleId}`,
              headers: {
                Authorization: `bearer ${empToken}`,
              },
              form: {
                id: employeeId,
              },
            }, (error1, _response1, body1) => {
              // handle error
              handleError(error1);
              viewSpecificArticleStatus = parseToJson(body1).status;
              done();
            });
          });
      });
    });
  });
  // then they can view the article
  it('can view specific article', () => {
    expect(viewSpecificArticleStatus).toEqual('success');
  });

  // clean up db after the test
  afterAll((done) => {
    // delete the employee and the article
    delEmployeeAndReferences(employeeDetails.email, 'articles', () => {
      done();
    });
  });
});


// post gifs test
describe('Employee', () => {
  let postGifStatus;
  let gif;
  let gifPublicId;

  beforeAll((done) => {
    // given an authenticated employee & a gif
    createAndAuthenticateEmployee(employeeDetails, (empToken) => {
      const gifUrl = faker.image.avatar();
      // write the gif in fs
      const writeStream = fs.createWriteStream('gif.png');
      request(gifUrl).pipe(writeStream);
      writeStream.on('finish', () => {
        gif = fs.createReadStream('gif.png');
        gif.on('open', () => {
          // when the employee hits the endpoint /gifs
          request.post({
            url: `${url}/gifs`,
            formData: {
              id: employeeId,
              gif,
            },
            headers: {
              Authorization: `bearer ${empToken}`,
            },
          }, (error, _response, body) => {
            handleError(error);
            const bodyJson = JSON.parse(body);

            postGifStatus = bodyJson.status;
            gifPublicId = bodyJson.data.public_id;

            done();
          });
        });
      });
    });
  });

  // then a gif is created
  it('can post a gif', () => {
    expect(postGifStatus).toEqual('success');
  });

  // refresh database
  afterAll((done) => {
    // reset globals
    resetGlobals(globals);
    // delete gifUrl & employee in db
    delEmployeeAndReferences(employeeDetails.email, 'gifs', () => {
      // delete gif from local storage
      fs.unlink('gif.png', () => {
        // delete gif from cloudinary
        cloudinary.v2.uploader.destroy(gifPublicId, () => {
          done();
        });
      });
    });
  });
});

// delete gif test
describe('Employeee', () => {
  let deleteGifStatus;
  let gif;
  let gifId;
  let gifPublicId;

  beforeAll((done) => {
    // given an authenticated employee & a gif
    createAndAuthenticateEmployee(employeeDetails, (empToken) => {
      const gifUrl = faker.image.avatar();
      // write the gif in fs
      const writeStream = fs.createWriteStream('gif.png');
      request(gifUrl).pipe(writeStream);
      writeStream.on('finish', () => {
        gif = fs.createReadStream('gif.png');
        gif.on('open', () => {
          // post the gif
          request.post({
            url: `${url}/gifs`,
            formData: {
              id: employeeId,
              gif,
            },
            headers: {
              Authorization: `bearer ${empToken}`,
            },
          }, (error, _response, body) => {
            handleError(error);
            const bodyJson = JSON.parse(body);
            // cloudinary file public_id
            gifPublicId = bodyJson.data.public_id;
            // get the gif id from db
            pool.query('SELECT id FROM gifs WHERE employee_id = $1', [employeeId],
              (error1, result) => {
                // handle error1
                handleError(error1);
                gifId = result.rows[0].id;
                // when they hit the endpoint DELETE /gif/:id
                request.delete({
                  uri: `${url}/gifs/${gifId}`,
                  headers: {
                    Authorization: `bearer ${empToken}`,
                  },
                  form: {
                    id: employeeId,
                  },
                }, (error2, _response1, body1) => {
                  // handle error2
                  handleError(error2);
                  const body1Json = parseToJson(body1);
                  deleteGifStatus = body1Json.status;
                  done();
                });
              });
          });
        });
      });
    });
  });

  // the gif gets deleted
  it('can delete a gif', () => {
    expect(deleteGifStatus).toEqual('success');
  });

  // refresh database
  afterAll((done) => {
    // reset globals
    resetGlobals(globals);
    // delete gifUrl & employee in db
    delEmployeeAndReferences(employeeDetails.email, 'gifs', () => {
      // delete gif from local storage
      fs.unlink('gif.png', () => {
        // delete gif from cloudinary
        cloudinary.v2.uploader.destroy(gifPublicId, () => {
          done();
        });
      });
    });
  });
});

// comment on another employee's gif
describe('Employee', () => {
  let commentGifStatus;
  let gif;
  let gifId;
  let gifPublicId;

  beforeAll((done) => {
    // given an authenticated employee & a gif
    createAndAuthenticateEmployee(employeeDetails, (empToken) => {
      const gifUrl = faker.image.avatar();
      // write the gif in fs
      const writeStream = fs.createWriteStream('gif.png');
      request(gifUrl).pipe(writeStream);
      writeStream.on('finish', () => {
        gif = fs.createReadStream('gif.png');
        gif.on('open', () => {
          // post the gif
          request.post({
            url: `${url}/gifs`,
            formData: {
              id: employeeId,
              gif,
            },
            headers: {
              Authorization: `bearer ${empToken}`,
            },
          }, (error, _response, body) => {
            handleError(error);
            const bodyJson = JSON.parse(body);
            // cloudinary file public_id
            gifPublicId = bodyJson.data.public_id;
            // get the gif id from db
            pool.query('SELECT id FROM gifs WHERE employee_id = $1', [employeeId],
              (error1, result) => {
                // handle error1
                handleError(error1);
                gifId = result.rows[0].id;
                // create & authenticate second empoyee who'll comment
                createAndAuthenticateEmployee(secondEmployee, (empToken1) => {
                  // when they hit the endpoint POST /gifs/:id/comments
                  request.post({
                    uri: `${url}/gifs/${gifId}/comments`,
                    headers: {
                      Authorization: `bearer ${empToken1}`,
                    },
                    form: {
                      id: employeeId,
                      comment: 'This is a gif comment!',
                    },
                  }, (error2, _response1, body1) => {
                    // handle error2
                    handleError(error2);
                    const body1Json = parseToJson(body1);
                    commentGifStatus = body1Json.status;
                    done();
                  });
                });
              });
          });
        });
      });
    });
  });

  // then a comment is added to the gifs comments
  it('can comment on other employee\'s gifs', () => {
    expect(commentGifStatus).toEqual('success');
  });

  // clean up after test
  afterAll((done) => {
    // delete comment & the employee who posted it
    delEmployeeAndReferences(secondEmployee.email, 'gif_comments', () => {
      // delete gif
      pool.query(`DELETE FROM gifs WHERE employee_id = 
        (SELECT id FROM employees WHERE email = $1)`, [employeeDetails.email], (error) => {
        // handle error
        handleError(error);
        // delete the employee who wrote the article
        pool.query('DELETE FROM employees WHERE email = $1', [employeeDetails.email], (error1) => {
          // handle error
          handleError(error1);
          // delete gif from local storage
          fs.unlink('gif.png', () => {
            // delete gif from cloudinary
            cloudinary.v2.uploader.destroy(gifPublicId, () => {
              done();
            });
          });
        });
      });
    });
    // reset globals
    resetGlobals(globals);
  });
});


// view all gifs test
describe('Employees ', () => {
  let gif;
  let gifPublicId;
  let viewAllGifsStatus;

  beforeAll((done) => {
    // given an authenticated employee & gifs
    createAndAuthenticateEmployee(employeeDetails, (empToken) => {
      const gifUrl = faker.image.avatar();
      // write the gif in fs
      const writeStream = fs.createWriteStream('gif.png');
      request(gifUrl).pipe(writeStream);
      writeStream.on('finish', () => {
        gif = fs.createReadStream('gif.png');
        gif.on('open', () => {
          // post the first gif
          request.post({
            url: `${url}/gifs`,
            formData: {
              id: employeeId,
              gif,
            },
            headers: {
              Authorization: `bearer ${empToken}`,
            },
          }, (error, _response, body) => {
            handleError(error);
            const bodyJson = parseToJson(body);
            // cloudinary file public_id
            gifPublicId = bodyJson.data.public_id;

            // when they hit the endpoint GET /gifs
            request.get({
              uri: `${url}/gifs`,
              headers: {
                Authorization: `bearer ${empToken}`,
              },
              form: {
                id: employeeId,
              },
            }, (error3, _response2, body2) => {
              // handle error
              handleError(error3);
              viewAllGifsStatus = parseToJson(body2).status;
              done();
            });
          });
        });
      });
    });
  });

  // then they can see all gifs
  it('can view all gifs', () => {
    expect(viewAllGifsStatus).toEqual('success');
  });
  // refresh database
  afterAll((done) => {
    // reset globals
    resetGlobals(globals);
    // delete gifUrl & employee in db
    delEmployeeAndReferences(employeeDetails.email, 'gifs', () => {
      // delete gif from local storage
      fs.unlink('gif.png', () => {
        // delete gif from cloudinary
        cloudinary.v2.uploader.destroy(gifPublicId, () => {
          done();
        });
      });
    });
  });
});

// test_employee_can_view_specific_gif
describe('Employee', () => {
  let viewSpecificGifStatus;
  let gif;
  let gifId;
  let gifPublicId;

  // given an employee & articles
  beforeAll((done) => {
    // given an authenticated employee & a gif
    createAndAuthenticateEmployee(employeeDetails, (empToken) => {
      const gifUrl = faker.image.avatar();
      // write the gif in fs
      const writeStream = fs.createWriteStream('gif.png');
      request(gifUrl).pipe(writeStream);
      writeStream.on('finish', () => {
        gif = fs.createReadStream('gif.png');
        gif.on('open', () => {
          // post the gif
          request.post({
            url: `${url}/gifs`,
            formData: {
              id: employeeId,
              gif,
            },
            headers: {
              Authorization: `bearer ${empToken}`,
            },
          }, (error, _response, body) => {
            handleError(error);
            const bodyJson = JSON.parse(body);
            // cloudinary file public_id
            gifPublicId = bodyJson.data.public_id;
            // get the gif id from db
            pool.query('SELECT id FROM gifs WHERE employee_id = $1', [employeeId],
              (error1, result) => {
                // handle error1
                handleError(error1);
                gifId = result.rows[0].id;
                // when the employee hits the endpoint GET /gifs/:id
                request.get({
                  uri: `${url}/gifs/${gifId}`,
                  headers: {
                    Authorization: `bearer ${empToken}`,
                  },
                  form: {
                    id: employeeId,
                  },
                }, (error2, _response1, body1) => {
                  // handle errror
                  handleError(error1);
                  viewSpecificGifStatus = parseToJson(body1).status;
                  done();
                });
              });
          });
        });
      });
    });
  });
  // then they view the specific gif
  it('can view a specific gif', () => {
    expect(viewSpecificGifStatus).toEqual('success');
  });

  // clean up db after test
  afterAll((done) => {
    // delete gif & the employee
    delEmployeeAndReferences(employeeDetails.email, 'gifs', () => {
      // delete gif from local storage
      fs.unlink('gif.png', () => {
        // delete gif from cloudinary
        cloudinary.v2.uploader.destroy(gifPublicId, () => {
          done();
        });
      });
    });
    // reset globals
    resetGlobals(globals);
  });
});

// test employee can view feed
describe('Employee', () => {
  let feedStatus;
  let gif;
  let gifPublicId;
  beforeAll((done) => {
    // given an employee & gifs & posts
    createAndAuthenticateEmployee(employeeDetails, (empToken) => {
      const gifUrl = faker.image.avatar();
      // write the gif in fs
      const writeStream = fs.createWriteStream('gif.png');
      request(gifUrl).pipe(writeStream);
      writeStream.on('finish', () => {
        gif = fs.createReadStream('gif.png');
        gif.on('open', () => {
          // post the gif
          request.post({
            url: `${url}/gifs`,
            formData: {
              id: employeeId,
              gif,
            },
            headers: {
              Authorization: `bearer ${empToken}`,
            },
          }, (error, _response, body) => {
            handleError(error);
            const bodyJson = JSON.parse(body);
            // cloudinary file public_id
            gifPublicId = bodyJson.data.public_id;
            // get the gif id from db
            pool.query('SELECT id FROM gifs WHERE employee_id = $1', [employeeId],
              (error1, result) => {
                // handle error1
                handleError(error1);
                gifId = result.rows[0].id;
                // creating the article
                request.post({
                  uri: `${url}/articles`,
                  headers: {
                    Authorization: `bearer ${empToken}`,
                  },
                  form: {
                    id: employeeId,
                    ...articleDetails,
                  },
                }, (error4) => {
                  // handle error
                  handleError(error4);
                  // when they hit the endpoint GET /feed
                  request.get({
                    uri: `${url}/feed`,
                    headers: {
                      Authorization: `bearer ${empToken}`,
                    },
                    form: {
                      id: employeeId,
                    },
                  }, (error5, _response3, body3) => {
                    // handle error
                    handleError(error5);
                    feedStatus = parseToJson(body3).status;
                    done();
                  });
                });
              });
          });
        });
      });
    });
  });
  // then they view gifs & posts
  it('can view feed of gifs & articles', () => {
    expect(feedStatus).toEqual('success');
  });

  // clean up db after test
  afterAll((done) => {
    // delete the article
    pool.query('DELETE FROM articles WHERE employee_id = $1', [employeeId], (error) => {
      // handle error
      handleError(error);
      // delete gif & the employee
      delEmployeeAndReferences(employeeDetails.email, 'gifs', () => {
      // delete gif from local storage
        fs.unlink('gif.png', () => {
        // delete gif from cloudinary
          cloudinary.v2.uploader.destroy(gifPublicId, () => {
          // reset globals
            resetGlobals(globals);
            done();
          });
        });
      });
    });
  });
});

const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.USER,
  password: process.env.PASS,
  host: process.env.HOST,
  database: process.env.NAME
});

/// Users

/**
 * Get a single user from the database given their email.
 * @param {String} email The email of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithEmail = function(email) {
  return pool
    .query(`SELECT * FROM users WHERE email = $1`, [email])
    .then((result) => {
      return result.rows[0] ? result.rows[0] : null;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithEmail = getUserWithEmail;

/**
 * Get a single user from the database given their id.
 * @param {string} id The id of the user.
 * @return {Promise<{}>} A promise to the user.
 */
const getUserWithId = function(id) {
  return pool
    .query(`SELECT * FROM users WHERE id = $1`, [id])
    .then((result) => {
      return result.rows[0] ? result.rows[0] : null;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getUserWithId = getUserWithId;


/**
 * Add a new user to the database.
 * @param {{name: string, password: string, email: string}} user
 * @return {Promise<{}>} A promise to the user.
 */
const addUser =  function(user) {
  return pool
    .query(`
    INSERT INTO users (name, email, password)
    VALUES ($1, $2, $3)
    RETURNING *
    `, [user.name, user.email, user.password])
    .then((result) => {
      return result.rows[0];
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.addUser = addUser;

/// Reservations

/**
 * Get all reservations for a single user.
 * @param {string} guest_id The id of the user.
 * @return {Promise<[{}]>} A promise to the reservations.
 */
const getAllReservations = function(guest_id, limit = 10) {
  return pool
    .query(`
    SELECT reservations.id, properties.title, start_date, cost_per_night, AVG(rating) AS average_rating
    FROM properties
    INNER JOIN reservations ON properties.id = property_id
    JOIN property_reviews ON reservations.id = reservation_id
    WHERE reservations.guest_id = $1
    GROUP BY properties.id, reservations.id
    ORDER BY start_date
    LIMIT $2;
    `, [guest_id, limit])
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllReservations = getAllReservations;

/// Properties

/**
 * Get all properties.
 * @param {{}} options An object containing query options.
 * @param {*} limit The number of results to return.
 * @return {Promise<[{}]>}  A promise to the properties.
 */
const getAllProperties = function(options, limit = 10) {
  const queryParams = [];
  let queryString = `
  SELECT properties.*, AVG(rating) AS average_rating
  FROM properties
  INNER JOIN property_reviews ON property_id = properties.id
  `;
  console.log('initial query:', queryString, queryParams);

  if (options.city) {
    queryParams.push(`${options.city}`);
    queryString += `AND city = $${queryParams.length} `;
    // console.log('city:', queryString, queryParams);
  }

  if(options.owner_id) {
    queryParams.push(`${options.owner_id}`);
    queryString += `AND owner_id = $${queryParams.length} `;
    // console.log('owner_id:', queryString, queryParams);
  }

  if(options.minimum_price_per_night) {
    const min_price = 100 * Number.parseFloat(options.minimum_price_per_night);
    queryParams.push(`${min_price}`);
    queryString += `AND cost_per_night >= $${queryParams.length} `;
    // console.log('min_price:', queryString, queryParams);
  }

  if(options.maximum_price_per_night) {
    const max_price = 100 * Number.parseFloat(options.maximum_price_per_night);
    queryParams.push(`${max_price}`);
    queryString += `AND cost_per_night <= $${queryParams.length} `;
    // console.log('max_price:', queryString, queryParams);
  }

  if(Number.parseFloat(options.minimum_rating)) {
    const minimum_rating = Number.parseFloat(options.minimum_rating);
    queryParams.push(`${minimum_rating}`);
    queryString += `
    GROUP BY properties.id
    HAVING AVG(rating) >= $${queryParams.length} 
    `;
    queryParams.push(limit);
    queryString += `
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
    // console.log('Final query w/ min_rating:', queryString, queryParams);
  } else {
    queryParams.push(limit);
    queryString += `
    GROUP BY properties.id
    ORDER BY cost_per_night
    LIMIT $${queryParams.length};
    `;
    // console.log('Final query W/O min_rating:', queryString, queryParams);
  }

  return pool
    .query(queryString, queryParams)
    .then((result) => {
      return result.rows;
    })
    .catch((err) => {
      console.log(err.message);
    });
};
exports.getAllProperties = getAllProperties;


/**
 * Add a property to the database
 * @param {{}} property An object containing all of the property details.
 * @return {Promise<{}>} A promise to the property.
 */
const addProperty = function(property) {
  const propertyId = Object.keys(properties).length + 1;
  property.id = propertyId;
  properties[propertyId] = property;
  return Promise.resolve(property);
};
exports.addProperty = addProperty;
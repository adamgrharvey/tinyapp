const getUserByEmail = function(email, database) {
  let val = Object.values(database);
  for (let i = 0; i < val.length; i++) {
    if (val[i].email === email) {
      // if we find the user, return that user object.
      return database[val[i].user_id];
    }
  }
  // else return null;
  return null;
};

const generateRandomString = function() {
  let out = Math.random().toString(36).slice(2);
  return out.substring(0,6);
};


const urlsForUser = function(id, database) {
  let keys = Object.keys(database);
  let outObj = {};

  for (const key of keys) {
    if (database[key].userID === id) {
      outObj[key] = database[key];
    }
  }
  return outObj;

};

module.exports = {getUserByEmail, urlsForUser, generateRandomString};
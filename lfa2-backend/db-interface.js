var Connection = require('tedious').Connection
var Request = require('tedious').Request

// var fs = require('fs')
require('dotenv').config()

console.log(`DB: ${process.env.DB}`)
// todo: should fail gracefully if DB is undefined

module.exports =  class Db {
  constructor() {
    const config = {
      authentication: {
        options: {
          userName: process.env.DB_USERNAME,
          password: process.env.DB_PASSWORD
        },
        type: "default"
      },
      server: "cdc0uyw7bh.database.windows.net",
      options: {
        database: process.env.DB,
        encrypt: true,
        rowCollectionOnRequestCompletion: true
      }
    };

    config.options.requestTimeout = 30 * 1000;
    config.options.debug = {
      data: true,
      payload: false,
      token: false,
      packet: true,
      log: true
    }

    this.connection = new Connection(config);
    this.connection.on('connect', connected);
    this.connection.on('infoMessage', infoError);
    this.connection.on('errorMessage', infoError);
    this.connection.on('end', end);
    this.connection.on('debug', debug);

    this.connection2 = new Connection(config)
    this.connection.on('connect', connected);
    this.connection.on('infoMessage', infoError);
    this.connection.on('errorMessage', infoError);
    this.connection.on('end', end);
    this.connection.on('debug', debug);
  }

  constructRequest(parameterizedQuery, callback) {
    parameterizedQuery = parameterizedQuery.toString()
    
    let request = new Request(parameterizedQuery, (err, rowCount, rows) => {
      if (err) {
        console.log('Statement failed: ' + err);
        callback(err)
      } else {
        // handle results of the request
        const results = processResults(rows)
        callback(results)
      }
    })
    
    return request
  }

  getData(request) {
    this.exec(request)
  }
  
  exec(request) {  
    // if state.name is LoggedIn conn1 is free
    if (this.connection.state.name === 'LoggedIn') {
      this.connection.execSql(request);
    } else { // otherwise use connection 2
      this.connection2.execSql(request)
    }
    // todo - create *new* connection on the fly as backup, but shouldn't need it
    // should alert someone if this happens...
  }
}

function connected(err) {
  if (err) {
    console.log(err);
    process.exit(1);
  }

  console.log('connected');

  process.stdin.resume();

  process.stdin.on('data', function (chunk) {
    exec(chunk);
  })
}

function processResults(rows) {
  formattedResults = []
  rows.forEach((row) => {
    formattedRow = {}
    row.forEach((column) => {
      if (column.value === null) {
        value = 'NULL';
      } else {
        value = column.value;
      }
      name = column.metadata.colName
      formattedRow[name] = column.value
    })
    formattedResults.push(formattedRow)
  })
  return formattedResults
}

function end() {
  console.log('Connection closed');
  process.exit(0);
}

function infoError(info) {
  console.log(info.number + ' : ' + info.message);
}

function debug(message) {
  //console.log(message);
}

function columnMetadata(columnsMetadata) {
  columnsMetadata.forEach(function (column) {
    //console.log(column);
  });
}

function row(columns) {
  var values = '';

  columns.forEach(function (column) {
    if (column.value === null) {
      value = 'NULL';
    } else {
      value = column.value;
    }

    values += value + '\t';
  });
}
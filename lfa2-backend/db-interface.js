const sql = require('mssql')
require('dotenv').config()

console.log(`DB: ${process.env.DB}`)

const config = {
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  server: 'cdc0uyw7bh.database.windows.net',
  database: process.env.DB,
  options: {
    encrypt: true,
    requestTimeout: 30000
  },
  pool: {
    max: 5,
    min: 1
  }
}

const pool = new sql.ConnectionPool(config)
const poolConnect = pool.connect()

poolConnect.then(() => {
  console.log('connected')
}).catch(err => {
  console.log('DB connection failed:', err)
})

module.exports = { pool, poolConnect, sql }

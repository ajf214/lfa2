const { Pool } = require('pg')
require('dotenv').config()

const useManagedIdentity = process.env.USE_MANAGED_IDENTITY === 'true'

async function createPool() {
  const baseConfig = {
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'lfa_dev',
    port: parseInt(process.env.DB_PORT || '5432'),
    ssl: process.env.DB_HOST ? { rejectUnauthorized: true } : false,
    max: 5,
    min: 1,
  }

  if (useManagedIdentity) {
    const { DefaultAzureCredential } = require('@azure/identity')
    const credential = new DefaultAzureCredential()
    const token = await credential.getToken('https://ossrdbms-aad.database.windows.net/.default')
    baseConfig.user = process.env.AZURE_CLIENT_ID
    baseConfig.password = token.token
    console.log('Auth mode: managed-identity')
  } else {
    baseConfig.user = process.env.DB_USERNAME
    baseConfig.password = process.env.DB_PASSWORD
    console.log('Auth mode: password')
  }

  console.log(`DB: ${baseConfig.database} @ ${baseConfig.host}`)
  return new Pool(baseConfig)
}

const poolPromise = createPool()

poolPromise
  .then(p => p.query('SELECT 1'))
  .then(() => console.log('connected'))
  .catch(err => console.log('DB connection failed:', err))

module.exports = { poolPromise }

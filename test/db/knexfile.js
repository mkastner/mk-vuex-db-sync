module.exports = {

  client: 'mysql',
  connection: {  
    host: '127.0.0.1',
    port: 3306,
    charset: 'utf8',
    database: 'vuex_dexie_sync_test',
    user:     process.env.DB_USER, 
    password: process.env.DB_USER_PASSWORD 
  },
  pool: {
    min: 2,
    max: 10
  },
  migrations: {
    tableName: 'knex_migrations'
  },
  //debug: true,
  //asyncStackTraces: true

};

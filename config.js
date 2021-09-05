const merge = require('deepmerge')

//satic data to don't have to generate the conf_adata 2 times
let config_data = null

module.exports = function() {
    // if the static data was already set. return it
    if (config_data != null && config_data != undefined) {
    	console.log("config_data is already loaded and return...")
        return config_data
    }

    config_data = {}
    //LOAD JSON
    // if (process.env.NODE_ENV === undefined || process.env.NODE_ENV == null) {
    env_prop = require('./config/config.prod.json')
    config_data = require('./config/config.default.json')
    // } else {
    //     if (process.env.NODE_ENV == 'production') {
    //         config_data = require('./config/config.production.json')
    //     }
    // }

    merged = merge(config_data, env_prop)
    return merged
}
//Get dependencies
const {Datastore} = require('@google-cloud/datastore');
require('dotenv').config();
const ds = new Datastore({
 projectId:process.env.projectId,
 keyFilename: 'sse2021-330922-0d22f75a0d3a.json',
 namespace: 'app' });

const kinds = ['login', 'user', 'quiz', 'question', 'leaderBoard']

// create key for kind
const key = (id, kind) => {
    let stringifiedID = (typeof(id) !== 'string') ? JSON.stringify(id) : id
    return ds.key([kinds[kind], stringifiedID])
}

// get list of entities from given kind
module.exports.list = async (kind) => {
    try {
        const [data] = await ds.createQuery(kinds[kind]).filter('id', '>', -1).run()
        return data 
    } catch (err) {
        return false
    }
    
}

// query to find entity from given kind
module.exports.find = async (id, kind) => {
    try {
        const [data] = await ds.createQuery(kinds[kind]).filter('id', '=', id).run()
        return data 
    } catch (err) {
        console.log(err)
        return false
    }
    
}

// query to get entities from given kind based on the given condition
module.exports.get = async (condition, kind) => {
    try {
        const [data] = await ds.createQuery(kinds[kind]).filter(condition.property, '=', condition.value).run()
        return data 
    } catch (err) {
        console.log(err)
        return false
    }
    
}

// query to create entity
module.exports.put = async (obj, kind) => {
    try {
        const entity = {
            key: key(obj.id, kind),
            data: obj
        }
        await ds.save(entity)

        return entity
    } catch (err) {
        return false
    }
}

// query to delete entity
module.exports.delete = async (id, kind) => {
    try {
        await ds.delete(key(id, kind))
        return true 
    } catch (err) {
        return false
    }
}
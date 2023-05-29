const dbService = require('../../services/db.service')
const logger = require('../../services/logger.service')
const utilService = require('../../services/util.service')
const ObjectId = require('mongodb').ObjectId


async function query(filterBy) {
    console.log(' filter from service query :', filterBy)
    try {
        const criteria = _buildCriteria(filterBy)
        console.log('criteria ', criteria)
        const collection = await dbService.getCollection('gig')
        let query = collection.find(criteria)

        // Add sort option if it exists in filterBy

        if (filterBy.sortBy === 'Delivery Time') {
            query = query.sort({ daysToMake: 1 })
        }
        else if (filterBy.sortBy === 'Highest Rating') {
            query = query.sort({ 'owner.rate': -1 })
        }
        else if (filterBy.sortBy === 'Best price') {
            query = query.sort({ price: 1 })
        }

        const gigs = await query.toArray()
        return gigs
    } catch (err) {
        logger.error('cannot find gigs', err)
        throw err
    }
}





async function getById(gigId) {
    try {
        const collection = await dbService.getCollection('gig')
        const gig = collection.findOne({ _id: ObjectId(gigId) })
        return gig
    } catch (err) {
        logger.error(`while finding gig ${gigId}`, err)
        throw err
    }
}

async function remove(gigId) {
    try {
        const collection = await dbService.getCollection('gig')
        await collection.deleteOne({ _id: ObjectId(gigId) })
        return gigId
    } catch (err) {
        logger.error(`cannot remove gig ${gigId}`, err)
        throw err
    }
}

async function add(gig) {
    try {
        const collection = await dbService.getCollection('gig')
        await collection.insertOne(gig)
        return gig
    } catch (err) {
        logger.error('cannot insert gig', err)
        throw err
    }
}

async function update(gig) {
    try {
        const gigToSave = {
            titler: gig.titler,
            price: gig.price
        }
        const collection = await dbService.getCollection('gig')
        await collection.updateOne({ _id: ObjectId(gig._id) }, { $set: gigToSave })
        return gig
    } catch (err) {
        logger.error(`cannot update gig ${gigId}`, err)
        throw err
    }
}

async function addGigMsg(gigId, msg) {
    try {
        msg.id = utilService.makeId()
        const collection = await dbService.getCollection('gig')
        await collection.updateOne({ _id: ObjectId(gigId) }, { $push: { msgs: msg } })
        return msg
    } catch (err) {
        logger.error(`cannot add gig msg ${gigId}`, err)
        throw err
    }
}

async function removeGigMsg(gigId, msgId) {
    try {
        const collection = await dbService.getCollection('gig')
        await collection.updateOne({ _id: ObjectId(gigId) }, { $pull: { msgs: { id: msgId } } })
        return msgId
    } catch (err) {
        logger.error(`cannot add gig msg ${gigId}`, err)
        throw err
    }
}

module.exports = {
    remove,
    query,
    getById,
    add,
    update,
    addGigMsg,
    removeGigMsg
}


function _buildCriteria(filterBy = { title: '', category: null, DeliveryTime: '', min: '', max: '', sortBy: '' }) {
    const { title, category, min, max, DeliveryTime, sortBy } = filterBy

    const criteria = {}

    // If a title is provided, add a regex search for it
    if (title) {
        criteria.title = { $regex: title, $options: 'i' }
    }

    // If a category is provided, add an elemMatch query for each category
    if (category) {
        // criteria.category = { $elemMatch: { tags: { $in: category } } }
        criteria.tags = { $in: [category] };
    }

    // If a budget range is provided, add a query for it
    if (min && max) {
        criteria.price = {}
        if (min) criteria.price.$gte = Number(min)
        if (max) criteria.price.$lte = Number(max)
    }

    // If a delivery time is provided, add an exact match query for it
    if (DeliveryTime) {

        criteria.daysToMake = { $lte: Number(DeliveryTime) }
    }

    return criteria
}

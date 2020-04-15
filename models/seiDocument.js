const mongoose = require('mongoose');

let seiDocumentSchema = new mongoose.Schema({
    process: String,
    document: String,
    description: String,    
    date: Date
});

let SEIDocument = mongoose.model('SEIDocument', seiDocumentSchema);

module.exports = SEIDocument;